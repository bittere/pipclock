# PiP Clock with Real-Time Chat

A picture-in-picture clock with integrated real-time chat, CPS tracking, and multiplayer challenge mode.

## 🌟 Features

### Clock
- **Big, clean clock display** using Inter font
- **Picture-in-Picture mode** for a floating clock window that stays on top
- **Dark mode** toggle for comfortable viewing
- **High-resolution rendering** for crisp text in PiP mode

### Real-Time Chat
- **WebSocket-powered** instant messaging
- **Goofy alliterated usernames** (e.g., "Spooky Sweatpants", "Dancing Dolphins")
- **Persistent usernames** across sessions via localStorage
- **Online user counter** showing active participants
- **Message history** (last 50 messages)
- **Auto-clearing** chat history every hour
- **Toast notifications** for new messages when chat is closed
- **Glassmorphism UI** with smooth animations

### CPS Challenge Mode
- **Multiplayer CPS races** - compete with all online users
- **10-second window** to join a challenge
- **5-second clicking race** with personal timer
- **Live leaderboard** showing top scores
- **Beautiful gradient UI** with medals for top 3

### CPS Tracking
- **Click detection** anywhere on the page
- **Real-time CPS calculation** with fun animal comparisons
- **Auto-hide** after inactivity

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

3. **Open in browser:**
   Navigate to `http://localhost:8787`

### Deployment to Cloudflare

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Your commit message"
   git push
   ```

2. **Auto-deploy:**
   The Cloudflare GitHub integration will automatically deploy your changes.

## 💬 Chat Commands

- **Start CPS Challenge:** Click the "🏆 CPS Race" button in the chat input area
- **Join Challenge:** Click "START" when the challenge window opens
- **View Leaderboard:** Automatically shown after the challenge window closes

## 🛠️ Technical Stack

- **Frontend:** Pure HTML, CSS, JavaScript (no framework)
- **Backend:** Cloudflare Workers + Durable Objects
- **WebSockets:** For real-time communication
- **Storage:** localStorage for persistent usernames
- **Deployment:** GitHub → Cloudflare auto-deploy

## 📋 Architecture

```
┌─────────────────┐
│   index.html    │  Frontend (HTML/CSS/JS)
│   - Clock UI    │
│   - Chat UI     │
│   - Challenge   │
└────────┬────────┘
         │ WebSocket
         ↓
┌─────────────────┐
│ Cloudflare      │  Worker (src/index.js)
│ Worker          │  - Routes requests
└────────┬────────┘  - Serves HTML
         │
         ↓
┌─────────────────┐
│ Durable Object  │  ChatRoom (src/ChatRoom.js)
│ (ChatRoom)      │  - Manages WebSocket connections
│                 │  - Stores message history
│                 │  - Handles CPS challenges
└─────────────────┘
```

## 🎨 UI Features

- **Smooth animations** for chat panel, toasts, and challenges
- **Gradient accents** for modern look
- **Responsive design** (380px chat panel)
- **Accessibility** with proper ARIA labels

## 📱 Browser Support

Requires a modern browser with support for:
- Picture-in-Picture API (Chrome, Edge, Safari)
- WebSockets
- localStorage
- CSS backdrop-filter

## 📝 Configuration

### Periodic Chat Clearing

Chat history is automatically cleared every hour. To adjust:

**File:** `src/ChatRoom.js`
```javascript
const oneHour = 60 * 60 * 1000; // Change this value
```

### Challenge Window Duration

Challenge window lasts 10 seconds by default. To adjust:

**File:** `src/ChatRoom.js`
```javascript
windowDuration: 10000 // Change to desired milliseconds
```

## 🤝 Contributing

This is a personal project, but suggestions are welcome!

## 📄 License

MIT License - see LICENSE file for details
