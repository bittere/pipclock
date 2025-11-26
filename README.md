# PiP Clock with Real-Time Chat

A modern Picture-in-Picture clock with integrated real-time chat, CPS tracking, and interactive racing challenges. Built with React, TypeScript, and Cloudflare Workers.

## 🌟 Features

### Clock
- **Clean, minimal clock display** with Inter font
- **Picture-in-Picture mode** for a floating clock window that stays on top
- **Dark/Light mode toggle** for comfortable viewing
- **High-resolution canvas rendering** for crisp PiP mode

### Real-Time Chat
- **WebSocket-powered instant messaging** with live updates
- **Auto-generated fun usernames** (stored in localStorage for persistence)
- **Online user counter** showing active participants
- **Message history** displayed in chat panel
- **Smooth glassmorphism UI** with animations

### CPS (Clicks Per Second) Tracking
- **Global click detection** anywhere on the page
- **Real-time CPS calculation** with rolling 1-second window
- **Auto-visibility** - displays CPS when >= 4 clicks/second
- **Auto-hide** after 2 seconds of inactivity

### Interactive Racing
- **Multiplayer CPS races** - compete with all online users
- **Live race leaderboard** with top scores
- **Gradient UI** with visual feedback
- **Real-time leaderboard updates**

## 🚀 Usage

### Local Development

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Start local development server:**
   ```bash
   pnpm run dev
   ```
   Opens on `http://localhost:8787`

3. **Start Wrangler development server (backend only):**
   ```bash
   pnpm run dev:wrangler
   ```

### Build and Deployment

**Build for production:**
```bash
pnpm run build
```

**Deploy to Cloudflare:**
```bash
pnpm run deploy
```

This builds the frontend and deploys to Cloudflare Workers.

## 🛠️ Technical Stack

- **Frontend:** React 19 + TypeScript
- **Styling:** Tailwind CSS 4 + CSS custom properties
- **Build Tool:** Vite 7
- **Backend:** Cloudflare Workers + Durable Objects
- **Real-time:** WebSockets
- **Storage:** Durable Objects (message history), localStorage (username persistence)
- **Deployment:** GitHub → Cloudflare auto-deploy

## 📁 Project Structure

```
pipclock/
├── src/
│   ├── components/          # React components
│   │   ├── Clock.tsx
│   │   ├── ChatPanel.tsx
│   │   ├── CpsDisplay.tsx
│   │   ├── Toast.tsx
│   │   ├── Confetti.tsx
│   │   ├── RaceLeaderboard.tsx
│   │   ├── EnhancedRaceWidget.tsx
│   │   └── ...
│   ├── hooks/               # Custom React hooks
│   │   └── useChat.ts       # WebSocket chat management
│   ├── styles/              # Global styles
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # React entry point
│   ├── index.ts             # Cloudflare Worker handler
│   ├── ChatRoom.ts          # Durable Object for chat management
│   └── index.css            # CSS + Tailwind imports
├── index.html               # HTML entry point
├── vite.config.ts           # Vite + Cloudflare plugin config
├── wrangler.toml            # Cloudflare Workers configuration
├── tailwind.config.ts       # Tailwind configuration
└── package.json             # Dependencies
```

## 🎨 Architecture

The app is split between client-side (React frontend) and server-side (Cloudflare Workers + Durable Objects):

- **Frontend (React):** Clock, chat UI, CPS tracking, race widgets
- **WebSocket Handler:** Routes `/chat` requests to Durable Object
- **Durable Object (ChatRoom):** Maintains WebSocket connections, message history, race state

### WebSocket Message Types
- `message` - Chat messages
- `interactive_race` - Race started event
- `leaderboard_update` - Updated race standings
- `user_count` - Online user count
- `user_info` - Username assigned to client
- `history` - Initial message history on connection

## 🎨 Theming

The app supports light and dark modes via CSS custom properties:

**Dark mode variables:**
- `--bg-color` - Background
- `--text-color` - Text
- `--button-bg` - Button background
- `--button-hover` - Button hover state

Toggle via the moon/sun icon button next to the PiP button.

## 🏃 Racing System

1. User clicks "Start Race" in chat
2. Server broadcasts `interactive_race` event with `raceId`
3. Users can join the race via the race widget
4. 5-second countdown and race window
5. Leaderboard updated in real-time
6. Results displayed after race ends

## 📱 Browser Support

Requires modern browser with:
- React 19 support
- Picture-in-Picture API (Chrome, Edge, Safari)
- WebSockets
- CSS `backdrop-filter` (glassmorphism)
- Canvas API (high-res PiP rendering)

## 📝 Configuration

### Development Server Port
Edit `vite.config.ts`:
```typescript
server: {
  hmr: {
    host: 'localhost',
    port: 8787,  // Change this
  },
},
```

### Worker Binding
Edit `wrangler.toml` to configure Durable Object binding:
```toml
[[durable_objects.bindings]]
name = "CHAT_ROOM"
class_name = "ChatRoom"
```

## 🤝 Contributing

Suggestions and improvements welcome!

## 📄 License

MIT License - see LICENSE file for details
