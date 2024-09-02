import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
    Grid,
    Button,
    TextField,
    Typography,
    Card,
    Avatar,
    Box,
    Link,
    CardActionArea,
    CardMedia,
    CardContent
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import contractsService from '../services/contractsService';
import { ToastContainer, toast } from 'react-toastify';
import { loadBalance } from '../reducers/balanceReducer';
import knucklesSteak from '../images/KnucklesSteak.jpg';
import knucklesToken from '../images/KnucklesCoin.svg';
import equalizerBanner from '../images/equalizer.png';
import tokenAddresses from '../backend/contractsData/Token-address.json';
import 'react-toastify/dist/ReactToastify.css';
import History from './History';

const StakingTreasury = ({ balance, account }) => {
    const [amount, setAmount] = useState('');
    const [stakedAmount, setStakedAmount] = useState('0.0');
    const [earnedRewards, setEarnedRewards] = useState('0.0');
    const dispatch = useDispatch();
    const [isPending, setIsPending] = useState(false);
    const [stakedPercent, setStakedPercent] = useState(0.0);

    const ftmLink = 'https://ftmscan.com/token/';
    const knucklesLink = ftmLink + tokenAddresses.knuckles_address;

    useEffect(() => {
        if (account) {
            handleCheckEarned();
            getStakedAmount();
        }
    }, [account]);

    const handleStake = async (event) => {
        event.preventDefault();
        if (amount === '' || amount === '0') {
            toast.error('Please enter an amount to stake', {
                position: 'top-right',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined
            });
            return;
        }
        try {
            setIsPending(true);
            const allowance = await contractsService.tokenAllowance(account);
            console.log(allowance);
            console.log(amount);
            if (allowance < amount) {
                toast.error(`Not enough allowance, please approve LP token`, {
                    position: 'top-right',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined
                });
                const approval = await contractsService.approveToken(amount);
            }
            const stakeTx = await contractsService.stake(amount);
            setIsPending(false);
            toast.success('Successfully staked! 🥩', {
                position: 'top-right',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined
            });
            dispatch(loadBalance(account)); // Update balance after staking
            getStakedAmount();
        } catch (error) {
            setIsPending(false);
            console.error('Error staking tokens:', error);
            const err = error.error?.message || error.message;
            toast.error(`Error staking tokens ${err}`, {
                position: 'top-right',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined
            });
        }
    };

    const handleUnstake = async (event) => {
        event.preventDefault();
        if (amount === '' || amount === '0') {
            toast.error('Please enter an amount to stake', {
                position: 'top-right',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined
            });
            return;
        }
        try {
            setIsPending(true);
            const unstakeTx = await contractsService.unstake(amount);
            toast.success('Successfully unstaked!', {
                position: 'top-right',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined
            });
            setIsPending(false);
            dispatch(loadBalance(account)); // Update balance after unstaking
            getStakedAmount();
        } catch (error) {
            setIsPending(false);
            console.error('Error unstaking tokens:', error);
            const err = error.error?.message || error.message;
            toast.error(`Error unstaking tokens ${err}`, {
                position: 'top-right',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined
            });
        }
    };

    const handleCheckEarned = async () => {
        try {
            const rewards = await contractsService.earned(account);
            setEarnedRewards(rewards.toString());
            toast.info('Earned rewards updated', {
                position: 'top-right',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined
            });
        } catch (error) {
            console.error('Error checking earned rewards:', error);
            const err = error.error?.message || error.message;
            toast.error(`Error checking earned rewards ${err}`, {
                position: 'top-right',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined
            });
        }
    };

    const getStakedAmount = async () => {
        try {
            const stakedAmount = await contractsService.stakedBalance(account);
            setStakedAmount(stakedAmount.toString());
            getStakedPercent();
        } catch (error) {
            console.error('Error getting staked amount:', error);
            const err = error.error?.message || error.message;
            toast.error(`Error getting staked amount ${err}`, {
                position: 'top-right',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined
            });
        }
    };

    const getStakedPercent = async () => {
        try {
            const stakedPercent = await contractsService.totalStakedPercent(account);
            setStakedPercent(stakedPercent);
        } catch (error) {
            console.error('Error getting staked percent:', error);
        }
    };

    const handleClaimReward = async () => {
        try {
            setIsPending(true);
            const claimTx = await contractsService.claimReward();
            toast.success('Rewards claimed!', {
                position: 'top-right',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined
            });
            setIsPending(false);
            handleCheckEarned();
            dispatch(loadBalance(account)); // Update balance after claiming rewards
        } catch (error) {
            setIsPending(false);
            console.error('Error claiming rewards:', error);
            const err = error.error?.message || error.message;
            toast.error(`Error claiming rewards ${err}`, {
                position: 'top-right',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined
            });
        }
    };

    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

    const styles = {
        steak: {
            backgroundImage: `url(${knucklesSteak})`,
            backgroundPosition: '50% 70%',
            backgroundSize: 'cover',
            position: 'relative',
            minHeight: '80vh'
        },
        container: {
            backgroundColor: 'rgba(225, 225, 240, 0.85)',
            padding: '20px',
            borderRadius: '8px',
            margin: '40px 0px',
            boxShadow: '3px 6px 4px #222c31'
        },
        titleBar: {
            position: 'absolute',
            top: isSmallScreen ? 10 : 30,
            color: 'white',
            zIndex: 10,
            padding: '10px',
            fontWeight: 'bold',
            textShadow: '4px 4px 3px rgba(34, 44, 49, 0.8), 7px 7px 6px rgba(255, 0, 0, 0.5)',
            fontSize: '2.6em'
        },
        textField: {
            backgroundColor: '#2a4649',
            '& label.Mui-focused': {
                color: '#FFFFFF'
            },
            '& .MuiInput-underline:after': {
                borderBottomColor: '#FFFFFF'
            },
            '& .MuiOutlinedInput-root': {
                '& fieldset': {
                    borderColor: '#FFFFFF'
                },
                '&:hover fieldset': {
                    borderColor: '#FFFFFF'
                },
                '&.Mui-focused fieldset': {
                    borderColor: '#FFFFFF'
                },
                '&.MuiInputBase-root': {
                    color: 'white'
                }
            }
        },
        stakeButton: {
            backgroundColor: '#691024',
            '&:hover': {
                backgroundColor: 'darkred'
            },
            margin: '0px 6px'
        },
        unstakeButton: {
            backgroundColor: '#222c31',
            '&:hover': {
                backgroundColor: 'darkslategray'
            },
            margin: '0px 6px'
        },
        claimButton: {
            backgroundColor: '#691024',
            '&:hover': {
                backgroundColor: 'darkred'
            }
        }
    };

    const useStyles = makeStyles((theme) => ({
        gridItem: {
            position: 'relative'
            // Other styles for the grid item...
        },
        overlay: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            zIndex: 20
        },
        spinner: {
            animation: '$spin 3s linear infinite'
        },
        '@keyframes spin': {
            from: { transform: 'rotate(0deg)' },
            to: { transform: 'rotate(360deg)' }
        },
        text: {
            fontSize: '3em',
            marginTop: '20px',
            padding: '10px 20px',
            textAlign: 'center'
        }
    }));

    const classes = useStyles();

    return (
        <Grid
            container
            spacing={2}
            alignItems="center"
            justifyContent="center"
            style={styles.steak}
            className={classes.gridItem}
        >
            {isPending && (
                <div className={classes.overlay}>
                    <Avatar alt="" src={knucklesToken} sx={{ width: 120, height: 120 }} className={classes.spinner} />
                    <div className={classes.text}>Pending tx...</div>
                </div>
            )}
            {!account && (
                <div className={classes.overlay}>
                    <Avatar alt="" src={knucklesToken} sx={{ width: 120, height: 120 }} className={classes.spinner} />
                    <div className={classes.text}>Connect Wallet to 🥩 and 🤑👆</div>
                </div>
            )}
            <Typography style={styles.titleBar} variant="h4" component="h2" align="center">
                Staking Treasury
            </Typography>
            {/* Left Column: LP Balance, Staked Balance and Stake/Unstake */}
            <Grid item md={4} sm={6} xs={12} sx={{ marginTop: isSmallScreen ? '28px' : 0 }}>
                <Card style={styles.container}>
                    <Grid container spacing={2} direction="column" alignItems="center">
                        {/* LP Balance */}
                        <Grid item xs={12}>
                            <Box display="flex" alignItems="center">
                                <Typography
                                    variant="body1"
                                    sx={{
                                        mr: 1,
                                        cursor: 'pointer',
                                        '&:hover': {
                                            color: 'blue'
                                        }
                                    }}
                                    textAlign="center"
                                    onClick={() => setAmount(balance)}
                                >
                                    <b>Fknuckles/FTM</b> LP Balance:{' '}
                                    {balance.includes('.') ?balance.split('.')[0] + '.' + balance.split('.')[1].slice(0, 6) : balance}
                                </Typography>
                            </Box>
                        </Grid>
                        {/* Staked Balance */}
                        <Grid item xs={12}>
                            <Box display="flex" alignItems="center">
                                <Typography
                                    variant="body1"
                                    sx={{
                                        mr: 1,
                                        cursor: 'pointer',
                                        '&:hover': {
                                            color: 'blue'
                                        }
                                    }}
                                    textAlign="center"
                                    onClick={() => setAmount(stakedAmount)}
                                >
                                    Your Staked LP Balance:{' '}
                                    {stakedAmount.includes('.') ? stakedAmount.split('.')[0] + '.' + stakedAmount.split('.')[1].slice(0, 6) : stakedAmount}
                                </Typography>
                            </Box>
                        </Grid>
                        {/* Stake/Unstake */}
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Amount to Stake/Unstake"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                type="number"
                                inputProps={{ min: '0' }}
                                sx={styles.textField}
                                color="secondary"
                                InputLabelProps={{
                                    style: {
                                        color: 'white'
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Button onClick={handleStake} variant="contained" color="primary" sx={styles.stakeButton}>
                                Stake
                            </Button>
                            <Button
                                onClick={handleUnstake}
                                variant="contained"
                                color="secondary"
                                sx={styles.unstakeButton}
                            >
                                Unstake
                            </Button>
                        </Grid>
                        <Typography variant="body2" textAlign="center" sx={{ marginTop: '18px' }}>
                            Your Pool Share: {stakedPercent}%
                        </Typography>
                    </Grid>
                </Card>
                <Card
                    sx={{
                        maxWidth: 222,
                        marginTop: '10px',
                        border: '1px solid white',
                        mx: 'auto',
                        backgroundColor: 'rgba(225, 225, 240, 0.85)'
                    }}
                >
                    <CardActionArea
                        href={`https://equalizer.exchange/liquidity/${tokenAddresses.lp_address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <CardMedia component="img" height="60" width="222" image={equalizerBanner} alt="Equalizer LP" />
                        <CardContent sx={{ padding: '4px' }}>
                            <Typography gutterBottom component="div" align="center" mb={0}>
                                Get Equalizer LP <br /> Stake 🥩 and Earn 🤑
                            </Typography>
                        </CardContent>
                    </CardActionArea>
                </Card>
            </Grid>

            {/* Center Column: Empty for background image visibility */}
            <Grid
                item
                md={3}
                className="center-column"
                style={{ display: { xs: 'none', sm: 'none', md: 'block' } }}
            ></Grid>

            {/* Right Column: Rewards Claim */}
            <Grid item md={4} sm={6} xs={12}>
                <Card style={styles.container}>
                    <Grid container spacing={2} direction="column" alignItems="center">
                        {/* Rewards Claim */}
                        <Grid item xs={12}>
                            <Button onClick={handleCheckEarned} variant="outlined">
                                Check Earned Rewards
                            </Button>
                        </Grid>
                        <Grid item xs={12}>
                            <Box display="flex" alignItems="center">
                                <Typography variant="body1" sx={{ mr: 1 }} textAlign="center">
                                    Earned <i>Fknuckles</i> Rewards: {earnedRewards}
                                </Typography>
                                <Link href={knucklesLink} target="_blank" rel="noopener noreferrer">
                                    <Avatar alt="" src={knucklesToken} sx={{ width: 26, height: 26 }} />
                                </Link>
                            </Box>
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                onClick={handleClaimReward}
                                variant="contained"
                                color="success"
                                sx={styles.claimButton}
                            >
                                Claim Rewards
                            </Button>
                        </Grid>
                    </Grid>
                </Card>
                <Card
                    sx={{
                        maxWidth: 320,
                        marginTop: '10px',
                        border: '1px solid white',
                        mx: 'auto',
                        backgroundColor: 'rgba(225, 225, 240, 0.85)'
                    }}
                >
                    <History account={account} />
                </Card>
            </Grid>
            <ToastContainer />
        </Grid>
    );
};

export default StakingTreasury;
