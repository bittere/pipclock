import { ChatRoom } from './ChatRoom.js';
import indexHTML from '../index.html?raw';

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

    // Serve the main HTML page
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(indexHTML, {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
        },
      });
    }

    return new Response('Not Found', { status: 404 });
  },
};

export default handler;
