'use client';

import React, { useState, useRef, useMemo } from 'react';
import { Client } from '@stomp/stompjs';
import { ThemeProvider, createTheme, ThemeOptions } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import { Sidebar } from './Sidebar';
import { MessageHistory } from './MessageHistory';
import useMediaQuery from '@mui/material/useMediaQuery';
import * as protobuf from 'protobufjs';

export interface MessageItem {
  type: 'sent' | 'received';
  content: string;
  timestamp: Date;
}

const getDesignTokens = (mode: 'light' | 'dark'): ThemeOptions => ({
  palette: {
    mode,
    ...(mode === 'light'
        ? {
          primary: {
            main: '#1976d2',
          },
          background: {
            default: '#f5f5f5',
            paper: '#ffffff',
          },
        }
        : {
          primary: {
            main: '#90caf9',
          },
          background: {
            default: '#303030',
            paper: '#424242',
          },
        }),
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        } as const,
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        } as const,
      },
    },
  },
});

export const WebSocketClient: React.FC = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState<'light' | 'dark'>(prefersDarkMode ? 'dark' : 'light');
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const clientRef = useRef<Client | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [communicationType, setCommunicationType] = useState<'protobuf' | 'string'>('string');

  const [serverUrl, setServerUrl] = useState<string>('');
  const [protoFiles, setProtoFiles] = useState<File[]>([]);
  const [loadedProtoFiles, setLoadedProtoFiles] = useState<Set<string>>(new Set());
  const [protoRoot, setProtoRoot] = useState<protobuf.Root | null>(null);
  const [subscribeChannels, setSubscribeChannels] = useState<string[]>([]);
  const [messageInput, setMessageInput] = useState<string>('');
  const [publishChannel, setPublishChannel] = useState<string>('/app/sendMessage');

  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{
          display: 'flex',
          height: '100vh',
          overflow: 'hidden',
          bgcolor: 'background.default',
          color: 'text.primary',
          transition: 'background-color 0.3s, color 0.3s',
        }}>
          <Sidebar
              mode={mode}
              toggleColorMode={toggleColorMode}
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
              serverUrl={serverUrl}
              setServerUrl={setServerUrl}
              protoFiles={protoFiles}
              setProtoFiles={setProtoFiles}
              protoRoot={protoRoot}
              setProtoRoot={setProtoRoot}
              subscribeChannels={subscribeChannels}
              setSubscribeChannels={setSubscribeChannels}
              messageInput={messageInput}
              setMessageInput={setMessageInput}
              publishChannel={publishChannel}
              setPublishChannel={setPublishChannel}
              loadedProtoFiles={loadedProtoFiles}
              setLoadedProtoFiles={setLoadedProtoFiles}
          />
          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
            <MessageHistory messages={messages} />
          </Box>
        </Box>
      </ThemeProvider>
  );
};

export default WebSocketClient;
