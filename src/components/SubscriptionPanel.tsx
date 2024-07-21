import React, {useEffect, useRef, useState} from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { MessageItem } from './WebSocketClient';
import * as protobuf from 'protobufjs';

interface SubscriptionPanelProps {
  connected: boolean;
  clientRef: React.MutableRefObject<Client | null>;
  setMessages: React.Dispatch<React.SetStateAction<MessageItem[]>>;
  subscribeChannels: string[];
  setSubscribeChannels: React.Dispatch<React.SetStateAction<string[]>>;
  communicationType: 'protobuf' | 'string';
  protoRoot: protobuf.Root | null;
  subscriptionsRef: React.MutableRefObject<Map<string, StompSubscription>>;
}

export const SubscriptionPanel: React.FC<SubscriptionPanelProps> = ({
                                                                      connected,
                                                                      clientRef,
                                                                      setMessages,
                                                                      subscribeChannels,
                                                                      setSubscribeChannels,
                                                                      communicationType,
                                                                      protoRoot,
                                                                      subscriptionsRef
                                                                    }) => {
  const [newSubscribeChannel, setNewSubscribeChannel] = useState<string>('');

  useEffect(() => {
    if (protoRoot) {
      console.log('Protobuf Root:', protoRoot);
      console.log('Available types:', Object.keys(protoRoot.nested || {}));
    } else {
      console.log('Protobuf Root is null');
    }
  }, [protoRoot]);

  const findMessageType = (root: protobuf.Root): protobuf.Type | null => {
    const searchMessageType = (namespace: protobuf.NamespaceBase): protobuf.Type | null => {
      for (const [name, value] of Object.entries(namespace.nested || {})) {
        if (value instanceof protobuf.Type) {
          console.log(`Found message type: ${name}`);
          return value;
        }
        if (value instanceof protobuf.Namespace) {
          const result = searchMessageType(value);
          if (result) return result;
        }
      }
      return null;
    };

    return searchMessageType(root);
  };

  const addSubscribeChannel = () => {
    if (newSubscribeChannel && !subscribeChannels.includes(newSubscribeChannel)) {
      setSubscribeChannels(prev => [...prev, newSubscribeChannel]);
      setNewSubscribeChannel('');

      if (connected && clientRef.current) {
        const subscription = clientRef.current.subscribe(newSubscribeChannel, (message: IMessage) => {
          handleIncomingMessage(message);
        });
        subscriptionsRef.current.set(newSubscribeChannel, subscription);
      }
    }
  };

  const removeSubscribeChannel = (channel: string) => {
    setSubscribeChannels(prev => prev.filter(ch => ch !== channel));

    if (connected && clientRef.current) {
      const subscription = subscriptionsRef.current.get(channel);
      if (subscription) {
        subscription.unsubscribe();
        subscriptionsRef.current.delete(channel);
      }
    }
  };

  const decodeProtobufMessage = (binaryBody: ArrayBuffer): string => {
    if (!protoRoot) {
      return 'Error: Proto definition not loaded';
    }

    try {
      console.log('Binary body:', new Uint8Array(binaryBody));
      const uint8Array = new Uint8Array(binaryBody);

      const messageType = findMessageType(protoRoot);
      if (!messageType) {
        return 'Error: No message type found in proto definition';
      }

      try {
        const decodedMessage = messageType.decode(uint8Array);
        console.log('Decoded message:', decodedMessage);
        return JSON.stringify(decodedMessage.toJSON(), null, 2);
      } catch (error) {
        console.error(`Failed to decode with ${messageType.name}:`, error);
        return `Error decoding message: ${error}`;
      }
    } catch (error) {
      console.error('Error decoding Protobuf message:', error);
      return `Error decoding Protobuf message: ${error}`;
    }
  };

  const handleIncomingMessage = (message: IMessage) => {
    console.log('Received message:', message);
    let content: string;

    if (communicationType === 'protobuf') {
      if (message.binaryBody) {
        content = decodeProtobufMessage(message.binaryBody);
      } else {
        // If binaryBody is not available, try to use the string body as a fallback
        content = message.body ? `Unable to decode: ${message.body}` : 'Error: No message body found';
      }
    } else {
      content = message.body;
    }

    setMessages(prev => [...prev, { type: 'RECEIVED', content, timestamp: new Date() }]);
  };

  return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
      </Box>
  );
};
