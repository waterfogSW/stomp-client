import dynamic from 'next/dynamic';

const WebSocketClient = dynamic(() => import('./websocket-client'), { ssr: false });

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-4xl font-bold mb-8">WebSocket Protobuf Client Demo</h1>
      <WebSocketClient />
    </main>
  );
}
