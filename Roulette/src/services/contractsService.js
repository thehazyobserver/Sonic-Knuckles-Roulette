import { ethers } from 'ethers';
import RouletteAbi from '../backend/contractsData/Roulette.json';
import TokenAbi from '../backend/contractsData/IERC20.json';
import RouletteAddress from '../backend/contractsData/Roulette-address.json';
import KnucklesAddress from '../backend/contractsData/Token-address.json';

let roulette = null;
let fKnuckles = null;

function Enum(...options) {
    return Object.fromEntries(options.map((key, i) => [key, ethers.BigNumber.from(i)]));
}

const betTypes = Enum('Red', 'Black', 'Green');

const loadContracts = async (signer) => {
    roulette = new ethers.Contract(RouletteAddress.address, RouletteAbi.abi, signer);
    fKnuckles = new ethers.Contract(KnucklesAddress.address, TokenAbi.abi, signer);
    console.log(roulette);
};

const tokenBalance = async (acc) => {
    const balance = await roulette.tokenBalance(acc);
    return parseInt(balance._hex);
};

const tokenAllowance = async (acc) => {
    const allowance = await fKnuckles.allowance(acc, RouletteAddress.address);
    console.log('service allowance', allowance);
    return parseInt(allowance._hex) / 1e18;
};

const approveToken = async (acc) => {
    const approve = await fKnuckles.approve(RouletteAddress.address, ethers.constants.MaxUint256);
    return;
};

const getMaxBet = async () => {
    const maxBet = await roulette.maxBet();
    console.log('service maxbet', maxBet);
    return parseInt(maxBet._hex);
};

const playRoulette = async (betType, tokensBet) => {
    // Enum the betType and make sure we have result.
    const currBet = betTypes[betType];
    if (!currBet) {
        const err = 'Bad Bet, Please bet Red, Black, or Green [ENUM]';
        console.error(err);
        return {
            numberWon: 0,
            result: null,
            tokensEarned: 0,
            error: err
        };
    }
    const MAXBET = await roulette.maxBet();
    console.log(MAXBET, MAXBET.toNumber());
    if (tokensBet > MAXBET.toNumber()) {
        const err = `Max Bet is ${MAXBET.toNumber()}`;
        console.error(err);
        return {
            numberWon: 0,
            result: null,
            tokensEarned: 0,
            error: err
        };
    }
    // convert token bet to bignumber x decimals
    const bigBet = ethers.BigNumber.from(tokensBet);
    const bigTen = ethers.BigNumber.from(10);
    const bigDecimal = ethers.BigNumber.from(18);
    const bigTokenBet = bigBet.mul(bigTen.pow(bigDecimal));
    const game = await roulette.playRoulette(currBet, bigTokenBet, {
        gasLimit: 242000
    });
    const receipt = await game.wait();
    let result;
    // event we want is the last one, but winners have extra event.
    let eventIdx = receipt.events.length - 1;
    try {
        result = {
            numberWon: parseInt(receipt.events[eventIdx].args.NumberWin._hex),
            result: receipt.events[eventIdx].args.result,
            tokensEarned: parseInt(receipt.events[eventIdx].args.tokensEarned.div(bigTen.pow(bigDecimal))._hex)
        };
    } catch (error) {
        console.error('play roulette service error?', error);
        const err = error?.message ? error.message : error;
        result = {
            numberWon: parseInt(receipt.events[eventIdx].args.NumberWin._hex),
            result: receipt.events[eventIdx].args.result,
            tokensEarned: parseInt(receipt.events[eventIdx].args.tokensEarned.div(bigTen.pow(bigDecimal))._hex),
            error: err
        };
    }
    return result;
};

const history = async (account) => {
    const fullHistory = await roulette.getHistory(account);
    const recentHistory = fullHistory.slice(-21).reverse();
    let historyParsed = [];
    recentHistory.map((game) => historyParsed.push([game[2], parseInt(game[0]) / 1e18, parseInt(game[1]) / 1e18]));
    console.log('history', historyParsed);
    return historyParsed;
};

export default { loadContracts, tokenBalance, history, playRoulette, tokenAllowance, approveToken, getMaxBet };
