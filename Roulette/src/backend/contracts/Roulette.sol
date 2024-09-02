// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IERC20.sol";
import "./ITreasury.sol";

contract Roulette is Ownable {
    bool private isPlaying;
    uint8 private zeroPayout = 125; // 12.5:1 default payout
    uint256 public maxBet = 40e9;
    bytes32 private _SEED;

    IERC20 public token;
    ITreasury private treasury;

    // Roulette Bet Types
    enum BetType {
        Red,
        Black,
        Green
    }

    struct Bet {
        uint tokensBet;
        uint tokensEarned;
        string game;
    }

    event RouletteGame(uint NumberWin, bool result, uint tokensEarned);

    mapping(address => Bet[]) bettingHistory;

    // constructor.
    constructor(address _treasury, address _tokenAddress) {
        require(_tokenAddress != address(0), "Token address cannot be zero address");
        treasury = ITreasury(_treasury);
        token = IERC20(_tokenAddress);
        // Seed upon creation.
        _SEED = keccak256(abi.encodePacked(_treasury, blockhash(block.number)));
    }

    // must have treasury
    modifier mustHaveTreasury() {
        require(address(treasury) != address(0), "Treasury is not set");
        _;
    }

    // reentrancy guard
    modifier notPlaying() {
        require(!isPlaying, "Already in progress");
        isPlaying = true;
        _;
        isPlaying = false;
    }

    // If we need to update treasury address.
    function changeTreasury(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "Cannot be zero address");
        treasury = ITreasury(_newTreasury);
    }

    function approveTreasury() external onlyOwner mustHaveTreasury {
        token.approve(address(treasury), type(uint256).max);
    }

    // We may need to adjust zero payout for sustainability.
    function adjustZeroPayout(uint8 _newZero) external onlyOwner {
        require(_newZero >= 100 && _newZero <= 140, "Zero Payout must be between 100 and 140");
        zeroPayout = _newZero;
    }

    function setMaxBet(uint256 _newMax) external onlyOwner {
        require(_newMax > 0, "Cannot set zero max bet");
        maxBet = _newMax;
    }

    function tokenBalance(address _of) external view returns (uint256) {
        return token.balanceOf(_of);
    }

    // Token balance of the treasury rounded to nearest whole
    function balanceTokensTreasury() public view returns (uint256) {
        return token.balanceOf(address(treasury)) / 10 ** 18;
    }

    function getAddress() external view returns (address) {
        return address(token);
    }

    // Need for current ABI to migrate old contract balance.
    // Also recover accidentally sent tokens.
    function withdrawTokens(uint _numTokens) public onlyOwner {
        // The number of tokens must be greater than 0
        require(_numTokens > 0, "Withdraw more than 0 tokens");
        // The contract must have enough tokens to withdraw
        require(_numTokens <= token.balanceOf(address(this)), "Contract balance is insufficent");
        // Transfer the requested tokens to the owner of the smart contract
        token.transfer(owner(), _numTokens);
    }

    function getHistory(address _wallet) external view returns (Bet[] memory) {
        return bettingHistory[_wallet];
    }

    // Spin the wheel!
    function playRoulette(BetType betType, uint _tokensBet) external mustHaveTreasury notPlaying {
        // Ensure we can wager
        // TODO: Figure out why this doesn't revert properly when failed?
        checkRoulleteRequirements(betType, _tokensBet);

        uint random = uint(
            uint(keccak256(abi.encodePacked(block.number - 1 + block.timestamp, betType, msg.sender, _SEED))) % 14
        );
        uint tokensEarned = 0;
        bool win = false;
        // take and deposit bet
        token.transferFrom(msg.sender, address(this), _tokensBet);
        treasury.deposit(_tokensBet);
        // basic bet and win
        if (
            (betType == BetType.Red && random >= 1 && random <= 7) || // red bet and win
            (betType == BetType.Black && random >= 8 && random <= 14) // black bet and win
        ) {
            win = true;
            tokensEarned = _tokensBet * 2;
        }
        // green bet and win
        if (betType == BetType.Green && random == 0) {
            win = true;
            tokensEarned = (_tokensBet * zeroPayout) / 10; // divide by 10 since zeroPayout has an extra 'decimal'
        }
        // payout
        if (win) {
            // need approval for payout
            require(token.transferFrom(address(treasury), msg.sender, tokensEarned), "failed to transfer payout");
            //treasury.withdrawRewards(address(token), tokensEarned);
            //token.transfer(msg.sender, tokensEarned);
        }

        addHistory("Roulete", _tokensBet, tokensEarned, msg.sender);
        emit RouletteGame(random, win, tokensEarned);
    }

    // Ensure wager can be placed.
    // TODO: Figure out why this doesn't revert properly when failed?
    function checkRoulleteRequirements(BetType betType, uint _tokensBet) internal view {
        require(_tokensBet > 0, "Bet more than zero tokens");
        require(_tokensBet <= token.balanceOf(msg.sender), "Not enough tokens to place bet");
        // Enforce Max Bet
        require(_tokensBet <= maxBet * 10 ** 18, string(abi.encodePacked("Cannot wager more than max bet: ", maxBet)));
        // confirm treasury has enough to payout
        require(isTreasuryBalanceEnough(betType, _tokensBet), "Bet too large for current treasury balance");
        // assert token allowance for bet
        require(token.allowance(msg.sender, address(this)) >= _tokensBet, "Not enough token allowance");
    }

    // TODO: Figure out why this doesn't revert properly when failed?
    function isTreasuryBalanceEnough(BetType _betType, uint256 _tokensBet) internal view returns (bool) {
        uint256 potentialWin;

        if (_betType == BetType.Red || _betType == BetType.Black) {
            potentialWin = _tokensBet * 2;
        } else if (_betType == BetType.Green) {
            potentialWin = (_tokensBet * zeroPayout) / 10;
        }

        // Check if the treasury balance is enough for potential win
        return token.balanceOf(address(treasury)) >= potentialWin;
    }

    function addHistory(string memory _game, uint _tokensBet, uint _tokenEarned, address caller) internal {
        Bet memory wager = Bet(_tokensBet, _tokenEarned, _game);
        bettingHistory[caller].push(wager);
    }
}
