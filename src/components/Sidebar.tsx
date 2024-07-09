import React from 'react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import {ConnectionPanel} from './ConnectionPanel';
import {SubscriptionPanel} from './SubscriptionPanel';
import {MessageInput} from './MessageInput';
import {Client} from '@stomp/stompjs';
import * as protobuf from 'protobufjs';
import {MessageItem} from './WebSocketClient';

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
  messageType: protobuf.Type | null;
  setMessageType: React.Dispatch<React.SetStateAction<protobuf.Type | null>>;
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
                                                  messageType,
                                                  setMessageType,
                                                  setMessages
                                                }) => {
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
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
              sx={{alignSelf: isSidebarOpen ? 'flex-end' : 'center', mb: 2}}
          >
            {isSidebarOpen ? <ChevronLeftIcon/> : <ChevronRightIcon/>}
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
                    setMessageType={setMessageType}
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
                    messageType={messageType}
                    setMessages={setMessages}
                />
              </Box>
          )}
          <IconButton
              onClick={() => setIsDarkMode(!isDarkMode)}
              color="inherit"
              sx={{mt: 'auto', alignSelf: isSidebarOpen ? 'flex-start' : 'center'}}
          >
            {isDarkMode ? <Brightness7Icon/> : <Brightness4Icon/>}
          </IconButton>
        </Box>
      </Paper>
  );
};
