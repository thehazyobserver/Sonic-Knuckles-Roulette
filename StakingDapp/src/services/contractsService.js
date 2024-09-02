import { ethers } from 'ethers';
import TreasuryAbi from '../backend/contractsData/StakingTreasury.json';
import TreasuryAddress from '../backend/contractsData/StakingTreasury-address.json';
import TokenAbi from '../backend/contractsData/IERC20.json';
import TokenAddresses from '../backend/contractsData/Token-address.json';

let treasury = null;
//let fKnuckles = null;
let knucklesLP = null;

const loadContracts = async (signer) => {
    treasury = new ethers.Contract(TreasuryAddress.address, TreasuryAbi.abi, signer);
    //fKnuckles = new ethers.Contract(TokenAddresses.knuckles_address, TokenAbi.abi, signer);
    knucklesLP = new ethers.Contract(TokenAddresses.lp_address, TokenAbi.abi, signer);
};

const tokenBalance = async (acc) => {
    const balance = await knucklesLP.balanceOf(acc);
    return ethers.utils.formatUnits(balance, 18);
};

const stakedBalance = async (acc) => {
    const balance = await treasury.userStake(acc);
    return ethers.utils.formatUnits(balance, 18);
};

const totalStakedPercent = async (acc) => {
    const userBalance = await treasury.userStake(acc);
    const totalBalance = await treasury.totalStakes();
    const bigPercent = userBalance.mul(100000).div(totalBalance);
    return bigPercent.toNumber() / 1000;
};

const tokenAllowance = async (acc) => {
    const allowance = await knucklesLP.allowance(acc, treasury.address);
    console.log('service allowance', allowance);
    return parseInt(allowance._hex) / 1e18;
};

const approveToken = async (acc) => {
    const approve = await knucklesLP.approve(treasury.address, ethers.constants.MaxUint256);
    await approve.wait();
    return approve;
};

const stake = async (amount) => {
    if (amount.split('.')[1] && amount.split('.')[1].length > 18) {
        amount = amount.split('.')[0] + '.' + amount.split('.')[1].slice(0, 18);
    }
    amount = ethers.utils.parseUnits(amount, 18);
    const tx = await treasury.stake(amount);
    await tx.wait();
    return tx;
};

const unstake = async (amount) => {
    // ethers convert amount back to bignumber
    // amount is a string, don't allow it to have more than 18 decimals:
    if (amount.split('.')[1] && amount.split('.')[1].length > 18) {
        amount = amount.split('.')[0] + '.' + amount.split('.')[1].slice(0, 18);
    }

    amount = ethers.utils.parseUnits(amount, 18);
    const tx = await treasury.unstake(amount);
    await tx.wait();
    return tx;
};

const claimReward = async () => {
    const tx = await treasury.claimReward();
    await tx.wait();
    return tx;
};

const earned = async (account) => {
    const earnedAmount = await treasury.earned(account);
    const formattedAmount = ethers.utils.formatUnits(earnedAmount, 18);
    const truncatedAmount = formattedAmount.split('.')[0] + '.' + formattedAmount.split('.')[1].slice(0, 5);
    return truncatedAmount;
};

const rewardsClaimHistory = async (account) => {
    if (!account) {
        return [];
    }
    // Create a filter for the 'RewardsPaid' events emitted by the contract for the specific user address
    const filter = treasury.filters.RewardPaid(account);

    // Query the contract for the events using the filter
    // block 73110974 was contract deployment.
    const events = await treasury.queryFilter(filter, 73110974, 'latest');
    // only really care about last 10 events.
    const limitedEvents = events.slice(events.length - 10).reverse();

    // Process the event data as needed
    return limitedEvents.map((event) => {
        const shortTxHash = shortenHash(event.transactionHash);
        const formattedAmount = ethers.utils.formatUnits(event.args.reward, 18);
        const truncatedAmount = formattedAmount.split('.')[0] + '.' + formattedAmount.split('.')[1].slice(0, 5);

        return {
            amount: truncatedAmount,
            txid: shortTxHash,
            fullTx: event.transactionHash
        };
    });
};

function shortenHash(hash) {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

export default {
    loadContracts,
    tokenBalance,
    stakedBalance,
    tokenAllowance,
    approveToken,
    stake,
    unstake,
    claimReward,
    earned,
    rewardsClaimHistory,
    totalStakedPercent
};
