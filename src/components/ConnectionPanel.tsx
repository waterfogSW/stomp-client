import React, { useState } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
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
  serverUrl: string;
  setServerUrl: React.Dispatch<React.SetStateAction<string>>;
  protoFiles: File[];
  setProtoFiles: React.Dispatch<React.SetStateAction<File[]>>;
  protoRoot: protobuf.Root | null;
  setProtoRoot: React.Dispatch<React.SetStateAction<protobuf.Root | null>>;
  loadedProtoFiles: Set<string>;
  setLoadedProtoFiles: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export const ConnectionPanel: React.FC<ConnectionPanelProps> = ({
                                                                  connected,
                                                                  setConnected,
                                                                  connectionError,
                                                                  setConnectionError,
                                                                  clientRef,
                                                                  communicationType,
                                                                  setCommunicationType,
                                                                  serverUrl,
                                                                  setServerUrl,
                                                                  protoFiles,
                                                                  setProtoFiles,
                                                                  setProtoRoot,
                                                                  loadedProtoFiles,
                                                                  setLoadedProtoFiles
                                                                }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [protoLoadError, setProtoLoadError] = useState<string | null>(null);

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

  const fetchProtoFile = async (url: string): Promise<string> => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    return response.text();
  };

  const extractImports = (content: string): string[] => {
    const importRegex = /import\s+"([^"]+)"/g;
    const imports = [];
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    return imports;
  };

  const handleProtoFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setIsLoading(true);
      const newFiles = Array.from(event.target.files);
      setProtoFiles(prev => [...prev, ...newFiles]);

      try {
        const root = new protobuf.Root();
        const newLoadedFiles = new Set(loadedProtoFiles);
        const externalProtoCache: { [key: string]: string } = {};

        const loadProtoFile = async (file: File | string): Promise<void> => {
          let content: string;
          let filename: string;

          if (typeof file === 'string') {
            filename = file;
            if (newLoadedFiles.has(filename)) return;

            if (externalProtoCache[filename]) {
              content = externalProtoCache[filename];
            } else {
              content = await fetchProtoFile(`https://raw.githubusercontent.com/protocolbuffers/protobuf/master/src/${filename}`);
              externalProtoCache[filename] = content;
            }
          } else {
            filename = file.name;
            if (newLoadedFiles.has(filename)) return;
            content = await readFileContent(file);
          }

          newLoadedFiles.add(filename);

          const imports = extractImports(content);
          await Promise.all(imports.map(loadProtoFile));

          const parsed = protobuf.parse(content);
          root.add(parsed.root);
          console.log(`Loaded file: ${filename}`);
        };

        await Promise.all([...protoFiles, ...newFiles].map(loadProtoFile));

        root.resolveAll();
        console.log('All proto files parsed successfully. Root:', root);
        setProtoRoot(root);
        setLoadedProtoFiles(newLoadedFiles);
        setProtoLoadError(null);
      } catch (error) {
        console.error('Error parsing proto files:', error);
        setProtoLoadError(`Error parsing proto files: ${error}`);
      } finally {
        setIsLoading(false);
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
                disabled={isLoading}
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
        {isLoading && <CircularProgress />}
        {connectionError && <Chip label={connectionError} color="error" />}
        {protoLoadError && <Chip label={protoLoadError} color="error" />}
      </Box>
  );
};
