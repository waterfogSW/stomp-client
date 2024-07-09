import React, {useState} from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import {Client} from '@stomp/stompjs';
import * as protobuf from 'protobufjs';
import {MessageItem} from './WebSocketClient';

interface MessageInputProps {
  connected: boolean;
  clientRef: React.MutableRefObject<Client | null>;
  communicationType: 'protobuf' | 'string';
  messageType: protobuf.Type | null;
  setMessages: React.Dispatch<React.SetStateAction<MessageItem[]>>;
}

export const MessageInput: React.FC<MessageInputProps> = ({
                                                            connected,
                                                            clientRef,
                                                            communicationType,
                                                            messageType,
                                                            setMessages
                                                          }) => {
  const [messageInput, setMessageInput] = useState<string>('');
  const [publishChannel, setPublishChannel] = useState<string>('/app/sendMessage');

  const sendMessage = () => {
    if (!connected || !clientRef.current) return;

    try {
      let messageToSend: string = messageInput;

      if (communicationType === 'protobuf' && messageType) {
        const jsonMessage = JSON.parse(messageInput);
        const errMsg = messageType.verify(jsonMessage);
        if (errMsg) throw Error(errMsg);

        const message = messageType.create(jsonMessage);
        const encodedMessage = messageType.encode(message).finish();
        // Convert Uint8Array to base64 string
        messageToSend = btoa(String.fromCharCode.apply(null, encodedMessage as unknown as number[]));
      }

      clientRef.current.publish({
        destination: publishChannel,
        body: messageToSend,
      });

      setMessages(prev => [...prev, {type: 'sent', content: messageInput, timestamp: new Date()}]);
      setMessageInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
      <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
        <TextField
            label="Publish Channel"
            value={publishChannel}
            onChange={(e) => setPublishChannel(e.target.value)}
            fullWidth
        />
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
  );
};
