import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { MessageItem } from './WebSocketClient';

interface MessageHistoryProps {
  messages: MessageItem[];
}

export const MessageHistory: React.FC<MessageHistoryProps> = ({ messages }) => {
  const [openRows, setOpenRows] = useState<{ [key: number]: boolean }>({});

  const toggleRow = (index: number) => {
    setOpenRows(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const getContentPreview = (content: string) => {
    const maxLength = 50;
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2, overflow: 'hidden' }}>
        <h2>Message History</h2>
        <TableContainer component={Paper} sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>Type</TableCell>
                <TableCell>Timestamp</TableCell>
                <TableCell>Content</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {messages.map((msg, index) => (
                  <React.Fragment key={index}>
                    <TableRow>
                      <TableCell>
                        <IconButton
                            aria-label="expand row"
                            size="small"
                            onClick={() => toggleRow(index)}
                        >
                          {openRows[index] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                        </IconButton>
                      </TableCell>
                      <TableCell>{msg.type}</TableCell>
                      <TableCell>{msg.timestamp.toLocaleString()}</TableCell>
                      <TableCell>{getContentPreview(msg.content)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
                        <Collapse in={openRows[index]} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 1 }}>
                        <pre style={{
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'monospace',
                          backgroundColor: '#f5f5f5',
                          padding: '10px',
                          borderRadius: '4px',
                          overflowX: 'auto'
                        }}>
                          {msg.content}
                        </pre>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
  );
};
