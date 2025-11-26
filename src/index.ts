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

    // Let Vite handle frontend routes (404 will be caught by Vite)
    return new Response('Not Found', { status: 404 });
  },
};

export default handler;
