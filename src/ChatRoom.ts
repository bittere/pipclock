// Durable Object for managing chat room state and WebSocket connections
export class ChatRoom extends DurableObject {
  sessions: Map<WebSocket, any> = new Map();
  messageHistory: any[] = [];
  lastClearTime: number = Date.now();
  races: Map<string, any> = new Map();
  clearInterval: any;

  constructor(state: DurableObjectState, env: any) {
    super(state, env);

    // Set up periodic message clearing (every hour)
    this.clearInterval = setInterval(() => {
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;

      if (now - this.lastClearTime >= oneHour) {
        this.messageHistory = [];
        this.lastClearTime = now;

        // Notify all users that chat was cleared
        this.broadcast({
          type: 'chat_cleared',
          timestamp: now,
        });
      }
    }, 60 * 60 * 1000); // Check every hour
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

    // Wait briefly for client to send username (if they have one saved)
    const usernameTimeout = new Promise<string | null>((resolve) =>
      setTimeout(() => resolve(null), 500)
    );

    const usernamePromise = new Promise<string>((resolve) => {
      const handler = (msg: any) => {
        try {
          const data = JSON.parse(msg.data);
          if (data.type === 'init' && data.username) {
            websocket.removeEventListener('message', handler);
            resolve(data.username);
          }
        } catch (err) {
          // Ignore parse errors
        }
      };
      websocket.addEventListener('message', handler);
    });

    username = await Promise.race([usernamePromise, usernameTimeout]);

    // If no username provided, generate random goofy alliterated username
    if (!username) {
      const alliterations: Record<string, any> = {
        A: {
          adj: ['Absurd', 'Awkward', 'Anxious', 'Angry'],
          noun: ['Armadillos', 'Avocados', 'Accordions', 'Anchovies'],
        },
        B: {
          adj: ['Bamboozled', 'Beefy', 'Bonkers', 'Burpy'],
          noun: ['Burritos', 'Baboons', 'Bagpipes', 'Biscuits'],
        },
        C: {
          adj: ['Confused', 'Chunky', 'Caffeinated', 'Clumsy'],
          noun: ['Cabbages', 'Chihuahuas', 'Coconuts', 'Cactus'],
        },
        D: {
          adj: ['Derpy', 'Dramatic', 'Doughy', 'Drippy'],
          noun: ['Donuts', 'Dumplings', 'Doorknobs', 'Dingoes'],
        },
        E: {
          adj: ['Existential', 'Exploding', 'Eccentric', 'Elastic'],
          noun: ['Eggplants', 'Earlobes', 'Elbows', 'Emus'],
        },
        F: {
          adj: ['Flabby', 'Funky', 'Ferocious', 'Fluffy'],
          noun: ['Flamingos', 'Fajitas', 'Fungus', 'Ferrets'],
        },
        G: {
          adj: ['Grumpy', 'Greasy', 'Giggly', 'Glitchy'],
          noun: ['Giraffes', 'Gherkins', 'Goblins', 'Grandmas'],
        },
        H: {
          adj: ['Hysterical', 'Hairy', 'Hollow', 'Hypnotic'],
          noun: ['Hamsters', 'Hotdogs', 'Hedgehogs', 'Hipsters'],
        },
        I: {
          adj: ['Irrational', 'Itchy', 'Inverted', 'Invisible'],
          noun: ['Iguanas', 'Icebergs', 'Insects', 'Impostors'],
        },
        J: {
          adj: ['Jiggly', 'Jazzy', 'Jittery', 'Judgmental'],
          noun: ['Jellybeans', 'Jackrabbits', 'Jalapenos', 'Jumpsuits'],
        },
        K: {
          adj: ['Kooky', 'Knobbly', 'Knotty', 'Klutzy'],
          noun: ['Kangaroos', 'Kazoos', 'Kebabs', 'Kittens'],
        },
        L: {
          adj: ['Lumpy', 'Loopy', 'Lazy', 'Long'],
          noun: ['Llamas', 'Lobsters', 'Loaves', 'Lemons'],
        },
        M: {
          adj: ['Mushy', 'Manic', 'Moist', 'Melodramatic'],
          noun: ['Muffins', 'Meatballs', 'Manatees', 'Mustaches'],
        },
        N: {
          adj: ['Nervous', 'Noodle', 'Naughty', 'Noisy'],
          noun: ['Narwhals', 'Nuggets', 'Ninjas', 'Noses'],
        },
        O: {
          adj: ['Oddball', 'Oily', 'Overcooked', 'Obnoxious'],
          noun: ['Ostriches', 'Onions', 'Omelets', 'Octopuses'],
        },
        P: {
          adj: ['Pudgy', 'Panic', 'Peculiar', 'Potato'],
          noun: ['Pickles', 'Pigeons', 'Pancakes', 'Poodles'],
        },
        Q: {
          adj: ['Queasy', 'Quirky', 'Questionable', 'Quivering'],
          noun: ['Quokkas', 'Quesadillas', 'Quacks', 'Queens'],
        },
        R: {
          adj: ['Round', 'Rusty', 'Rebellious', 'Roasted'],
          noun: ['Raccoons', 'Ravioli', 'Roosters', 'Radishes'],
        },
        S: {
          adj: ['Soggy', 'Spicy', 'Squeaky', 'Suspicious'],
          noun: ['Sausages', 'Sloths', 'Squirrels', 'Sandwiches'],
        },
        T: {
          adj: ['Tubby', 'Twitchy', 'Tasty', 'Terrified'],
          noun: ['Toasters', 'Turnips', 'Tacos', 'Turkeys'],
        },
        U: {
          adj: ['Unhinged', 'Unwashed', 'Useless', 'Unlucky'],
          noun: ['Unicorns', 'Underwear', 'Utensils', 'Uncles'],
        },
        V: {
          adj: ['Violent', 'Vague', 'Vengeful', 'Vegetarian'],
          noun: ['Vultures', 'Vacuums', 'Vegetables', 'Velociraptors'],
        },
        W: {
          adj: ['Wobbly', 'Wiggly', 'Whiny', 'Wrinkly'],
          noun: ['Walruses', 'Waffles', 'Weasels', 'Wombats'],
        },
        X: {
          adj: ['Xtra', 'Xenon', 'Xeric'],
          noun: ['Xylophones', 'X-rays'],
        },
        Y: {
          adj: ['Yelling', 'Yeasty', 'Yawning', 'Yucky'],
          noun: ['Yetis', 'Yogurts', 'Yams', 'Yoyos'],
        },
        Z: {
          adj: ['Zesty', 'Zonked', 'Zigzag', 'Zealous'],
          noun: ['Zombies', 'Zucchinis', 'Zebras', 'Zippers'],
        },
      };

      const letters = Object.keys(alliterations);
      const randomLetter = letters[Math.floor(Math.random() * letters.length)];
      const data = alliterations[randomLetter];
      const randomAdj = data.adj[Math.floor(Math.random() * data.adj.length)];
      const randomNoun = data.noun[Math.floor(Math.random() * data.noun.length)];

      username = `${randomAdj} ${randomNoun}`;
    }

    const session = {
      websocket,
      username,
      joinedAt: Date.now(),
    };

    this.sessions.set(websocket, session);

    // Send message history to new user
    websocket.send(
      JSON.stringify({
        type: 'history',
        messages: this.messageHistory,
      })
    );

    // Send current user info
    websocket.send(
      JSON.stringify({
        type: 'user_info',
        username: username,
      })
    );

    // Notify others of new user
    this.broadcast(
      {
        type: 'user_joined',
        username: username,
        timestamp: Date.now(),
        userCount: this.sessions.size,
      },
      websocket
    );

    // Send user count to the new user
    websocket.send(
      JSON.stringify({
        type: 'user_count',
        count: this.sessions.size,
      })
    );

    // Handle incoming messages
    websocket.addEventListener('message', async (msg: any) => {
      try {
        const data = JSON.parse(msg.data);

        if (data.type === 'message') {
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
          }, 120000);
        } else if (data.type === 'submit_score') {
          // Handle score submission
          const { raceId, score } = data;
          const race = this.races.get(raceId);

          if (race) {
            race.scores.set(username, score);

            // Calculate leaderboard
            const leaderboard = Array.from(race.scores.entries())
              .map(([user, s]: [string, number]) => ({ username: user, score: s }))
              .sort((a: any, b: any) => b.score - a.score);

            // Broadcast update
            this.broadcast({
              type: 'update_leaderboard',
              raceId: raceId,
              leaderboard: leaderboard,
            });
          }
        } else if (data.type === 'set_username') {
          // Allow users to set custom username
          const oldUsername = session.username;
          session.username = data.username;

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
        }
      } catch (err) {
        console.error('Error processing message:', err);
      }
    });

    // Handle disconnection
    websocket.addEventListener('close', () => {
      this.sessions.delete(websocket);

      this.broadcast({
        type: 'user_left',
        username: username,
        timestamp: Date.now(),
        userCount: this.sessions.size,
      });
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
