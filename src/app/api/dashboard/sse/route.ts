// src/app/api/dashboard/sse/route.ts
// Server-Sent Events for real-time dashboard updates
import { NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

const encoder = new TextEncoder();

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const response = new ReadableStream({
    start(controller) {
      // Send initial connection confirmation
      const sendEvent = (event: string, data: unknown) => {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      sendEvent('connected', { userId: user.userId, timestamp: Date.now() });

      // In a production setup, you'd subscribe to a pub/sub channel here
      // (e.g., Upstash Redis pub/sub or a WebSocket server)
      // For now, we send a heartbeat and the client will poll for updates
      const heartbeat = setInterval(() => {
        sendEvent('ping', { timestamp: Date.now() });
      }, 30000); // 30 second heartbeat

      // Clean up on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        controller.close();
      });
    },
  });

  return new Response(response, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering for Nginx
    },
  });
}