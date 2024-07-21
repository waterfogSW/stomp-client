import React, {useState} from 'react';
import {Badge, Box, Divider, IconButton, Paper, Switch, Tab, Tabs, Typography} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  SignalWifi4Bar as SignalWifi4BarIcon,
  SignalWifiOff as SignalWifiOffIcon,
} from '@mui/icons-material';
import {Client} from '@stomp/stompjs';
import {ConnectionPanel} from './ConnectionPanel';
import {SubscriptionPanel} from './SubscriptionPanel';
import {MessageInput} from './MessageInput';
import * as protobuf from 'protobufjs';
import {MessageItem} from './WebSocketClient';
import {ResizableBox, ResizeCallbackData} from 'react-resizable';
import 'react-resizable/css/styles.css';

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
}

export const Sidebar: React.FC<SidebarProps> = ({
                                                  isSidebarOpen,
                                                  setIsSidebarOpen,
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
                                                  setLoadedProtoFiles
                                                }) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [sidebarWidth, setSidebarWidth] = useState(600);

  const handleResize = (_event: React.SyntheticEvent, {size}: ResizeCallbackData) => {
    setSidebarWidth(size.width);
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
      <ResizableBox
          width={isSidebarOpen ? sidebarWidth : 60}
          height={Infinity}
          minConstraints={[200, Infinity]}
          maxConstraints={[500, Infinity]}
          axis="x"
          onResize={handleResize}
          handle={<div className="react-resizable-handle react-resizable-handle-e"/>}
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
            alignItems: 'center',
            justifyContent: isSidebarOpen ? 'space-between' : 'center',
            p: 1,
          }}>
            {isSidebarOpen && (
                <Typography variant="h6" sx={{pl: 2}}>
                  STOMP Client
                </Typography>
            )}
            <IconButton onClick={toggleSidebar}>
              {isSidebarOpen ? <ChevronLeftIcon/> : <ChevronRightIcon/>}
            </IconButton>
          </Box>
          <Divider/>
          {isSidebarOpen && (
              <>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    sx={{borderBottom: 1, borderColor: 'divider'}}
                >
                  <Tab
                      label="Connection"
                      icon={
                        <Badge color={connected ? "success" : "error"} variant="dot">
                          {connected ? <SignalWifi4BarIcon/> : <SignalWifiOffIcon/>}
                        </Badge>
                      }
                      iconPosition="end"
                  />
                  <Tab
                      label="Subscription "
                      icon={
                        <Badge
                            badgeContent={subscribeChannels.length}
                            color="primary"
                            sx={{
                              '& .MuiBadge-badge': {
                                right: -5,
                              },
                            }}
                        ></Badge>
                      }
                      iconPosition="end"
                  />
                  <Tab label="Send Message"/>
                </Tabs>
                <Box sx={{flexGrow: 1, overflowY: 'auto', p: 2}}>
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
              </>
          )}
          <Divider/>
          <Box sx={{p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
            {isSidebarOpen && (
                <Switch
                    checked={communicationType === 'protobuf'}
                    onChange={() => setCommunicationType(prev => prev === 'string' ? 'protobuf' : 'string')}
                    inputProps={{'aria-label': 'communication type'}}
                />
            )}
          </Box>
        </Paper>
      </ResizableBox>
  );
};
