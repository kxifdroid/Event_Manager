import Pusher from 'pusher';
import PusherClient from 'pusher-js';

let pusherServer: Pusher | null = null;

export function getPusherServer() {
  if (!process.env.PUSHER_APP_ID || !process.env.PUSHER_KEY || !process.env.PUSHER_SECRET) {
    return null;
  }
  if (!pusherServer) {
    pusherServer = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER || 'us2',
      useTLS: true,
    });
  }
  return pusherServer;
}

export function getUserChannel(userId: string) {
  return `private-user-${userId}`;
}

export async function sendNotification(
  userId: string,
  event: string,
  data: Record<string, unknown>,
) {
  const pusher = getPusherServer();
  if (!pusher) {
    console.error('Pusher not configured — notification not sent');
    return;
  }
  try {
    await pusher.trigger(getUserChannel(userId), event, data);
  } catch (err) {
    console.error('Pusher trigger failed:', err);
  }
}

export function createPusherClient() {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2';
  if (!key) return null;
  return new PusherClient(key, { cluster });
}
