import React, { useState, useEffect, useCallback } from 'react';
import contractsService from '../services/contractsService';
import { Grid, List, ListItem, ListItemText, Paper, Typography } from '@mui/material';

const History = ({ account, addGameResult }) => {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        // If the parent component needs to add a result, it will call this function
        if (addGameResult) {
            console.log('new', addGameResult);
            if (addGameResult === null) return;
            // Add the new result to the start of the history array and truncate to 21 items
            setHistory((currentHistory) => [addGameResult, ...currentHistory].slice(0, 21));
        }
    }, [addGameResult]);

    useEffect(() => {
        if (!account) return;
        const fetchHistory = async () => {
            try {
                const historyData = await contractsService.history(account);
                setHistory(historyData.slice(0, 21));
            } catch (error) {
                console.error('Failed to fetch history:', error);
            }
        };

        fetchHistory();
    }, [account]);

    // chunk array into smaller arrays of specified size
    const chunkArray = (array, size) => {
        const chunkedArr = [];
        for (let i = 0; i < array.length; i += size) {
            chunkedArr.push(array.slice(i, i + size));
        }
        return chunkedArr;
    };

    const chunkedHistory = chunkArray(history, 7);

    return (
        <Paper
            style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center', // Center horizontally
                justifyContent: 'center' // Center vertically if needed
            }}
            className="gradient"
        >
            <Typography variant="h4" gutterBottom color="white">
                Your Bet History
            </Typography>
            <Grid container spacing={2}>
                {chunkedHistory.map((column, columnIndex) => (
                    <Grid item xs={12} sm={12 / chunkedHistory.length} key={columnIndex}>
                        {column.map((game, index) => {
                            const isWin = game[2] > 0;
                            const resultText = isWin ? 'Win!' : 'Lost';
                            const secondaryText = isWin ? `${resultText} - Payout: ${game[2]}` : resultText;
                            const itemStyle = {
                                backgroundColor: isWin ? '#c8e6c9' : '#ffcdd2',
                                borderRadius: '5px',
                                margin: '5px',
                                padding: '10px',
                                flexGrow: 1
                            };

                            return (
                                <ListItem key={index} style={itemStyle}>
                                    <ListItemText
                                        primary={`Wagered: ${game[1]}`}
                                        secondary={secondaryText}
                                        secondaryTypographyProps={{ style: { fontWeight: isWin ? 'bold' : 'normal' } }}
                                    />
                                </ListItem>
                            );
                        })}
                    </Grid>
                ))}
            </Grid>
        </Paper>
    );
};

export default History;
