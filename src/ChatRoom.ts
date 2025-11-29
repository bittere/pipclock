import { DurableObject } from 'cloudflare:workers';

// Durable Object for managing chat room state and WebSocket connections
export class ChatRoom extends DurableObject {
  sessions: Map<WebSocket, any> = new Map();
  messageHistory: any[] = [];
  mathGameHistory: any[] = [];
  lastClearTime: number = Date.now();
  races: Map<string, any> = new Map();
  scores: Map<string, any[]> = new Map(); // raceId -> array of score entries
  scoreTimestamps: Map<string, number> = new Map(); // "raceId:userId" -> timestamp for rate limiting
  mathGameSubmissions: Map<string, any[]> = new Map(); // gameId -> array of submissions
  hangmanGameHistory: any[] = [];
  hangmanSubmissions: Map<string, any[]> = new Map(); // gameId -> array of submissions
  clearInterval: any;
  inactivityTimeout: number = 60 * 1000; // 1 minute
  inactivityCheckInterval: any;
  heartbeatInterval: any;

  constructor(state: DurableObjectState, env: any) {
    super(state, env);

    // Set up periodic message clearing (every hour)
    this.clearInterval = setInterval(() => {
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;

      if (now - this.lastClearTime >= oneHour) {
        this.messageHistory = [];
        this.mathGameHistory = [];
        this.hangmanGameHistory = [];
        this.lastClearTime = now;

        // Notify all users that chat was cleared
        this.broadcast({
          type: 'chat_cleared',
          timestamp: now,
        });
      }
    }, 60 * 60 * 1000); // Check every hour

    // Set up periodic inactivity check (every 15 seconds)
    this.inactivityCheckInterval = setInterval(() => {
      this.checkInactiveClients();
    }, 15 * 1000);

    // Set up heartbeat to keep connections alive (every 20 seconds)
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 20 * 1000);
  }

  sendHeartbeat() {
    const deadConnections: WebSocket[] = [];
    
    for (const [ws, session] of this.sessions) {
      try {
        ws.send(JSON.stringify({ type: 'ping' }));
      } catch (err) {
        // Connection is dead, mark for removal
        deadConnections.push(ws);
      }
    }
    
    // Remove dead connections and broadcast updated count
    for (const ws of deadConnections) {
      const session = this.sessions.get(ws);
      this.sessions.delete(ws);
      
      if (session) {
        this.broadcast({
          type: 'user_left',
          username: session.username,
          timestamp: Date.now(),
          userCount: this.sessions.size,
        });
      }
    }
  }

  checkInactiveClients() {
    const now = Date.now();
    const inactiveWebSockets: WebSocket[] = [];

    for (const [ws, session] of this.sessions) {
      if (now - session.lastActivityTime > this.inactivityTimeout) {
        inactiveWebSockets.push(ws);
      }
    }

    // Close inactive connections
    for (const ws of inactiveWebSockets) {
      try {
        ws.close(1000, 'Inactivity timeout');
      } catch (err) {
        // Connection already closed
      }
      this.sessions.delete(ws);
    }
  }

  async fetch(request: Request): Promise<Response> {
    // Handle WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      await this.handleSession(server as WebSocket);

      return new Response(null, {
        status: 101,
        webSocket: client as any,
      });
    }

    return new Response('Expected WebSocket upgrade', { status: 426 });
  }

  async handleSession(websocket: WebSocket) {
    websocket.accept();

    let username: string | null = null;
    let isRegistered = false;
    let session: any = null;

    // Helper function to generate random username
    const generateUsername = () => {
      const alliterations: Record<string, any> = {
        A: { adj: ['Absurd', 'Awkward', 'Anxious', 'Angry'], noun: ['Armadillos', 'Avocados', 'Accordions', 'Anchovies'] },
        B: { adj: ['Bamboozled', 'Beefy', 'Bonkers', 'Burpy'], noun: ['Burritos', 'Baboons', 'Bagpipes', 'Biscuits'] },
        C: { adj: ['Confused', 'Chunky', 'Caffeinated', 'Clumsy'], noun: ['Cabbages', 'Chihuahuas', 'Coconuts', 'Cactus'] },
        D: { adj: ['Derpy', 'Dramatic', 'Doughy', 'Drippy'], noun: ['Donuts', 'Dumplings', 'Doorknobs', 'Dingoes'] },
        E: { adj: ['Existential', 'Exploding', 'Eccentric', 'Elastic'], noun: ['Eggplants', 'Earlobes', 'Elbows', 'Emus'] },
        F: { adj: ['Flabby', 'Funky', 'Ferocious', 'Fluffy'], noun: ['Flamingos', 'Fajitas', 'Fungus', 'Ferrets'] },
        G: { adj: ['Grumpy', 'Greasy', 'Giggly', 'Glitchy'], noun: ['Giraffes', 'Gherkins', 'Goblins', 'Grandmas'] },
        H: { adj: ['Hysterical', 'Hairy', 'Hollow', 'Hypnotic'], noun: ['Hamsters', 'Hotdogs', 'Hedgehogs', 'Hipsters'] },
        I: { adj: ['Irrational', 'Itchy', 'Inverted', 'Invisible'], noun: ['Iguanas', 'Icebergs', 'Insects', 'Impostors'] },
        J: { adj: ['Jiggly', 'Jazzy', 'Jittery', 'Judgmental'], noun: ['Jellybeans', 'Jackrabbits', 'Jalapenos', 'Jumpsuits'] },
        K: { adj: ['Kooky', 'Knobbly', 'Knotty', 'Klutzy'], noun: ['Kangaroos', 'Kazoos', 'Kebabs', 'Kittens'] },
        L: { adj: ['Lumpy', 'Loopy', 'Lazy', 'Long'], noun: ['Llamas', 'Lobsters', 'Loaves', 'Lemons'] },
        M: { adj: ['Mushy', 'Manic', 'Moist', 'Melodramatic'], noun: ['Muffins', 'Meatballs', 'Manatees', 'Mustaches'] },
        N: { adj: ['Nervous', 'Noodle', 'Naughty', 'Noisy'], noun: ['Narwhals', 'Nuggets', 'Ninjas', 'Noses'] },
        O: { adj: ['Oddball', 'Oily', 'Overcooked', 'Obnoxious'], noun: ['Ostriches', 'Onions', 'Omelets', 'Octopuses'] },
        P: { adj: ['Pudgy', 'Panic', 'Peculiar', 'Potato'], noun: ['Pickles', 'Pigeons', 'Pancakes', 'Poodles'] },
        Q: { adj: ['Queasy', 'Quirky', 'Questionable', 'Quivering'], noun: ['Quokkas', 'Quesadillas', 'Quacks', 'Queens'] },
        R: { adj: ['Round', 'Rusty', 'Rebellious', 'Roasted'], noun: ['Raccoons', 'Ravioli', 'Roosters', 'Radishes'] },
        S: { adj: ['Soggy', 'Spicy', 'Squeaky', 'Suspicious'], noun: ['Sausages', 'Sloths', 'Squirrels', 'Sandwiches'] },
        T: { adj: ['Tubby', 'Twitchy', 'Tasty', 'Terrified'], noun: ['Toasters', 'Turnips', 'Tacos', 'Turkeys'] },
        U: { adj: ['Unhinged', 'Unwashed', 'Useless', 'Unlucky'], noun: ['Unicorns', 'Underwear', 'Utensils', 'Uncles'] },
        V: { adj: ['Violent', 'Vague', 'Vengeful', 'Vegetarian'], noun: ['Vultures', 'Vacuums', 'Vegetables', 'Velociraptors'] },
        W: { adj: ['Wobbly', 'Wiggly', 'Whiny', 'Wrinkly'], noun: ['Walruses', 'Waffles', 'Weasels', 'Wombats'] },
        X: { adj: ['Xtra', 'Xenon', 'Xeric'], noun: ['Xylophones', 'X-rays'] },
        Y: { adj: ['Yelling', 'Yeasty', 'Yawning', 'Yucky'], noun: ['Yetis', 'Yogurts', 'Yams', 'Yoyos'] },
        Z: { adj: ['Zesty', 'Zonked', 'Zigzag', 'Zealous'], noun: ['Zombies', 'Zucchinis', 'Zebras', 'Zippers'] },
      };

      const letters = Object.keys(alliterations);
      const randomLetter = letters[Math.floor(Math.random() * letters.length)];
      const data = alliterations[randomLetter];
      const randomAdj = data.adj[Math.floor(Math.random() * data.adj.length)];
      const randomNoun = data.noun[Math.floor(Math.random() * data.noun.length)];
      return `${randomAdj} ${randomNoun}`;
    };

    // Listen for register message
    websocket.addEventListener('message', async (msg: any) => {
      try {
        const data = JSON.parse(msg.data);

        // Handle register message to officially join
        if (data.type === 'register') {
          if (isRegistered) return; // Already registered
          isRegistered = true;

          username = data.username || generateUsername();

          session = {
            websocket,
            username,
            joinedAt: Date.now(),
            lastActivityTime: Date.now(),
          };

          this.sessions.set(websocket, session);

          // Send message history to new user
           websocket.send(
             JSON.stringify({
               type: 'history',
               messages: this.messageHistory,
               mathGames: this.mathGameHistory,
               hangmanGames: this.hangmanGameHistory,
             })
           );

          // Send current user info
          websocket.send(
            JSON.stringify({
              type: 'user_info',
              username: username,
            })
          );

          // Send current online count to the new user
          websocket.send(
            JSON.stringify({
              type: 'user_count',
              userCount: this.sessions.size,
            })
          );

          // Send active races to new user
          for (const [raceId, race] of this.races.entries()) {
            // Send race started message
            websocket.send(
              JSON.stringify({
                type: 'interactive_race',
                raceId: raceId,
                timestamp: race.startTime,
              })
            );

            // Send current leaderboard for this race if it exists
            if (this.scores.has(raceId)) {
              const raceScores = this.scores.get(raceId)!;
              const leaderboard = raceScores
                .sort((a: any, b: any) => {
                  if (b.score !== a.score) {
                    return b.score - a.score;
                  }
                  return a.timestamp - b.timestamp;
                })
                .slice(0, 50)
                .map((entry: any) => ({
                  username: entry.username,
                  score: entry.score,
                }));

              websocket.send(
                JSON.stringify({
                  type: 'leaderboard_update',
                  raceId: raceId,
                  leaderboard: leaderboard,
                })
              );
            }
          }

          // Broadcast to all that someone joined
          this.broadcast({
            type: 'user_joined',
            username: username,
            timestamp: Date.now(),
            userCount: this.sessions.size,
          });
          return;
        }

        // If not registered yet, ignore other messages
        if (!isRegistered || !session) return;

        // Update activity time
        session.lastActivityTime = Date.now();

        if (data.type === 'pong') {
          // Client responded to ping, connection is alive
          return;
        } else if (data.type === 'disconnect') {
          // Client is explicitly disconnecting
          websocket.close(1000, 'Client disconnect');
          return;
        } else if (data.type === 'message') {
          const message = {
            type: 'message',
            username: username,
            text: data.text,
            timestamp: Date.now(),
          };

          // Store in history (keep last 50)
          this.messageHistory.push(message);
          if (this.messageHistory.length > 50) {
            this.messageHistory.shift();
          }

          // Broadcast to all users
          this.broadcast(message);
        } else if (data.type === 'init_race') {
          // Create a new race
          const raceId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

          this.races.set(raceId, {
            scores: new Map(),
            startTime: Date.now(),
          });

          // Broadcast race widget to all
          this.broadcast({
            type: 'interactive_race',
            raceId: raceId,
            timestamp: Date.now(),
          });

          // Auto-cleanup race after 2 minutes
          setTimeout(() => {
            this.races.delete(raceId);
            this.scores.delete(raceId);
            // Also clear rate limit timestamps for this race
            const keysToDelete: string[] = [];
            for (const [key] of this.scoreTimestamps) {
              if (key.startsWith(`${raceId}:`)) {
                keysToDelete.push(key);
              }
            }
            keysToDelete.forEach(key => this.scoreTimestamps.delete(key));
          }, 120000);
        } else if (data.type === 'submit_score') {
          // Handle score submission
          const { raceId, score } = data;
          
          // Validation
          if (typeof score !== 'number' || isNaN(score) || !isFinite(score)) {
            websocket.send(JSON.stringify({
              type: 'error',
              code: 'INVALID_SCORE',
              message: 'Score must be a valid number',
            }));
            return;
          }

          if (score < 0 || score > 100) {
            websocket.send(JSON.stringify({
              type: 'error',
              code: 'INVALID_SCORE',
              message: 'Score must be between 0 and 100',
            }));
            return;
          }

          // Check if race exists
          if (!this.races.has(raceId)) {
            websocket.send(JSON.stringify({
              type: 'error',
              code: 'RACE_NOT_FOUND',
              message: 'Race does not exist or has ended',
            }));
            return;
          }

          // Rate limiting: check if user already submitted for this race recently
          const rateKey = `${raceId}:${username}`;
          const lastSubmissionTime = this.scoreTimestamps.get(rateKey);
          const now = Date.now();
          
          if (lastSubmissionTime && now - lastSubmissionTime < 10000) { // 10 second cooldown
            websocket.send(JSON.stringify({
              type: 'error',
              code: 'RATE_LIMITED',
              message: 'Please wait before submitting another score',
            }));
            return;
          }

          // Store the score entry
          const scoreEntry = {
            username: username,
            score: parseFloat(score.toFixed(2)),
            timestamp: now,
            userId: session.websocket, // Using websocket as unique identifier
          };

          // Initialize race scores array if needed
          if (!this.scores.has(raceId)) {
            this.scores.set(raceId, []);
          }

          // Check for duplicate submission from same user in this race
          const raceScores = this.scores.get(raceId)!;
          const existingIndex = raceScores.findIndex((s: any) => s.username === username);
          
          if (existingIndex >= 0) {
            // Update existing score
            raceScores[existingIndex] = scoreEntry;
          } else {
            // Add new score
            raceScores.push(scoreEntry);
          }

          // Update rate limit timestamp
          this.scoreTimestamps.set(rateKey, now);

          // Build sorted leaderboard
          const leaderboard = raceScores
            .sort((a: any, b: any) => {
              // Sort by score descending
              if (b.score !== a.score) {
                return b.score - a.score;
              }
              // Tie-breaker: earliest submission first
              return a.timestamp - b.timestamp;
            })
            .slice(0, 50) // Limit to top 50
            .map((entry: any) => ({
              username: entry.username,
              score: entry.score,
            }));

          // Broadcast leaderboard update to all clients
          this.broadcast({
            type: 'leaderboard_update',
            raceId: raceId,
            leaderboard: leaderboard,
          });
        } else if (data.type === 'set_username') {
          // Allow users to set custom username
          const oldUsername = session.username;
          session.username = data.username;
          username = data.username;

          this.broadcast({
            type: 'username_changed',
            oldUsername: oldUsername,
            newUsername: data.username,
            timestamp: Date.now(),
          });
        } else if (data.type === 'typing_start') {
          // Broadcast that user is typing
          this.broadcast(
            {
              type: 'user_typing',
              username: username,
            },
            websocket
          );
        } else if (data.type === 'typing_stop') {
          // Broadcast that user stopped typing
          this.broadcast(
            {
              type: 'user_typing_stop',
              username: username,
            },
            websocket
          );
        } else if (data.type === 'reaction') {
          // Broadcast reaction to all clients
          this.broadcast({
            type: 'reaction',
            messageId: data.messageId,
            emoji: data.emoji,
            username: username,
            count: data.count,
          });
        } else if (data.type === 'init_math_game') {
          // Start a math game
          const gameId = Date.now().toString(36);
          const num1 = Math.floor(Math.random() * 50) + 1;
          const num2 = Math.floor(Math.random() * 50) + 1;
          const operators = ['+', '-', '*'];
          const operator = operators[Math.floor(Math.random() * operators.length)];
          const problem = `${num1} ${operator} ${num2}`;
          let answer;
          switch (operator) {
            case '+': answer = num1 + num2; break;
            case '-': answer = num1 - num2; break;
            case '*': answer = num1 * num2; break;
            default: answer = 0;
          }
          const startTime = Date.now();
          const endTime = startTime + 30000; // 30 seconds

          const gameEvent = {
            type: 'math_game_start',
            gameId,
            problem,
            startTime,
            endTime,
          };

          this.broadcast(gameEvent);

          // Store in history (keep last 20)
          this.mathGameHistory.push(gameEvent);
          if (this.mathGameHistory.length > 20) {
            this.mathGameHistory.shift();
          }

          // Store game state (simple version, just in memory for validation)
          // In a real app, use a map
          (this as any).activeMathGame = {
            gameId,
            answer,
            endTime,
          };

          // Auto-end
          setTimeout(() => {
            if ((this as any).activeMathGame?.gameId === gameId) {
              const endEvent = {
                type: 'math_game_end',
                gameId,
              };
              this.broadcast(endEvent);
              this.mathGameHistory.push(endEvent);
              if (this.mathGameHistory.length > 20) {
                this.mathGameHistory.shift();
              }
              (this as any).activeMathGame = null;
            }
          }, 30000);

        } else if (data.type === 'submit_math_answer') {
           const { gameId, answer, elapsedTime } = data;
           const activeGame = (this as any).activeMathGame;

           if (activeGame && activeGame.gameId === gameId && Date.now() < activeGame.endTime) {
             // Use client-provided elapsed time if available, otherwise calculate server-side
             const timeTaken = elapsedTime !== undefined ? elapsedTime : (Date.now() - (activeGame.endTime - 30000)) / 1000;
             const isCorrect = answer === activeGame.answer;
             
             // Track submission
             if (!this.mathGameSubmissions.has(gameId)) {
               this.mathGameSubmissions.set(gameId, []);
             }
             const submission = {
               username,
               time: timeTaken,
               correct: isCorrect,
               timestamp: Date.now(),
             };
             this.mathGameSubmissions.get(gameId)!.push(submission);
             
             // Build leaderboard (all submissions, sorted by correct first, then by time)
             const submissions = this.mathGameSubmissions.get(gameId)!;
             const leaderboard = submissions
               .sort((a: any, b: any) => {
                 // Sort correct answers first
                 if (b.correct !== a.correct) {
                   return b.correct ? 1 : -1;
                 }
                 // Then by time (fastest first)
                 return a.time - b.time;
               })
               .slice(0, 50)
               .map((entry: any) => ({
                 username: entry.username,
                 time: entry.time,
                 correct: entry.correct,
               }));
             
             // Broadcast leaderboard update
             this.broadcast({
               type: 'math_game_leaderboard_update',
               gameId,
               leaderboard,
             });

             // If correct, also broadcast winner announcement
             if (isCorrect) {
               this.broadcast({
                 type: 'math_game_won',
                 gameId,
                 winner: {
                   username,
                   time: timeTaken,
                 },
               });
             }
           }
         } else if (data.type === 'init_hangman_game') {
            console.log('init_hangman_game received');
            const words = [
              { word: 'PHLEGMATIC', hint: 'Having an unemotional and stolidly calm disposition' },
              { word: 'CACOPHONY', hint: 'A harsh, discordant mixture of sounds' },
              { word: 'EPHEMERAL', hint: 'Lasting for a very short time' },
              { word: 'OBSEQUIOUS', hint: 'Obedient or attentive to an excessive or servile degree' },
              { word: 'QUINTESSENTIAL', hint: 'Representing the most perfect or typical example of a quality or class' },
              { word: 'IDIOSYNCRASY', hint: 'A mode of behavior or way of thought peculiar to an individual' },
              { word: 'SURREPTITIOUS', hint: 'Kept secret, especially because it would not be approved of' },
              { word: 'UBIQUITOUS', hint: 'Present, appearing, or found everywhere' },
              { word: 'VICARIOUS', hint: 'Experienced in the imagination through the feelings or actions of another person' },
              { word: 'ZEALOUS', hint: 'Having or showing great energy or enthusiasm' },
              { word: 'ANEMONE', hint: 'A plant of the buttercup family' },
              { word: 'COLONEL', hint: 'An army officer of high rank' },
              { word: 'ISTHMUS', hint: 'A narrow strip of land with sea on either side' },
              { word: 'MNEMONIC', hint: 'A device that assists in remembering something' },
              { word: 'ONOMATOPOEIA', hint: 'The formation of a word from a sound associated with what is named' },
              { word: 'PHENOMENON', hint: 'A fact or situation that is observed to exist or happen' },
              { word: 'RHYTHM', hint: 'A strong, regular, repeated pattern of movement or sound' },
              { word: 'SYNECDOCHE', hint: 'A figure of speech in which a part is made to represent the whole' },
              { word: 'WORCESTERSHIRE', hint: 'A savory sauce of vinegar and soy sauce' },
              { word: 'XYLOPHONE', hint: 'A musical instrument played by striking a row of wooden bars' }
            ];
            const selection = words[Math.floor(Math.random() * words.length)];
            const gameId = Date.now().toString(36);
            const startTime = Date.now();
            
            const gameEvent = {
              type: 'hangman_game_start',
              gameId,
              word: selection.word,
              hint: selection.hint,
              startTime,
            };

            this.broadcast(gameEvent);
            
            // Store in history
            this.hangmanGameHistory.push({
              ...gameEvent,
              timestamp: startTime,
            });
            if (this.hangmanGameHistory.length > 20) {
              this.hangmanGameHistory.shift();
            }

          } else if (data.type === 'submit_hangman_result') {
            const { gameId, time, correct } = data;
            
            // Track submission
            if (!this.hangmanSubmissions.has(gameId)) {
              this.hangmanSubmissions.set(gameId, []);
            }
            
            const submission = {
              username,
              time,
              correct,
              timestamp: Date.now(),
            };
            
            this.hangmanSubmissions.get(gameId)!.push(submission);
            
            // Build leaderboard (sorted by correct first, then time)
            const submissions = this.hangmanSubmissions.get(gameId)!;
            const leaderboard = submissions
              .sort((a: any, b: any) => {
                if (b.correct !== a.correct) return b.correct ? 1 : -1;
                return a.time - b.time;
              })
              .slice(0, 50)
              .map((entry: any) => ({
                username: entry.username,
                time: entry.time,
                correct: entry.correct,
              }));
              
            this.broadcast({
              type: 'hangman_leaderboard_update',
              gameId,
              leaderboard,
            });
            
            // If won, announce it
            if (correct) {
               this.broadcast({
                 type: 'hangman_game_won',
                 gameId,
                 winner: {
                   username,
                   time
                 }
               });
            }
          }
       } catch (err) {
        console.error('Error processing message:', err);
      }
    });

    // Handle disconnection
    websocket.addEventListener('close', () => {
      this.sessions.delete(websocket);

      if (isRegistered && username) {
        this.broadcast({
          type: 'user_left',
          username: username,
          timestamp: Date.now(),
          userCount: this.sessions.size,
        });
      }
    });

    websocket.addEventListener('error', () => {
      this.sessions.delete(websocket);
    });
  }

  // Broadcast message to all connected clients (except sender if specified)
  broadcast(message: any, excludeWebSocket: WebSocket | null = null) {
    const messageStr = JSON.stringify(message);

    for (const [ws, session] of this.sessions) {
      if (ws !== excludeWebSocket) {
        try {
          ws.send(messageStr);
        } catch (err) {
          // Remove dead connections
          this.sessions.delete(ws);
        }
      }
    }
  }
}
