import React, {useRef, useState} from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import {Client, IMessage, StompSubscription} from '@stomp/stompjs';
import {MessageItem} from './WebSocketClient';

interface SubscriptionPanelProps {
    connected: boolean;
    clientRef: React.MutableRefObject<Client | null>;
    setMessages: React.Dispatch<React.SetStateAction<MessageItem[]>>;
}

export const SubscriptionPanel: React.FC<SubscriptionPanelProps> = ({
                                                                        connected,
                                                                        clientRef,
                                                                        setMessages
                                                                    }) => {
    const [subscribeChannels, setSubscribeChannels] = useState<string[]>([]);
    const [newSubscribeChannel, setNewSubscribeChannel] = useState<string>('');
    const subscriptionsRef = useRef<Map<string, StompSubscription>>(new Map());

    const addSubscribeChannel = () => {
        if (newSubscribeChannel && !subscribeChannels.includes(newSubscribeChannel)) {
            setSubscribeChannels(prev => [...prev, newSubscribeChannel]);
            setNewSubscribeChannel('');

            if (connected && clientRef.current) {
                const subscription = clientRef.current.subscribe(newSubscribeChannel, (message: IMessage) => {
                    handleIncomingMessage(message.body);
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

    const handleIncomingMessage = (messageBody: string) => {
        setMessages(prev => [...prev, {type: 'received', content: messageBody, timestamp: new Date()}]);
    };

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
            <Box sx={{display: 'flex', gap: 1}}>
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
                        <ListItemText primary={channel}/>
                        <ListItemSecondaryAction>
                            <IconButton edge="end" aria-label="delete"
                                        onClick={() => removeSubscribeChannel(channel)}>
                                <DeleteIcon/>
                            </IconButton>
                        </ListItemSecondaryAction>
                    </ListItem>
                ))}
            </List>
        </Box>
    );
};