import React, {useState} from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import {Client} from '@stomp/stompjs';
import * as protobuf from 'protobufjs';

interface ConnectionPanelProps {
  connected: boolean;
  setConnected: React.Dispatch<React.SetStateAction<boolean>>;
  connectionError: string | null;
  setConnectionError: React.Dispatch<React.SetStateAction<string | null>>;
  clientRef: React.MutableRefObject<Client | null>;
  communicationType: 'protobuf' | 'string';
  setCommunicationType: React.Dispatch<React.SetStateAction<'protobuf' | 'string'>>;
  setMessageType: React.Dispatch<React.SetStateAction<protobuf.Type | null>>;
}

export const ConnectionPanel: React.FC<ConnectionPanelProps> = ({
                                                                  connected,
                                                                  setConnected,
                                                                  connectionError,
                                                                  setConnectionError,
                                                                  clientRef,
                                                                  communicationType,
                                                                  setCommunicationType,
                                                                  setMessageType
                                                                }) => {
  const [serverUrl, setServerUrl] = useState<string>('');
  const [protoFile, setProtoFile] = useState<File | null>(null);

  const connectToServer = async () => {
    if (clientRef.current) {
      await clientRef.current.deactivate();
    }

    const client = new Client({
      brokerURL: serverUrl,
      onConnect: () => {
        console.log('Connected to STOMP server');
        setConnected(true);
        setConnectionError(null);
      },
      onDisconnect: () => {
        console.log('Disconnected from STOMP server');
        setConnected(false);
      },
      onStompError: (frame) => {
        console.error('STOMP error', frame);
        setConnectionError(`STOMP error: ${frame.headers.message}`);
        setConnected(false);
      },
    });

    clientRef.current = client;
    client.activate();
  };

  const disconnectFromServer = async () => {
    const client = clientRef.current;
    if (client) {
      try {
        await client.deactivate();
        setConnected(false);
        setConnectionError(null);
      } catch (error) {
        console.error('Error disconnecting:', error);
        setConnectionError('Error disconnecting from server');
      }
    }
  };

  const handleProtoFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setProtoFile(file);

      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target && typeof e.target.result === 'string') {
          try {
            const root = await protobuf.parse(e.target.result).root;
            const messageType = root.lookupType("YourMessageType"); // Update this to match your proto definition
            setMessageType(messageType);
          } catch (error) {
            console.error('Error parsing proto file:', error);
          }
        }
      };
      reader.readAsText(file);
    }
  };

  return (
      <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
        <TextField
            label="Server URL"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            fullWidth
        />
        <Box sx={{display: 'flex', justifyContent: 'space-between'}}>
          <Button variant="contained" onClick={connectToServer} disabled={connected || !serverUrl}>
            Connect
          </Button>
          <Button variant="contained" onClick={disconnectFromServer} disabled={!connected}>
            Disconnect
          </Button>
        </Box>
        <FormControl fullWidth>
          <InputLabel>Communication Type</InputLabel>
          <Select
              value={communicationType}
              onChange={(e) => setCommunicationType(e.target.value as 'protobuf' | 'string')}
          >
            <MenuItem value="string">String</MenuItem>
            <MenuItem value="protobuf">Protobuf</MenuItem>
          </Select>
        </FormControl>
        {communicationType === 'protobuf' && (
            <TextField
                type="file"
                onChange={handleProtoFileUpload}
                inputProps={{accept: '.proto'}}
                fullWidth
            />
        )}
        {protoFile &&
            <Chip label={`Uploaded: ${protoFile.name}`} onDelete={() => setProtoFile(null)}/>}
        {connectionError && <Chip label={connectionError} color="error"/>}
      </Box>
  );
};
