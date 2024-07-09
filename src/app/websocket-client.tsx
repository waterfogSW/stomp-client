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
import DeleteIcon from '@mui/icons-material/Delete';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';

type ProtoMessage = protobuf.Message<{ [k: string]: any }> & {
  $type: protobuf.Type;
  toJSON(): { [k: string]: any };
};

interface MessageItem {  type: 'sent' | 'received';
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
  const [communicationType, setCommunicationType] = useState<'protobuf' | 'string'>('string');

  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
    },
    shape: {
      borderRadius: 12,
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
            handleIncomingMessage(message.body);
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
          handleIncomingMessage(message.body);
        });
      }
    }
  };

  const removeSubscribeChannel = (channel: string) => {
    setSubscribeChannels(prev => prev.filter(ch => ch !== channel));
  };

  const sendMessage = () => {
    if (!connected || !clientRef.current) return;

    try {
      let messageToSend: string = messageInput;

      if (communicationType === 'protobuf' && messageType) {
        const jsonMessage = JSON.parse(messageInput);
        const errMsg = messageType.verify(jsonMessage);
        if (errMsg) throw Error(errMsg);

        const message = messageType.create(jsonMessage) as ProtoMessage;
        const encodedMessage = messageType.encode(message).finish();
        // Convert Uint8Array to base64 string
        messageToSend = btoa(String.fromCharCode.apply(null, encodedMessage as unknown as number[]));
      }

      clientRef.current.publish({
        destination: publishChannel,
        body: messageToSend,
      });

      setMessages(prev => [...prev, { type: 'sent', content: messageInput, timestamp: new Date() }]);
      setMessageInput('');
    } catch (error) {
      console.error('Error sending message:', error);
      setConnectionError(`Error sending message: ${error}`);
    }
  };

  const handleIncomingMessage = (messageBody: string) => {
    let messageContent: string;

    if (communicationType === 'protobuf' && messageType) {
      try {
        // Convert base64 string back to Uint8Array
        const binaryMessage = new Uint8Array(atob(messageBody).split('').map(char => char.charCodeAt(0)));
        const decodedMessage = messageType.decode(binaryMessage) as ProtoMessage;
        const jsonMessage = messageType.toObject(decodedMessage);
        messageContent = JSON.stringify(jsonMessage, null, 2);
      } catch (error) {
        console.error('Error decoding protobuf message:', error);
        messageContent = `Error decoding message: ${error}`;
      }
    } else {
      messageContent = messageBody;
    }

    setMessages(prev => [...prev, { type: 'received', content: messageContent, timestamp: new Date() }]);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
          <Paper
              elevation={3}
              sx={{
                width: isSidebarOpen ? '33%' : '60px',
                transition: 'width 0.3s',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 0,
              }}
          >
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              p: isSidebarOpen ? 2 : 1
            }}>
              <IconButton
                  onClick={toggleSidebar}
                  sx={{ alignSelf: isSidebarOpen ? 'flex-end' : 'center', mb: 2 }}
              >
                {isSidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
              </IconButton>
              {isSidebarOpen && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', flexGrow: 1 }}>
                    <h1>WebSocket Client</h1>
                    <TextField
                        label="Server URL"
                        value={serverUrl}
                        onChange={(e) => setServerUrl(e.target.value)}
                        fullWidth
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Button variant="contained" onClick={connectToServer} disabled={connected || !serverUrl}>
                        Connect
                      </Button>
                      <Button variant="contained" onClick={disconnectFromServer} disabled={!connected}>
                        Disconnect
                      </Button>
                    </Box>
                    <FormControl fullWidth>
                      <InputLabel>Communication Type</InputLabel>
                      <Select
                          value={communicationType}
                          onChange={(e) => setCommunicationType(e.target.value as 'protobuf' | 'string')}
                      >
                        <MenuItem value="string">String</MenuItem>
                        <MenuItem value="protobuf">Protobuf</MenuItem>
                      </Select>
                    </FormControl>
                    {communicationType === 'protobuf' && (
                        <TextField
                            type="file"
                            onChange={handleProtoFileUpload}
                            inputProps={{ accept: '.proto' }}
                            fullWidth
                        />
                    )}
                    {protoFile && <Chip label={`Uploaded: ${protoFile.name}`} onDelete={() => setProtoFile(null)} />}
                    <TextField
                        label="Publish Channel"
                        value={publishChannel}
                        onChange={(e) => setPublishChannel(e.target.value)}
                        fullWidth
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                          label="Subscribe Channel"
                          value={newSubscribeChannel}
                          onChange={(e) => setNewSubscribeChannel(e.target.value)}
                          fullWidth
                      />
                      <Button variant="contained" onClick={addSubscribeChannel}>
                        Add
                      </Button>
                    </Box>
                    <List>
                      {subscribeChannels.map((channel, index) => (
                          <ListItem key={index}>
                            <ListItemText primary={channel} />
                            <ListItemSecondaryAction>
                              <IconButton edge="end" aria-label="delete" onClick={() => removeSubscribeChannel(channel)}>
                                <DeleteIcon />
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
                        fullWidth
                    />
                    <Button variant="contained" onClick={sendMessage} disabled={!connected} fullWidth>
                      Send Message
                    </Button>
                  </Box>
              )}
              <IconButton
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  color="inherit"
                  sx={{ mt: 'auto', alignSelf: isSidebarOpen ? 'flex-start' : 'center' }}
              >
                {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Box>
          </Paper>
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2, overflow: 'hidden' }}>
            <h2>Message History</h2>
            <TableContainer component={Paper} sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
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
          </Box>
        </Box>
      </ThemeProvider>
  );
};

export default WebSocketClient;
