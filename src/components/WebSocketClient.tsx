'use client';

import React, { useState, useRef, useMemo } from 'react';
import {Client, StompSubscription} from '@stomp/stompjs';
import { ThemeProvider, createTheme, ThemeOptions } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import { Sidebar } from './Sidebar';
import { MessageHistory } from './MessageHistory';
import useMediaQuery from '@mui/material/useMediaQuery';
import * as protobuf from 'protobufjs';
import { AppBar, Toolbar, Typography, IconButton, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

export interface MessageItem {
  type: 'SENT' | 'RECEIVED';
  content: string;
  timestamp: Date;
}

const getDesignTokens = (mode: 'light' | 'dark'): ThemeOptions => ({
  palette: {
    mode,
    ...(mode === 'light'
        ? {
          primary: {
            main: '#2196f3',
          },
          secondary: {
            main: '#f50057',
          },
          background: {
            default: '#f4f6f8',
            paper: '#ffffff',
          },
        }
        : {
          primary: {
            main: '#90caf9',
          },
          secondary: {
            main: '#f48fb1',
          },
          background: {
            default: '#121212',
            paper: '#1e1e1e',
          },
        }),
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 'bold',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: mode === 'dark' ? '0 4px 6px rgba(0,0,0,0.3)' : '0 4px 6px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
        },
      },
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 500,
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

  const [subscriptionsRef] = useState<React.MutableRefObject<Map<string, StompSubscription>>>(
      React.useRef(new Map())
  );

  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);
  const muiTheme = useTheme();

  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
          bgcolor: 'background.default',
          color: 'text.primary',
          transition: 'background-color 0.3s, color 0.3s',
        }}>
          <AppBar position="static" color="default" elevation={0}>
            <Toolbar>
              <IconButton
                  edge="start"
                  color="inherit"
                  aria-label="menu"
                  onClick={toggleSidebar}
                  sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                WebSocket Client
              </Typography>
              <IconButton color="inherit" onClick={toggleColorMode}>
                {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Toolbar>
          </AppBar>
          <Box sx={{
            display: 'flex',
            flexGrow: 1,
            overflow: 'hidden',
          }}>
            <Box
                sx={{
                  width: isSidebarOpen ? 500 : 0,
                  flexShrink: 0,
                  transition: muiTheme.transitions.create('width', {
                    easing: muiTheme.transitions.easing.sharp,
                    duration: muiTheme.transitions.duration.leavingScreen,
                  }),
                  overflow: 'hidden',
                  bgcolor: 'background.paper',
                  borderRight: `1px solid ${muiTheme.palette.divider}`,
                }}
            >
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
                  subscriptionsRef={subscriptionsRef}
              />
            </Box>
            <Box sx={{
              flexGrow: 1,
              p: 3,
              transition: muiTheme.transitions.create('margin', {
                easing: muiTheme.transitions.easing.sharp,
                duration: muiTheme.transitions.duration.leavingScreen,
              }),
              marginLeft: 0,
              overflow: 'auto',
            }}>
              <MessageHistory messages={messages} />
            </Box>
          </Box>
        </Box>
      </ThemeProvider>
  );
};

export default WebSocketClient;
