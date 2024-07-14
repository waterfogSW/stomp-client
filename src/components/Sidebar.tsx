import React, { useState } from 'react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { ConnectionPanel } from './ConnectionPanel';
import { SubscriptionPanel } from './SubscriptionPanel';
import { MessageInput } from './MessageInput';
import { Client } from '@stomp/stompjs';
import * as protobuf from 'protobufjs';
import { MessageItem } from './WebSocketClient';
import { ResizableBox, ResizeCallbackData } from 'react-resizable';
import 'react-resizable/css/styles.css';

interface SidebarProps {
  isDarkMode: boolean;
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  connected: boolean;
  setConnected: React.Dispatch<React.SetStateAction<boolean>>;
  connectionError: string | null;
  setConnectionError: React.Dispatch<React.SetStateAction<string | null>>;
  clientRef: React.MutableRefObject<Client | null>;
  communicationType: 'protobuf' | 'string';
  setCommunicationType: React.Dispatch<React.SetStateAction<'protobuf' | 'string'>>;
  setMessages: React.Dispatch<React.SetStateAction<MessageItem[]>>;
}

export const Sidebar: React.FC<SidebarProps> = ({
                                                  isDarkMode,
                                                  setIsDarkMode,
                                                  isSidebarOpen,
                                                  setIsSidebarOpen,
                                                  connected,
                                                  setConnected,
                                                  connectionError,
                                                  setConnectionError,
                                                  clientRef,
                                                  communicationType,
                                                  setCommunicationType,
                                                  setMessages
                                                }) => {
  const [protoRoot, setProtoRoot] = useState<protobuf.Root | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(400); // 초기 너비

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleResize = (event: React.SyntheticEvent, { size }: ResizeCallbackData) => {
    setSidebarWidth(size.width);
  };

  return (
      <ResizableBox
          width={isSidebarOpen ? sidebarWidth : 60}
          height={Infinity}
          minConstraints={[300, Infinity]}
          maxConstraints={[600, Infinity]}
          axis="x"
          onResize={handleResize}
          handle={<div className="react-resizable-handle react-resizable-handle-e" />}
      >
        <Paper
            elevation={3}
            sx={{
              width: '100%',
              height: '100%',
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
                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  overflowY: 'auto',
                  flexGrow: 1
                }}>
                  <h1>WebSocket Client</h1>
                  <ConnectionPanel
                      connected={connected}
                      setConnected={setConnected}
                      connectionError={connectionError}
                      setConnectionError={setConnectionError}
                      clientRef={clientRef}
                      communicationType={communicationType}
                      setCommunicationType={setCommunicationType}
                      setProtoRoot={setProtoRoot}
                  />
                  <SubscriptionPanel
                      connected={connected}
                      clientRef={clientRef}
                      setMessages={setMessages}
                  />
                  <MessageInput
                      connected={connected}
                      clientRef={clientRef}
                      communicationType={communicationType}
                      setMessages={setMessages}
                      protoRoot={protoRoot}
                  />
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
      </ResizableBox>
  );
};
