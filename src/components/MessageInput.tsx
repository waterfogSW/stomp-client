import React, { useState, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { Client } from '@stomp/stompjs';
import * as protobuf from 'protobufjs';
import Typography from '@mui/material/Typography';

interface MessageItem {
  type: 'sent' | 'received';
  content: string;
  timestamp: Date;
}

interface MessageInputProps {
  connected: boolean;
  clientRef: React.MutableRefObject<Client | null>;
  communicationType: 'protobuf' | 'string';
  setMessages: React.Dispatch<React.SetStateAction<MessageItem[]>>;
  protoRoot: protobuf.Root | null;
}

export const MessageInput: React.FC<MessageInputProps> = ({
                                                            connected,
                                                            clientRef,
                                                            communicationType,
                                                            setMessages,
                                                            protoRoot,
                                                          }) => {
  const [messageInput, setMessageInput] = useState<string>('');
  const [publishChannel, setPublishChannel] = useState<string>('/app/sendMessage');
  const [error, setError] = useState<string | null>(null);
  const [protoTypes, setProtoTypes] = useState<string[]>([]);

  useEffect(() => {
    if (protoRoot) {
      const types: string[] = [];
      const collectTypes = (obj: protobuf.NamespaceBase) => {
        Object.entries(obj.nested || {}).forEach(([name, value]) => {
          if (value instanceof protobuf.Type) {
            types.push(name);
          }
          if (value instanceof protobuf.Namespace) {
            collectTypes(value);
          }
        });
      };
      collectTypes(protoRoot);
      setProtoTypes(types);
    }
  }, [protoRoot]);

  const sendMessage = () => {
    if (!connected || !clientRef.current) return;

    try {
      let messageBody: string | Uint8Array = messageInput;

      if (communicationType === 'protobuf' && protoRoot) {
        const jsonMessage = JSON.parse(messageInput);
        const messageType = Object.keys(jsonMessage)[0];

        const matchedType = protoTypes.find(type => type.toLowerCase() === messageType.toLowerCase());

        if (!matchedType) {
          throw new Error(`Unknown message type: ${messageType}`);
        }

        const ProtoMessage = protoRoot.lookupType(matchedType);
        const verificationError = ProtoMessage.verify(jsonMessage[messageType]);

        if (verificationError) {
          throw new Error(`Invalid message: ${verificationError}`);
        }

        const message = ProtoMessage.create(jsonMessage[messageType]);
        messageBody = ProtoMessage.encode(message).finish();
      }

      clientRef.current.publish({
        destination: publishChannel,
        binaryBody: messageBody instanceof Uint8Array ? messageBody : undefined,
        body: typeof messageBody === 'string' ? messageBody : undefined,
      });

      setMessages(prev => [...prev, { type: 'sent', content: messageInput, timestamp: new Date() }]);
      setMessageInput('');
      setError(null);
    } catch (error) {
      console.error('Error sending message:', error);
      setError(`Failed to send message: ${error}`);
    }
  };

  const isButtonDisabled = !connected || (communicationType === 'protobuf' && !protoRoot);

  return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
            error={!!error}
            helperText={error || "Enter JSON message with the message type as the root key"}
        />
        <Button
            variant="contained"
            onClick={sendMessage}
            disabled={isButtonDisabled}
            fullWidth
        >
          Send Message
        </Button>
        {isButtonDisabled && (
            <Typography color="error">
              {!connected ? "Not connected to server" : "Proto file not loaded"}
            </Typography>
        )}
      </Box>
  );
};
