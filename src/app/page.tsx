import { Metadata } from 'next';
import dynamic from 'next/dynamic';

const WebSocketClient = dynamic(() => import('./websocket-client'), {
  ssr: false,
  loading: () => <p>Loading WebSocket Client...</p>
});

export const metadata: Metadata = {
  title: 'WebSocket Client',
  description: 'A WebSocket client application for real-time communication',
};

export default function Home() {
  return (
      <main className="flex min-h-screen flex-col">
        <div className="flex-1 w-full">
          <WebSocketClient />
        </div>
      </main>
  );
}
