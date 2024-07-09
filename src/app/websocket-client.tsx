'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import * as protobuf from 'protobufjs';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';

type ProtoMessage = protobuf.Message<{ [k: string]: any }> & {
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
    },
  });

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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div style={{ display: 'flex', height: '100vh' }}>
          <Paper
              elevation={3}
              style={{
                width: isSidebarOpen ? '33%' : '60px',
                transition: 'width 0.3s',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                padding: '20px',
              }}
          >
            <IconButton onClick={toggleSidebar} style={{ alignSelf: 'flex-end' }}>
              {isSidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </IconButton>
            {isSidebarOpen && (
                <>
                  <h1>WebSocket Client</h1>
                  <Button variant="contained" onClick={() => setIsDarkMode(!isDarkMode)} style={{ marginBottom: '20px' }}>
                    Toggle Theme
                  </Button>
                  <TextField
                      label="Server URL"
                      value={serverUrl}
                      onChange={(e) => setServerUrl(e.target.value)}
                      margin="normal"
                      fullWidth
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <Button variant="contained" onClick={connectToServer} disabled={connected || !serverUrl}>
                      Connect
                    </Button>
                    <Button variant="contained" onClick={disconnectFromServer} disabled={!connected}>
                      Disconnect
                    </Button>
                  </div>
                  <TextField
                      type="file"
                      onChange={handleProtoFileUpload}
                      inputProps={{ accept: '.proto' }}
                      margin="normal"
                      fullWidth
                  />
                  {protoFile && <p>Uploaded: {protoFile.name}</p>}
                  <TextField
                      label="Publish Channel"
                      value={publishChannel}
                      onChange={(e) => setPublishChannel(e.target.value)}
                      margin="normal"
                      fullWidth
                  />
                  <div style={{ display: 'flex', marginBottom: '20px' }}>
                    <TextField
                        label="Subscribe Channel"
                        value={newSubscribeChannel}
                        onChange={(e) => setNewSubscribeChannel(e.target.value)}
                        margin="normal"
                        fullWidth
                    />
                    <Button variant="contained" onClick={addSubscribeChannel} style={{ marginLeft: '10px' }}>
                      Add
                    </Button>
                  </div>
                  <List>
                    {subscribeChannels.map((channel, index) => (
                        <ListItem key={index}>
                          <ListItemText primary={channel} />
                          <ListItemSecondaryAction>
                            <IconButton edge="end" aria-label="delete" onClick={() => removeSubscribeChannel(channel)}>
                              {/* You can add a delete icon here */}
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                  </List>
                  <TextField
                      label="Message"
                      multiline
                      rows={4}
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      margin="normal"
                      fullWidth
                  />
                  <Button variant="contained" onClick={sendMessage} disabled={!connected || !messageType} fullWidth>
                    Send Message
                  </Button>
                </>
            )}
          </Paper>
          <main style={{ flexGrow: 1, padding: '20px', overflow: 'hidden' }}>
            <h2>Message History</h2>
            <TableContainer component={Paper} style={{ maxHeight: 'calc(100vh - 100px)', overflow: 'auto' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Content</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {messages.map((msg, index) => (
                      <TableRow key={index}>
                        <TableCell>{msg.type}</TableCell>
                        <TableCell>{msg.timestamp.toLocaleString()}</TableCell>
                        <TableCell>
                          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>{msg.content}</pre>
                        </TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </main>
        </div>
      </ThemeProvider>
  );
};

export default WebSocketClient;
