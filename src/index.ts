import { ChatRoom } from './ChatRoom.js';

export { ChatRoom };

const handler: ExportedHandler<any> = {
  async fetch(request: Request, env: any) {
    const url = new URL(request.url);

    // Handle WebSocket connections to the chat room
    if (url.pathname === '/chat') {
      // Get or create the chat room Durable Object
      const id = env.CHAT_ROOM.idFromName('global-chat');
      const room = env.CHAT_ROOM.get(id);
      
      return room.fetch(request);
    }

    // For all other routes, serve the index.html (SPA fallback)
    // This lets the frontend router handle navigation
    return env.ASSETS.fetch(request);
  },
};

export default handler;
