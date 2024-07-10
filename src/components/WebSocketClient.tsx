'use client';

import React, { useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import { Sidebar } from './Sidebar';
import { MessageHistory } from './MessageHistory';

export interface MessageItem {
  type: 'sent' | 'received';
  content: string;
  timestamp: Date;
}

export const WebSocketClient: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
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

  return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
          <Sidebar
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
              isSidebarOpen={isSidebarOpen}
              setIsSidebarOpen={setIsSidebarOpen}
              connected={connected}
              setConnected={setConnected}
              connectionError={connectionError}
              setConnectionError={setConnectionError}
              clientRef={clientRef}
              communicationType={communicationType}
              setCommunicationType={setCommunicationType}
              setMessages={setMessages}
          />
          <MessageHistory messages={messages} />
        </Box>
      </ThemeProvider>
  );
};

export default WebSocketClient;
