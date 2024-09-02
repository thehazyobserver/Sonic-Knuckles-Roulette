import './App.css';
import React, { useEffect } from 'react';
import { ethers } from 'ethers';
import { Grid } from '@mui/material';
import contractsService from './services/contractsService';
import { useDispatch, useSelector } from 'react-redux';
import { loadAccounts } from './reducers/accountReducer';
import { loadBalance } from './reducers/balanceReducer';

import Header from './components/Header';
import { Routes, Route } from 'react-router-dom';

import StakingTreasury from './components/StakingTreasury';

const App = () => {
    const dispatch = useDispatch();
    const balance = useSelector(({ balance }) => {
        return balance;
    });
    const account = useSelector(({ account }) => {
        return account;
    });

    const web3Handler = async () => {
        const provider = new ethers.providers.Web3Provider(window.ethereum);

        // switch to Fantom
        try {
            await provider.send('wallet_switchEthereumChain', [{ chainId: '0xfa' }]);
        } catch (switchError) {
            // This error code indicates that the chain has not been added to MetaMask
            if (switchError.code === 4902) {
                try {
                    // Prompt user to add the Fantom network
                    await provider.send('wallet_addEthereumChain', [
                        {
                            chainId: '0xfa',
                            chainName: 'Fantom Opera',
                            nativeCurrency: {
                                name: 'Fantom',
                                symbol: 'FTM',
                                decimals: 18
                            },
                            rpcUrls: ['https://rpcapi.fantom.network/'],
                            blockExplorerUrls: ['https://ftmscan.com']
                        }
                    ]);
                } catch (addError) {
                    // Handle errors when adding the Fantom network
                    console.error(addError);
                }
            }
            // Handle other errors
            console.error(switchError);
        }

        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        dispatch(loadAccounts(accounts[0]));
        const signer = provider.getSigner();

        window.ethereum.on('chainChanged', (chainId) => {
            window.location.reload();
        });

        window.ethereum.on('accountsChanged', async function (accounts) {
            dispatch(loadAccounts(accounts[0]));
            await web3Handler();
        });
        await contractsService.loadContracts(signer);
    };

    const loadInfo = async () => {
        if (account !== '') {
            await dispatch(loadBalance(account));
            //await dispatch(loadHistory(account));
        }
    };

    useEffect(() => {
        loadInfo();
    }, [account]);

    return (
        <Grid container rowSpacing={{ xs: 8, sm: 9 }} sx={{ width: 1, backgroundColor: '#222c31' }}>
            <Grid item xs={12}>
                <Header login={web3Handler} balance={balance} account={account} />
            </Grid>
            <Grid item xs={12}>
                <Routes>
                    <Route path="/" element={<StakingTreasury balance={balance} account={account} />} />
                </Routes>
            </Grid>
        </Grid>
    );
};

export default App;
