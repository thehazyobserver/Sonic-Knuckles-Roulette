import React, { useState, useEffect } from 'react';
import contractsService from '../services/contractsService';
import { Grid, ListItem, ListItemText, Typography, Avatar, Link } from '@mui/material';
import knucklesToken from '../images/KnucklesCoin.svg';

const History = ({ account, addGameResult }) => {
    const [history, setHistory] = useState([]);
    const [isPending, setIsPending] = useState(false);

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
                setIsPending(true);
                const historyData = await contractsService.rewardsClaimHistory(account);
                setHistory(historyData);
                setIsPending(false);
            } catch (error) {
                setIsPending(false);
                console.error('Failed to fetch history:', error);
            }
        };

        fetchHistory();
    }, [account]);

    return (
        <Grid item xs={12} justifyContent="center" alignItems="center" textAlign="center">
            <Typography variant="h6" gutterBottom color="#222c31" textAlign="center" marginTop={1}>
                Recent Claims
            </Typography>
            <Grid item xs={12} justifyContent="center" alignItems="center" textAlign="center">
                <div style={{ maxHeight: '300px', overflowY: 'auto', overflowX: 'hidden' }}>
                    {isPending && !history.length ? (
                        <Avatar
                            alt=""
                            src={knucklesToken}
                            height="60"
                            width="60"
                            className={isPending && !history.length ? 'spin-animation' : ''}
                        />
                    ) : null}

                    {history.map((claim, index) => {
                        const itemStyle = {
                            borderRadius: '5px',
                            margin: '2px 7px',
                            padding: '3px'
                        };

                        return (
                            <Link
                                href={`https://ftmscan.com/tx/${claim.fullTx}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ textDecoration: 'none', color: 'inherit' }}
                                key={index}
                            >
                                <ListItem style={itemStyle}>
                                    <ListItemText primary={`Rewards: ${claim.amount}`} secondary={claim.txid} />
                                </ListItem>
                            </Link>
                        );
                    })}
                </div>
            </Grid>
        </Grid>
    );
};

export default History;
