import { AppBar, Toolbar, Button, Grid, Avatar, Link } from '@mui/material';
import React, { useState, useEffect } from 'react';
import { makeStyles } from 'tss-react/mui';
import { Box } from '@mui/system';
import CustomButton from './CustomButton';
import knucklesToken from '../images/KnucklesCoin.svg';
import equalizerToken from '../images/Equalizer.svg';
import tokenAddresses from '../backend/contractsData/Token-address.json';
import { keyframes } from '@emotion/react';
//import { useNavigate } from "react-router";

const useStyles = makeStyles()(() => ({
    header: {
        paddingRight: '79px',
        paddingLeft: '118px',
        '@media (max-width: 900px)': {
            paddingLeft: 0
        }
    },
    logo: {
        fontFamily: 'Work Sans, sans-serif',
        fontWeight: 600,
        color: '#FFFEFE',
        textAlign: 'left'
    },
    menuButton: {
        fontFamily: 'Open Sans, sans-serif',
        fontWeight: 700,
        size: '18px',
        marginLeft: '38px'
    },
    toolbar: {
        display: 'flex',
        justifyContent: 'space-between',
        //backgroundColor: "rgb(255,255,243)",
        backgroundColor: 'linear-gradient(90deg, rgba(255,255,243,1) 0%, rgba(163,0,1,1) 100%)'
    },
    drawerContainer: {
        padding: '20px 30px'
    }
}));

const pulsateAnimation = keyframes`
    0% {
        box-shadow: 0 0 0 0 rgba(218, 165, 32, 0.9);
    }
    70% {
        box-shadow: 0 0 0 15px rgba(218, 165, 32, 0);
    }
    100% {
        box-shadow: 0 0 0 0 rgba(218, 165, 32, 0);
    }
`;

export default function Header({ login, account, balance }) {
    const { header } = useStyles();

    //const navigate = useNavigate();
    const [state, setState] = useState({
        mobileView: false,
        drawerOpen: false
    });

    const { mobileView } = state;

    useEffect(() => {
        const setResponsiveness = () => {
            return window.innerWidth < 900
                ? setState((prevState) => ({ ...prevState, mobileView: true }))
                : setState((prevState) => ({ ...prevState, mobileView: false }));
        };

        setResponsiveness();

        window.addEventListener('resize', () => setResponsiveness());

        return () => {
            window.removeEventListener('resize', () => setResponsiveness());
        };
    }, []);

    const LoginButton = () => {
        if (account === '') {
            return (
                <Button
                    variant="contained"
                    color="success"
                    onClick={login}
                    sx={{ animation: !account ? `${pulsateAnimation} 2s infinite` : 'none' }}
                >
                    Connect
                </Button>
            );
        } else {
            return <CustomButton backGround={'#222c31'} text={'#fff'} display={`${account.slice(0, 5)}...`} />;
        }
    };

    const displayDesktop = () => {
        return (
            <Toolbar>
                <Box sx={{ flexGrow: 1 }}>
                    <Grid container columns={7}>
                        <Grid item xs={1}></Grid>
                        <Grid item xs={5}>
                            <Grid container alignItems="center" justifyContent="center">
                                {femmecubatorLogo('45%')}
                            </Grid>
                        </Grid>
                        <Grid item xs={1}>
                            <Grid container alignItems="flex-end" justifyContent="right">
                                <LoginButton />
                            </Grid>
                        </Grid>
                    </Grid>
                </Box>
            </Toolbar>
        );
    };

    const displayMobile = () => {
        return (
            <Toolbar>
                <Box sx={{ flexGrow: 1 }}>
                    <Grid container columns={7}>
                        <Grid item xs={1}></Grid>
                        <Grid item xs={5}>
                            <Grid container alignItems="center" justifyContent="center">
                                {femmecubatorLogo('80%')}
                            </Grid>
                        </Grid>
                        <Grid item xs={1}>
                            <Grid container alignItems="flex-end" justifyContent="right">
                                <LoginButton />
                            </Grid>
                        </Grid>
                    </Grid>
                </Box>
            </Toolbar>
        );
    };

    const femmecubatorLogo = (width) => (
        <Box
            sx={{
                backgroundColor: '#222c31',
                border: 5,
                borderColor: '#222c31',
                borderRadius: '10px',
                width: { width }
            }}
            component="div"
        >
            <Grid container alignItems="center" justifyContent="center" columnSpacing={1}>
                <Grid item xs={6}>
                    <Box alignItems="start" justifyContent="left">
                        <Grid container columnSpacing={{ xs: 0.5, md: 1 }}>
                            <Grid item>
                                <Grid item xs={10} sm={6}>
                                    <Grid container>{balance.toLocaleString()}</Grid>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Box>
                </Grid>

                <Grid item xs={6}>
                    <Grid container columnSpacing={2} alignItems="end" justifyContent="right">
                        <Grid item xs={6} sm={6}>
                            <Link
                                href={`https://equalizer.exchange/liquidity/${tokenAddresses.lp_address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Grid container alignItems="end" justifyContent="right">
                                    <Avatar alt="" src={equalizerToken} sx={{ width: 24, height: 24 }} />
                                    <Avatar alt="" src={knucklesToken} sx={{ width: 24, height: 24 }} />
                                </Grid>
                            </Link>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );

    /*   const getMenuButtons = () => {
    return headersData.map(({ label, href }) => {
      return (
        <Button
          {...{
            key: label,
            color: "inherit",
            to: href,
            component: RouterLink,
            className: menuButton,
          }}
        >
          {label}
        </Button>
      );
    });
  }; */

    return (
        <header>
            <AppBar
                sx={{ background: 'linear-gradient(90deg, rgba(255,255,243,1) 0%, rgba(163,0,1,1) 100%)' }}
                className={header}
            >
                {mobileView ? displayMobile() : displayDesktop()}
            </AppBar>
        </header>
    );
}
