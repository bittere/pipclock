// Durable Object for managing chat room state and WebSocket connections
export class ChatRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = new Map(); // Map of WebSocket -> user info
    this.messageHistory = []; // Store last 50 messages
  }

  async fetch(request) {
    // Handle WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      await this.handleSession(server);

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    return new Response('Expected WebSocket upgrade', { status: 426 });
  }

  async handleSession(websocket) {
    websocket.accept();

    // Generate random goofy alliterated username
    const adjectives = ['Awesome', 'Bouncing', 'Cheeky', 'Dancing', 'Electric', 'Flying', 'Goofy', 'Happy', 'Invisible', 'Jumping', 'Killer', 'Lucky', 'Magic', 'Neon', 'Orange', 'Purple', 'Quiet', 'Running', 'Spooky', 'Tiny', 'Undercover', 'Violet', 'Wild', 'Xtra', 'Yellow', 'Zigzag'];
    const nouns = ['Assassins', 'Bears', 'Cats', 'Dogs', 'Elephants', 'Foxes', 'Ghosts', 'Horses', 'Iguanas', 'Jellyfish', 'Kangaroos', 'Lions', 'Monkeys', 'Ninjas', 'Octopuses', 'Penguins', 'Quails', 'Rabbits', 'Snakes', 'Tigers', 'Unicorns', 'Vampires', 'Wolves', 'Xylophones', 'Yaks', 'Zebras'];
    
    const letterIndex = Math.floor(Math.random() * adjectives.length);
    const adjective = adjectives[letterIndex];
    
    // Find nouns starting with the same letter (or close enough if we want strict alliteration)
    // For simplicity and guaranteed matches, let's just pick a random noun if we don't want strict alliteration, 
    // BUT the user asked for "alliterated names".
    // Let's make sure we have lists that match letters or just use the same index if the lists are aligned by alphabet.
    // My lists above are roughly alphabetical but not perfectly aligned for every letter.
    // Let's use a better approach: grouped by letter.
    
    const alliterations = {
        A: { adj: ['Awesome', 'Angry', 'Atomic', 'Ancient'], noun: ['Ants', 'Apples', 'Aliens', 'Assassins'] },
        B: { adj: ['Bouncing', 'Brave', 'Blue', 'Big'], noun: ['Bears', 'Bananas', 'Birds', 'Badgers'] },
        C: { adj: ['Cheeky', 'Crazy', 'Cool', 'Cosmic'], noun: ['Cats', 'Cookies', 'Cobras', 'Camels'] },
        D: { adj: ['Dancing', 'Dizzy', 'Dark', 'Daring'], noun: ['Dogs', 'Ducks', 'Dragons', 'Dolphins'] },
        E: { adj: ['Electric', 'Epic', 'Eager', 'Evil'], noun: ['Eagles', 'Elves', 'Elephants', 'Eggs'] },
        F: { adj: ['Flying', 'Funny', 'Fast', 'Fuzzy'], noun: ['Foxes', 'Fish', 'Frogs', 'Falcons'] },
        G: { adj: ['Goofy', 'Giant', 'Green', 'Ghostly'], noun: ['Ghosts', 'Goats', 'Goblins', 'Gorillas'] },
        H: { adj: ['Happy', 'Hungry', 'Hyper', 'Heavy'], noun: ['Horses', 'Hippos', 'Heroes', 'Hamsters'] },
        I: { adj: ['Invisible', 'Icy', 'Iron', 'Incredible'], noun: ['Iguanas', 'Insects', 'Impulses', 'Islands'] },
        J: { adj: ['Jumping', 'Jolly', 'Jazz', 'Juicy'], noun: ['Jellyfish', 'Jaguars', 'Jokers', 'Jets'] },
        K: { adj: ['Killer', 'Kind', 'King', 'Krazy'], noun: ['Kangaroos', 'Koalas', 'Kites', 'Knights'] },
        L: { adj: ['Lucky', 'Lazy', 'Little', 'Loud'], noun: ['Lions', 'Lemurs', 'Lizards', 'Leopards'] },
        M: { adj: ['Magic', 'Mad', 'Mega', 'Mystic'], noun: ['Monkeys', 'Mice', 'Moose', 'Monsters'] },
        N: { adj: ['Neon', 'Nice', 'Nasty', 'Noisy'], noun: ['Ninjas', 'Narwhals', 'Newts', 'Nachos'] },
        O: { adj: ['Orange', 'Odd', 'Old', 'Outer'], noun: ['Octopuses', 'Owls', 'Onions', 'Orcs'] },
        P: { adj: ['Purple', 'Pink', 'Proud', 'Punk'], noun: ['Penguins', 'Pandas', 'Parrots', 'Pirates'] },
        Q: { adj: ['Quiet', 'Quick', 'Queen', 'Quirky'], noun: ['Quails', 'Queens', 'Quokkas', 'Questions'] },
        R: { adj: ['Running', 'Red', 'Rapid', 'Royal'], noun: ['Rabbits', 'Robots', 'Rats', 'Raccoons'] },
        S: { adj: ['Spooky', 'Silly', 'Super', 'Sneaky'], noun: ['Snakes', 'Spiders', 'Sharks', 'Sweatpants'] },
        T: { adj: ['Tiny', 'Tough', 'Turbo', 'Teeny'], noun: ['Tigers', 'Turtles', 'Toads', 'Tacos'] },
        U: { adj: ['Undercover', 'Ultra', 'Unique', 'Urban'], noun: ['Unicorns', 'Umbrellas', 'Uncles', 'Urchins'] },
        V: { adj: ['Violet', 'Vivid', 'Virtual', 'Vicious'], noun: ['Vampires', 'Vikings', 'Voices', 'Vehicles'] },
        W: { adj: ['Wild', 'Wet', 'White', 'Wise'], noun: ['Wolves', 'Whales', 'Wizards', 'Worms'] },
        X: { adj: ['Xtra', 'Xenon', 'Xeric'], noun: ['Xylophones', 'X-rays'] },
        Y: { adj: ['Yellow', 'Young', 'Yummy'], noun: ['Yaks', 'Yoyos', 'Yetis'] },
        Z: { adj: ['Zigzag', 'Zany', 'Zooming'], noun: ['Zebras', 'Zombies', 'Zones'] }
    };

    const letters = Object.keys(alliterations);
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];
    const data = alliterations[randomLetter];
    const randomAdj = data.adj[Math.floor(Math.random() * data.adj.length)];
    const randomNoun = data.noun[Math.floor(Math.random() * data.noun.length)];
    
    const username = `${randomAdj} ${randomNoun}`;

    const session = {
      websocket,
      username,
      joinedAt: Date.now(),
    };

    this.sessions.set(websocket, session);

    // Send message history to new user
    websocket.send(JSON.stringify({
      type: 'history',
      messages: this.messageHistory,
    }));

    // Send current user info
    websocket.send(JSON.stringify({
      type: 'user_info',
      username: username,
    }));

    // Notify others of new user
    this.broadcast({
      type: 'user_joined',
      username: username,
      timestamp: Date.now(),
      userCount: this.sessions.size,
    }, websocket);

    // Send user count to the new user
    websocket.send(JSON.stringify({
      type: 'user_count',
      count: this.sessions.size,
    }));

    // Handle incoming messages
    websocket.addEventListener('message', async (msg) => {
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
  broadcast(message, excludeWebSocket = null) {
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
