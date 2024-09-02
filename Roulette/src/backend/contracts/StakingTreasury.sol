// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IERC20.sol";

contract StakingTreasury is Ownable {
    IERC20 public stakingToken;
    IERC20 public rewardsToken;

    uint8 public rakePercent;

    uint256 public totalStakes;
    uint256 public totalRewards;
    uint256 public totalRewardsDistributed;
    uint256 public rewardPerTokenStored;
    mapping(address => uint256) public userStake;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    mapping(address => bool) public isVerified;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event TransferTreasury(address indexed newTreasury, uint256 amount);

    // only allow verified contracts
    modifier onlyVerified() {
        require(isVerified[msg.sender], "Not a verified contract");
        _;
    }

    constructor(address _stakingToken, address _rewardsToken, uint8 _rake) {
        require(_stakingToken != address(0), "Staking token Cannot be zero address");
        require(_rewardsToken != address(0), "Rewards token Cannot be zero address");
        stakingToken = IERC20(_stakingToken);
        rewardsToken = IERC20(_rewardsToken);

        // set rake for stakers
        if (_rake == 0) {
            _rake = 4;
        }
        rakePercent = _rake;
    }

    // Verify game contract to interact with Treasury.
    function verifyContract(address _contractAddress) external onlyOwner {
        require(_contractAddress != address(0), "Cannot verify zero address");
        require(!isVerified[_contractAddress], "Contract already verified");
        isVerified[_contractAddress] = true;
    }

    function revokeContract(address _contractAddress) external onlyOwner {
        require(_contractAddress != address(0), "Cannot revoke zero address");
        require(isVerified[_contractAddress], "Contract already revoked");
        isVerified[_contractAddress] = false;
    }

    // approves verified contract to spend token balance.
    function approveVerifiedSpend(address _contractAddress) external onlyOwner {
        require(_contractAddress != address(0), "Cannot approve zero address");
        require(isVerified[_contractAddress], "Not verified");
        require(rewardsToken.approve(_contractAddress, type(uint256).max), "Failed to Approve");
    }

    function setRake(uint8 _newRake) external onlyOwner {
        require(_newRake < 100 && _newRake > 0, "Cannot rake 100% or 0%");
        rakePercent = _newRake;
    }

    // If we need to add FTM balance.
    function fundTreasury() external payable {}

    function withdrawNative() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");

        payable(owner()).transfer(balance);
    }

    // onlyVerified Deposit (wager placed).
    function deposit(uint256 _amount) external payable onlyVerified {
        rewardsToken.transferFrom(msg.sender, address(this), _amount);

        if (totalStakes > 0) {
            // reward based on rake
            uint256 reward = (_amount * rakePercent) / 100;
            totalRewards += reward;
        }
    }

    // simply add rewards as a bonus to stakers.
    function addBonusRewards(uint256 _amount) external payable onlyOwner {
        require(totalStakes > 0, "Nothing staked yet");
        rewardsToken.transferFrom(msg.sender, address(this), _amount);
        totalRewards += _amount;
    }

    // onlyVerified Withdraw
    /*     function withdrawReward(uint256 amount) external onlyVerified {
        require(amount <= rewardsToken.balanceOf(address(this)), "Insufficient balance");
        rewardsToken.transfer(msg.sender, amount);
    } */

    // onlyOwner migrate balance to new Treasury, keeps rewards for claims.
    function migrateTreasury(address _newTreasury) external onlyOwner {
        uint256 balance = rewardsToken.balanceOf(address(this));
        uint256 remainingRewards = totalRewards - totalRewardsDistributed;
        uint256 withdrawAmount = 0;
        if (remainingRewards <= balance) {
            withdrawAmount = balance - remainingRewards;
        }
        if (withdrawAmount == 0) {
            return;
        }
        rewardsToken.transfer(_newTreasury, withdrawAmount);
        emit TransferTreasury(address(rewardsToken), withdrawAmount);
    }

    // user stake, unstake, claim rewards.

    // modifier to update rewards for user
    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        totalRewardsDistributed = totalRewards;
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    function stake(uint256 _amount) external updateReward(msg.sender) {
        require(_amount > 0, "Cannot stake 0");
        require(stakingToken.balanceOf(msg.sender) >= _amount, "Not enough balance");
        totalStakes += _amount;
        userStake[msg.sender] += _amount;
        stakingToken.transferFrom(msg.sender, address(this), _amount);
        emit Staked(msg.sender, _amount);
    }

    function unstake(uint256 _amount) external updateReward(msg.sender) {
        require(_amount > 0, "Cannot unstake 0");
        require(userStake[msg.sender] >= _amount, "Not enough balance to unstake");
        totalStakes -= _amount;
        userStake[msg.sender] -= _amount;
        stakingToken.transfer(msg.sender, _amount);
        emit Unstaked(msg.sender, _amount);
    }

    function claimReward() external updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            rewardsToken.transfer(msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }

    function rewardPerToken() internal view returns (uint256) {
        if (totalStakes == 0) {
            return rewardPerTokenStored;
        }
        return rewardPerTokenStored + (((totalRewards - totalRewardsDistributed) * 1e18) / totalStakes);
    }

    function earned(address account) public view returns (uint256) {
        uint256 _rewardPerToken = rewardPerToken();
        uint256 _userRewardPerTokenPaid = userRewardPerTokenPaid[account];
        uint256 _userStakeAmount = userStake[account];
        uint256 earnedReward = 0;

        if (_rewardPerToken >= _userRewardPerTokenPaid) {
            earnedReward = ((_userStakeAmount * (_rewardPerToken - _userRewardPerTokenPaid)) / 1e18) + rewards[account];
        }

        return earnedReward;
    }
}
