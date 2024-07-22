import React, { useState } from 'react';
import {Client, StompSubscription} from '@stomp/stompjs';
import * as protobuf from 'protobufjs';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Switch,
  FormControlLabel,
  useTheme
} from '@mui/material';
import { ConnectionPanel } from './ConnectionPanel';
import { SubscriptionPanel } from './SubscriptionPanel';
import { MessageInput } from './MessageInput';
import {Header, MessageItem} from "@/components/WebSocketClient";

interface SidebarProps {
  mode: 'light' | 'dark';
  toggleColorMode: () => void;
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
  serverUrl: string;
  setServerUrl: React.Dispatch<React.SetStateAction<string>>;
  protoFiles: File[];
  setProtoFiles: React.Dispatch<React.SetStateAction<File[]>>;
  protoRoot: protobuf.Root | null;
  setProtoRoot: React.Dispatch<React.SetStateAction<protobuf.Root | null>>;
  subscribeChannels: string[];
  setSubscribeChannels: React.Dispatch<React.SetStateAction<string[]>>;
  messageInput: string;
  setMessageInput: React.Dispatch<React.SetStateAction<string>>;
  publishChannel: string;
  setPublishChannel: React.Dispatch<React.SetStateAction<string>>;
  loadedProtoFiles: Set<string>;
  setLoadedProtoFiles: React.Dispatch<React.SetStateAction<Set<string>>>;
  subscriptionsRef: React.MutableRefObject<Map<string, StompSubscription>>;
  headers: Header[];
  setHeaders: React.Dispatch<React.SetStateAction<Header[]>>;
}

export const Sidebar: React.FC<SidebarProps> = ({
                                                  mode,
                                                  toggleColorMode,
                                                  isSidebarOpen,
                                                  connected,
                                                  setConnected,
                                                  connectionError,
                                                  setConnectionError,
                                                  clientRef,
                                                  communicationType,
                                                  setCommunicationType,
                                                  setMessages,
                                                  serverUrl,
                                                  setServerUrl,
                                                  protoFiles,
                                                  setProtoFiles,
                                                  protoRoot,
                                                  setProtoRoot,
                                                  subscribeChannels,
                                                  setSubscribeChannels,
                                                  messageInput,
                                                  setMessageInput,
                                                  publishChannel,
                                                  setPublishChannel,
                                                  loadedProtoFiles,
                                                  setLoadedProtoFiles,
                                                  subscriptionsRef,
                                                  headers,
                                                  setHeaders,
                                                }) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const theme = useTheme();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
      <Box
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
            width: isSidebarOpen ? 500 : 0,
          }}
      >
        {isSidebarOpen && (
            <>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
                  <Tab label="Connection" />
                  <Tab label="Subscription" />
                  <Tab label="Send" />
                </Tabs>
              </Box>
              <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                {activeTab === 0 && (
                    <ConnectionPanel
                        connected={connected}
                        setConnected={setConnected}
                        connectionError={connectionError}
                        setConnectionError={setConnectionError}
                        clientRef={clientRef}
                        communicationType={communicationType}
                        setCommunicationType={setCommunicationType}
                        serverUrl={serverUrl}
                        setServerUrl={setServerUrl}
                        protoFiles={protoFiles}
                        setProtoFiles={setProtoFiles}
                        protoRoot={protoRoot}
                        setProtoRoot={setProtoRoot}
                        loadedProtoFiles={loadedProtoFiles}
                        setLoadedProtoFiles={setLoadedProtoFiles}
                    />
                )}
                {activeTab === 1 && (
                    <SubscriptionPanel
                        connected={connected}
                        clientRef={clientRef}
                        setMessages={setMessages}
                        subscribeChannels={subscribeChannels}
                        setSubscribeChannels={setSubscribeChannels}
                        communicationType={communicationType}
                        protoRoot={protoRoot}
                        subscriptionsRef={subscriptionsRef}
                    />
                )}
                {activeTab === 2 && (
                    <MessageInput
                        connected={connected}
                        clientRef={clientRef}
                        communicationType={communicationType}
                        setMessages={setMessages}
                        protoRoot={protoRoot}
                        messageInput={messageInput}
                        setMessageInput={setMessageInput}
                        publishChannel={publishChannel}
                        setPublishChannel={setPublishChannel}
                    />
                )}
              </Box>
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <FormControlLabel
                    control={
                      <Switch
                          checked={communicationType === 'protobuf'}
                          onChange={() => setCommunicationType(prev => prev === 'string' ? 'protobuf' : 'string')}
                          color="primary"
                      />
                    }
                    label={
                      <Typography variant="body2">
                        {communicationType === 'protobuf' ? 'Protobuf' : 'String'}
                      </Typography>
                    }
                />
                <FormControlLabel
                    control={
                      <Switch
                          checked={mode === 'dark'}
                          onChange={toggleColorMode}
                          color="primary"
                      />
                    }
                    label={
                      <Typography variant="body2">
                        {mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
                      </Typography>
                    }
                />
              </Box>
            </>
        )}
      </Box>
  );
};
