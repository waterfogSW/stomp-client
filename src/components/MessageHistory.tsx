import React, { useState, useMemo } from 'react';
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
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import { MessageItem } from './WebSocketClient';
import { formatDistanceToNow } from 'date-fns';
import { useTheme } from '@mui/material/styles';

interface MessageRowProps {
  msg: MessageItem;
  index: number;
}

const MessageRow: React.FC<MessageRowProps> = ({ msg, index }) => {
  const [open, setOpen] = useState(false);
  const theme = useTheme();

  const getContentPreview = (content: string) => {
    const maxLength = 50;
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const formattedTime = useMemo(() => formatDistanceToNow(msg.timestamp, { addSuffix: true }), [msg.timestamp]);

  return (
      <>
        <TableRow
            sx={{
              '& > *': { borderBottom: 'unset' },
              backgroundColor: msg.type === 'sent' ? theme.palette.action.hover : 'inherit'
            }}
        >
          <TableCell>
            <IconButton
                aria-label="expand row"
                size="small"
                onClick={() => setOpen(!open)}
            >
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          </TableCell>
          <TableCell>
            <Chip
                label={msg.type}
                color={msg.type === 'sent' ? 'primary' : 'secondary'}
                size="small"
                sx={{ fontWeight: 'bold' }}
            />
          </TableCell>
          <TableCell>{formattedTime}</TableCell>
          <TableCell>{getContentPreview(msg.content)}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ margin: 1 }}>
              <pre style={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                backgroundColor: theme.palette.background.paper,
                padding: '10px',
                borderRadius: '4px',
                overflowX: 'auto',
                maxHeight: '300px',
                border: `1px solid ${theme.palette.divider}`
              }}>
                {msg.content}
              </pre>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      </>
  );
};

MessageRow.displayName = 'MessageRow';

const MemoizedMessageRow = React.memo(MessageRow);

interface MessageHistoryProps {
  messages: MessageItem[];
}

type SortOrder = 'latest' | 'oldest';

export const MessageHistory: React.FC<MessageHistoryProps> = ({ messages }) => {
  const [sortOrder, setSortOrder] = useState<SortOrder>('latest');

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => {
      if (sortOrder === 'latest') {
        return b.timestamp.getTime() - a.timestamp.getTime();
      } else {
        return a.timestamp.getTime() - b.timestamp.getTime();
      }
    });
  }, [messages, sortOrder]);

  const handleSortChange = (event: SelectChangeEvent<SortOrder>) => {
    setSortOrder(event.target.value as SortOrder);
  };

  return (
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2, overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h2">
            History
          </Typography>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="sort-order-label">Sort Order</InputLabel>
            <Select
                labelId="sort-order-label"
                value={sortOrder}
                onChange={handleSortChange}
                label="Sort Order"
            >
              <MenuItem value="latest">Latest First</MenuItem>
              <MenuItem value="oldest">Oldest First</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <TableContainer component={Paper} sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
          <Table stickyHeader aria-label="message history table">
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>Type</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Content</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedMessages.map((msg, index) => (
                  <MemoizedMessageRow key={index} msg={msg} index={index} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
  );
};
