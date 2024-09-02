import React, { useState, useEffect } from 'react';
import Roulette from './Roulette';
import { Grid, Button, Avatar } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useField } from '../hooks/useField';
import { useDispatch } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import CustomButton from './CustomButton';
import contractsService from '../services/contractsService';
import { loadBalance } from '../reducers/balanceReducer';
import SelectAmount from './SelectAmount';
import 'react-toastify/dist/ReactToastify.css';
import knucklesRoulette from '../images/KnucklesRoulette.jpg';
import History from './History';
import knucklesToken from '../images/KnucklesCoin.svg';

const RouletteGame = ({ balance, account }) => {
    const dispatch = useDispatch();
    const [mustSpin, setMustSpin] = useState(false);
    const [prizeNumber, setPrizeNumber] = useState(0);
    const betAmount = useField('');
    const betType = useField('');
    const [lastResult, setlastResult] = useState('');
    const [maxValue, setMaxValue] = useState(30e9);
    const [isPending, setIsPending] = useState(false);

    const [addGameResult, setAddGameResult] = useState(null);

    const onGameResult = (newResult) => {
        console.log('new result ongame', newResult);
        setAddGameResult(newResult);
    };

    // setMaxValue on load
    useEffect(() => {
        if (!account) return;
        const fetchData = async () => {
            const response = await contractsService.getMaxBet();
            console.log(response);
            setMaxValue(response);
        };

        fetchData();
    }, [account]);
    const onWheelStop = async () => {
        setMustSpin(false);
        await dispatch(loadBalance(account));
        if (lastResult.result === true) {
            toast.success(`Congratulations, you have earned ${lastResult.tokensEarned} Fknuckles!!`, {
                position: 'top-right',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined
            });

            // update game result.
        }
        const gameResult = ['Roulette', betAmount.value, lastResult.tokensEarned];
        onGameResult(gameResult);
    };

    const handleSpinClick = async (event) => {
        event.preventDefault();
        if (betAmount.value === '') {
            toast.error(`Please select an amount of tokens to bet`, {
                position: 'top-right',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined
            });
        } else {
            try {
                const allowance = await contractsService.tokenAllowance(account);
                if (allowance < betAmount.value) {
                    console.error('need more allowance');
                    toast.error(`Not enough token Allowance! Please approve fKnuckles spend.`, {
                        position: 'top-right',
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined
                    });
                    setIsPending(true);
                    // Prompt for allowance.
                    await contractsService.approveToken(account);
                    setIsPending(false);
                    // retry the play after approval.
                }
                setIsPending(true);
                // sufficient allownace assumed at this point.
                await playRoulette(betType.value, betAmount.value);
                setIsPending(false);
            } catch (error) {
                setIsPending(false);
                console.error('spin error', error, error.message);
                if (error.message.includes('playRoulette') || error.message.includes('allowance')) {
                    error.message = 'Connect Wallet First';
                }
                toast.error(`An error has occurred please try again later: ${error.message}`, {
                    position: 'top-right',
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined
                });
            }
        }
    };

    const playRoulette = async (betType, betAmount) => {
        try {
            const result = await contractsService.playRoulette(betType, betAmount);
            console.log(result);
            if (result.result === null || result.error !== undefined) {
                console.error('null result');
                toast.error(`An error has occurred. ${result.error}`, {
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
            setlastResult(result);
            setPrizeNumber(result.numberWon);
            setMustSpin(true);
            return result;
        } catch (error) {
            console.error('catch error', error, error.message);
            // bubble error up to parent.
            throw new Error(error.message);
        }
    };

    const changeBetType = (bet) => {
        betType.change(bet);
    };

    const auxChange = (amount) => {
        if (amount > balance) {
            toast.warn(`The amount of tokens to bet cant be higher than your balance`, {
                position: 'top-right',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined
            });
            betAmount.change(balance);
        } else {
            betAmount.change(amount);
        }
    };

    const styles = {
        roulette: {
            backgroundImage: `url(${knucklesRoulette})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            position: 'relative'
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
            fontSize: '3em'
        }
    }));

    const classes = useStyles();

    return (
        <Grid container className="topcontainer">
            <Grid container rowSpacing={3} style={styles.roulette} padding={2} className={classes.gridItem}>
                {isPending && (
                    <div className={classes.overlay}>
                        <Avatar
                            alt=""
                            src={knucklesToken}
                            sx={{ width: 100, height: 100 }}
                            className={classes.spinner}
                        />
                        <div className={classes.text}>Pending tx...</div>
                    </div>
                )}
                <Grid item xs={12}>
                    <Grid container alignItems="center" justifyContent="center"></Grid>
                </Grid>
                <Grid item xs={12}>
                    <Grid container alignItems="center" justifyContent="center">
                        <Roulette
                            newPrizeNumber={prizeNumber}
                            mustSpin={mustSpin}
                            functionallity={() => onWheelStop()}
                        />
                    </Grid>
                </Grid>
                <Grid item xs={12}>
                    <form onSubmit={handleSpinClick}>
                        <Grid container rowSpacing={2}>
                            <Grid item xs={12}>
                                <Grid container alignItems="center" justifyContent="center">
                                    <SelectAmount
                                        maxValue={maxValue}
                                        TextFielValue={betAmount.value}
                                        changeValue={auxChange}
                                        onChangeValue={betAmount.onChange}
                                        buttonColor={'#2a4649'}
                                    />
                                </Grid>
                            </Grid>
                            <Grid item xs={12}>
                                <Grid container alignItems="center" justifyContent="center">
                                    <Grid item xs={4}>
                                        <Grid container alignItems="center" justifyContent="center">
                                            <Button
                                                sx={{
                                                    width: '80%',
                                                    boxShadow: '1px 1px 2px 2px rgba(0, 0, 0, 0.5)'
                                                }}
                                                variant="contained"
                                                color="error"
                                                type="submit"
                                                onClick={() => changeBetType('Red')}
                                            >
                                                1-7
                                            </Button>
                                        </Grid>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Grid container alignItems="center" justifyContent="center">
                                            <Button
                                                sx={{
                                                    width: '80%',
                                                    boxShadow: '1px 1px 2px 2px rgba(0, 0, 0, 0.5)'
                                                }}
                                                variant="contained"
                                                color="success"
                                                type="submit"
                                                onClick={() => changeBetType('Green')}
                                            >
                                                0
                                            </Button>
                                        </Grid>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Grid container alignItems="center" justifyContent="center">
                                            <CustomButton
                                                backGround={'#111111'}
                                                text={'white'}
                                                display={'8-14'}
                                                size={'large'}
                                                type={'submit'}
                                                width={'80%'}
                                                boxShadow={'1px 1px 2px 2px rgba(0, 0, 0, 0.5)'}
                                                functionallity={() => changeBetType('Black')}
                                            />
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>
                    </form>
                </Grid>
                <ToastContainer />
            </Grid>

            <Grid container justifyContent="center" alignItems="center" padding={4}>
                <Grid item xs={10}>
                    <History account={account} addGameResult={addGameResult} />
                </Grid>
            </Grid>
        </Grid>
    );
};

export default RouletteGame;
