import React, { useState } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import { Client } from '@stomp/stompjs';
import * as protobuf from 'protobufjs';

interface ConnectionPanelProps {
  connected: boolean;
  setConnected: React.Dispatch<React.SetStateAction<boolean>>;
  connectionError: string | null;
  setConnectionError: React.Dispatch<React.SetStateAction<string | null>>;
  clientRef: React.MutableRefObject<Client | null>;
  communicationType: 'protobuf' | 'string';
  setCommunicationType: React.Dispatch<React.SetStateAction<'protobuf' | 'string'>>;
  setProtoRoot: React.Dispatch<React.SetStateAction<protobuf.Root | null>>;
}

export const ConnectionPanel: React.FC<ConnectionPanelProps> = ({
                                                                  connected,
                                                                  setConnected,
                                                                  connectionError,
                                                                  setConnectionError,
                                                                  clientRef,
                                                                  communicationType,
                                                                  setCommunicationType,
                                                                  setProtoRoot
                                                                }) => {
  const [serverUrl, setServerUrl] = useState<string>('');
  const [protoFiles, setProtoFiles] = useState<File[]>([]);
  const [protoLoadError, setProtoLoadError] = useState<string | null>(null);
  const [loadedProtoFiles, setLoadedProtoFiles] = useState<Set<string>>(new Set());

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
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setProtoFiles(prev => [...prev, ...newFiles]);

      try {
        const root = new protobuf.Root();

        // 외부 Proto 파일 캐시
        const externalProtoCache: { [key: string]: string } = {};

        // 외부 Proto 파일 미리 로드
        const dependencies = ['google/protobuf/timestamp.proto', 'google/protobuf/wrappers.proto'];
        await Promise.all(dependencies.map(async (dep) => {
          try {
            const url = `https://raw.githubusercontent.com/protocolbuffers/protobuf/master/src/${dep}`;
            const response = await fetch(url);
            if (!response.ok) {
              throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
            }
            externalProtoCache[dep] = await response.text();
            console.log(`Pre-loaded dependency: ${dep}`);
          } catch (error) {
            console.error(`Failed to pre-load dependency ${dep}:`, error);
          }
        }));

        // 외부 의존성 파일들을 먼저 로드
        for (const [filename, content] of Object.entries(externalProtoCache)) {
          const parsed = protobuf.parse(content);
          root.add(parsed.root);
          console.log(`Loaded dependency: ${filename}`);
        }

        // 사용자가 업로드한 파일들을 로드
        for (const file of [...protoFiles, ...newFiles]) {
          const content = await readFileContent(file);
          const parsed = protobuf.parse(content);
          root.add(parsed.root);
          setLoadedProtoFiles(prev => new Set(prev).add(file.name));
          console.log(`Loaded file: ${file.name}`);
        }

        // 모든 의존성 해결
        root.resolveAll();

        console.log('All proto files parsed successfully. Root:', root);
        setProtoRoot(root);
        setProtoLoadError(null);
      } catch (error) {
        console.error('Error parsing proto files:', error);
        setProtoLoadError(`Error parsing proto files: ${error}`);
      }
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === 'string') {
          resolve(e.target.result);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
            label="Server URL"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            fullWidth
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
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
                inputProps={{ accept: '.proto', multiple: true }}
                fullWidth
            />
        )}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {Array.from(loadedProtoFiles).map((file) => (
              <Chip
                  key={file}
                  label={file}
                  color="secondary"
              />
          ))}
        </Box>
        {connectionError && <Chip label={connectionError} color="error" />}
        {protoLoadError && <Chip label={protoLoadError} color="error" />}
      </Box>
  );
};
