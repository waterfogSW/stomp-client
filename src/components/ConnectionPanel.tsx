import React, { useState } from 'react';
import { Client } from '@stomp/stompjs';
import * as protobuf from 'protobufjs';
import {
  TextField,
  Button,
  Box,
  Typography,
  Chip,
  IconButton,
  Paper,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';

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

interface Header {
  key: string;
  value: string;
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
  const [headers, setHeaders] = useState<Header[]>([{ key: '', value: '' }]);
  const [showHeaders, setShowHeaders] = useState<boolean>(false);

  const connectToServer = async () => {
    setIsLoading(true);
    if (clientRef.current) {
      await clientRef.current.deactivate();
    }

    const connectHeaders = headers.reduce((acc, header) => {
      if (header.key && header.value) {
        acc[header.key] = header.value;
      }
      return acc;
    }, {} as Record<string, string>);

    const client = new Client({
      brokerURL: serverUrl,
      connectHeaders,
      onConnect: () => {
        console.log('Connected to STOMP server');
        setConnected(true);
        setConnectionError(null);
        setIsLoading(false);
      },
      onDisconnect: () => {
        console.log('Disconnected from STOMP server');
        setConnected(false);
        setIsLoading(false);
      },
      onStompError: (frame) => {
        console.error('STOMP error', frame);
        setConnectionError(`STOMP error: ${frame.headers.message}`);
        setConnected(false);
        setIsLoading(false);
      },
    });

    clientRef.current = client;
    client.activate();
  };

  const disconnectFromServer = async () => {
    setIsLoading(true);
    const client = clientRef.current;
    if (client) {
      try {
        await client.deactivate();
        setConnected(false);
        setConnectionError(null);
      } catch (error) {
        console.error('Error disconnecting:', error);
        setConnectionError('Error disconnecting from server');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleAddHeader = () => {
    setHeaders([...headers, { key: '', value: '' }]);
  };

  const handleRemoveHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const handleHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
    setHeaders(newHeaders);
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
            variant="outlined"
            disabled={connected || isLoading}
        />

        <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1">Headers</Typography>
            <IconButton size="small" onClick={() => setShowHeaders(!showHeaders)}>
              <ExpandMoreIcon sx={{ transform: showHeaders ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </IconButton>
          </Box>
          <Collapse in={showHeaders}>
            <List dense>
              {headers.map((header, index) => (
                  <ListItem key={index} disableGutters>
                    <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                label="Key"
                                value={header.key}
                                onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
                                disabled={connected || isLoading}
                                size="small"
                                fullWidth
                            />
                            <TextField
                                label="Value"
                                value={header.value}
                                onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                                disabled={connected || isLoading}
                                size="small"
                                fullWidth
                            />
                          </Box>
                        }
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => handleRemoveHeader(index)} disabled={connected || isLoading}>
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
              ))}
            </List>
            <Button
                startIcon={<AddIcon />}
                onClick={handleAddHeader}
                disabled={connected || isLoading}
                fullWidth
                sx={{ mt: 1 }}
            >
              Add Header
            </Button>
          </Collapse>
        </Paper>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
              variant="contained"
              onClick={connectToServer}
              disabled={connected || !serverUrl || isLoading}
              fullWidth
          >
            {isLoading ? <CircularProgress size={24} /> : 'Connect'}
          </Button>
          <Button
              variant="outlined"
              onClick={disconnectFromServer}
              disabled={!connected || isLoading}
              fullWidth
          >
            Disconnect
          </Button>
        </Box>

        {communicationType === 'protobuf' && (
            <Button
                variant="outlined"
                component="label"
                disabled={isLoading}
                fullWidth
            >
              Upload Proto File
              <input
                  type="file"
                  hidden
                  onChange={handleProtoFileUpload}
                  accept=".proto"
                  multiple
              />
            </Button>
        )}

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {Array.from(loadedProtoFiles).map((file) => (
              <Chip key={file} label={file} onDelete={() => {/* Add delete logic */}} />
          ))}
        </Box>

        {connectionError && (
            <Typography color="error" variant="body2">
              {connectionError}
            </Typography>
        )}
        {protoLoadError && (
            <Typography color="error" variant="body2">
              {protoLoadError}
            </Typography>
        )}
      </Box>
  );
};
