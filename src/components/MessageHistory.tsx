import React from 'react';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import {MessageItem} from './WebSocketClient';

interface MessageHistoryProps {
  messages: MessageItem[];
}

export const MessageHistory: React.FC<MessageHistoryProps> = ({messages}) => {
  return (
      <Box sx={{flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2, overflow: 'hidden'}}>
        <h2>Message History</h2>
        <TableContainer component={Paper} sx={{flexGrow: 1, overflow: 'auto', mb: 2}}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Timestamp</TableCell>
                <TableCell>Content</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {messages.map((msg, index) => (
                  <TableRow key={index}>
                    <TableCell>{msg.type}</TableCell>
                    <TableCell>{msg.timestamp.toLocaleString()}</TableCell>
                    <TableCell>
                      <pre style={{
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'monospace'
                      }}>{msg.content}</pre>
                    </TableCell>
                  </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
  );
};
