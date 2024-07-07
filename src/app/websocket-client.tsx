'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import * as protobuf from 'protobufjs';
import { ThemeProvider } from 'styled-components';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { lightTheme, darkTheme } from '../styles/theme';

type ProtoMessage = protobuf.Message<{[k: string]: any}> & {
  $type: protobuf.Type;
  toJSON(): { [k: string]: any };
};

interface MessageItem {
  type: 'sent' | 'received';
  content: string;
  timestamp: Date;
}

const WebSocketClient: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [serverUrl, setServerUrl] = useState<string>('');
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [protoFile, setProtoFile] = useState<File | null>(null);
  const [messageType, setMessageType] = useState<protobuf.Type | null>(null);
  const [publishChannel, setPublishChannel] = useState<string>('/app/sendMessage');
  const [subscribeChannels, setSubscribeChannels] = useState<string[]>([]);
  const [newSubscribeChannel, setNewSubscribeChannel] = useState<string>('');
  const [messageInput, setMessageInput] = useState<string>('');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const clientRef = useRef<Client | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const connectToServer = async () => {
    if (clientRef.current) {
      await clientRef.current.deactivate();
    }

    const client = new Client({
      brokerURL: serverUrl,
      onConnect: () => {
        console.log('Connected to STOMP server');
        setConnected(true);
        setConnectionError(null);

        subscribeChannels.forEach(channel => {
          client.subscribe(channel, (message: IMessage) => {
            handleIncomingMessage(message.binaryBody as Uint8Array);
          });
        });
      },
      onDisconnect: () => {
        console.log('Disconnected from STOMP server');
        setConnected(false);
      },
      onStompError: (frame) => {
        console.error('STOMP error', frame);
        setConnectionError(`STOMP error: ${frame.headers.message}`);
        setConnected(false);
      },
    });

    clientRef.current = client;
    client.activate();
  };

  const disconnectFromServer = async () => {
    const client = clientRef.current;
    if (client) {
      try {
        await client.deactivate();
        setConnected(false);
        setConnectionError(null);
      } catch (error) {
        console.error('Error disconnecting:', error);
        setConnectionError('Error disconnecting from server');
      }
    }
  };

  const handleProtoFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setProtoFile(file);

      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target && typeof e.target.result === 'string') {
          try {
            const root = await protobuf.parse(e.target.result).root;
            const messageType = root.lookupType("YourMessageType"); // Update this to match your proto definition
            setMessageType(messageType);
          } catch (error) {
            console.error('Error parsing proto file:', error);
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const addSubscribeChannel = () => {
    if (newSubscribeChannel && !subscribeChannels.includes(newSubscribeChannel)) {
      setSubscribeChannels(prev => [...prev, newSubscribeChannel]);
      setNewSubscribeChannel('');

      if (connected && clientRef.current) {
        clientRef.current.subscribe(newSubscribeChannel, (message: IMessage) => {
          handleIncomingMessage(message.binaryBody as Uint8Array);
        });
      }
    }
  };

  const removeSubscribeChannel = (channel: string) => {
    setSubscribeChannels(prev => prev.filter(ch => ch !== channel));
  };

  const sendMessage = () => {
    if (!connected || !messageType || !clientRef.current) return;

    try {
      const jsonMessage = JSON.parse(messageInput);
      const errMsg = messageType.verify(jsonMessage);
      if (errMsg) throw Error(errMsg);

      const message = messageType.create(jsonMessage) as ProtoMessage;
      const encodedMessage = messageType.encode(message).finish();

      clientRef.current.publish({
        destination: publishChannel,
        binaryBody: encodedMessage,
      });

      setMessages(prev => [...prev, { type: 'sent', content: messageInput, timestamp: new Date() }]);
      setMessageInput('');
    } catch (error) {
      console.error('Error sending message:', error);
      setConnectionError(`Error sending message: ${error}`);
    }
  };

  const handleIncomingMessage = (binaryBody: Uint8Array) => {
    if (!messageType) return;

    try {
      const decodedMessage = messageType.decode(binaryBody) as ProtoMessage;
      const jsonMessage = messageType.toObject(decodedMessage);
      const messageContent = JSON.stringify(jsonMessage, null, 2);
      setMessages(prev => [...prev, { type: 'received', content: messageContent, timestamp: new Date() }]);
    } catch (error) {
      console.error('Error decoding message:', error);
      setMessages(prev => [...prev, { type: 'received', content: `Error decoding message: ${error}`, timestamp: new Date() }]);
    }
  };

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <div className="flex h-screen bg-gray-100">
        <div className="flex-1 flex flex-col p-4">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">WebSocket Protobuf Client</h1>

          <Button variant="secondary" onClick={() => setIsDarkMode(!isDarkMode)}>
            Toggle Theme
          </Button>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-xl font-semibold mb-2 text-gray-700">Server Connection</h2>
              <Input
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="Enter WebSocket server URL"
              />
              <div className="flex space-x-2">
                <Button
                  variant="primary"
                  onClick={connectToServer}
                  disabled={connected || !serverUrl}
                >
                  Connect
                </Button>
                <Button
                  variant="secondary"
                  onClick={disconnectFromServer}
                  disabled={!connected}
                >
                  Disconnect
                </Button>
              </div>
            </div>

            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-xl font-semibold mb-2 text-gray-700">Upload Proto File</h2>
              <Input
                type="file"
                onChange={handleProtoFileUpload}
                accept=".proto"
              />
              {protoFile && <p className="text-gray-600">Uploaded: {protoFile.name}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-xl font-semibold mb-2 text-gray-700">Publish Channel</h2>
              <Input
                type="text"
                value={publishChannel}
                onChange={(e) => setPublishChannel(e.target.value)}
                placeholder="Enter publish channel"
              />
            </div>

            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-xl font-semibold mb-2 text-gray-700">Subscribe Channels</h2>
              <div className="flex mb-2">
                <Input
                  type="text"
                  value={newSubscribeChannel}
                  onChange={(e) => setNewSubscribeChannel(e.target.value)}
                  placeholder="Enter subscribe channel"
                />
                <Button
                  variant="primary"
                  onClick={addSubscribeChannel}
                >
                  Add
                </Button>
              </div>
              <ul className="list-disc pl-5">
                {subscribeChannels.map((channel, index) => (
                  <li key={index} className="flex justify-between items-center mb-2 text-gray-700">
                    {channel}
                    <Button
                      variant="secondary"
                      onClick={() => removeSubscribeChannel(channel)}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex-1 flex">
            <div className="flex-1 bg-white p-4 rounded shadow mr-4">
              <h2 className="text-xl font-semibold mb-2 text-gray-700">Send Message</h2>
              <div className="relative mb-2 flex-1">
                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Enter JSON message"
                  className="w-full h-48 p-2 border rounded font-mono text-gray-800 bg-gray-50"
                  style={{paddingLeft: '3em'}}
                />
                <div className="absolute top-0 left-0 p-2 text-gray-400 select-none pointer-events-none font-mono">
                  {messageInput.split('\n').map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
              </div>
              <Button
                variant="primary"
                onClick={sendMessage}
                disabled={!connected || !messageType}
              >
                Send Message
              </Button>
            </div>

            <div className="flex-1 bg-white p-4 rounded shadow">
              <h2 className="text-xl font-semibold mb-2 text-gray-700">Message History</h2>
              <div className="border rounded p-2 h-64 overflow-y-auto bg-gray-50">
                {messages.map((msg, index) => (
                  <div key={index} className={`mb-2 p-2 rounded ${msg.type === 'sent' ? 'bg-blue-100' : 'bg-green-100'}`}>
                    <div className="text-xs text-gray-500 mb-1">
                      {msg.type === 'sent' ? 'Sent' : 'Received'} at {msg.timestamp.toLocaleTimeString()}
                    </div>
                    <pre className="font-mono text-sm text-gray-800 whitespace-pre-wrap">{msg.content}</pre>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default WebSocketClient;
