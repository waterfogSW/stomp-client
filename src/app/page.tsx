import dynamic from 'next/dynamic';

const WebSocketClient = dynamic(() => import('./websocket-client'), { ssr: false });

export default function Home() {
  return (
      <WebSocketClient />
  );
}
