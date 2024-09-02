const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('StakingRewards', function () {
    let StakingToken, RewardsToken, StakingTreasury, Roulette;
    let stakingToken, rewardsToken, stakingTreasury, roulette;
    let owner, user1, user2, user3, user4;

    const _knuckles20$ = 67312299128;
    const _knucles500$ = _knuckles20$ * 20;

    const rake = 5;
    const startingBalance = 1.5e12;
    console.log('starting balance', startingBalance);

    // Deploy and configure contracts and balances.
    beforeEach(async function () {
        // Get the ContractFactories and signers
        // mock ERC20 deploy.
        const MockERC20 = require('@openzeppelin/contracts/build/contracts/ERC20PresetFixedSupply.json');
        StakingToken = await ethers.getContractFactory(MockERC20.abi, MockERC20.bytecode);
        RewardsToken = await ethers.getContractFactory(MockERC20.abi, MockERC20.bytecode);
        StakingTreasury = await ethers.getContractFactory('StakingTreasury');
        Roulette = await ethers.getContractFactory('Roulette');
        [owner, user1, user2, user3, user4] = await ethers.getSigners();

        // Deploy the tokens and the staking contract
        stakingToken = await StakingToken.deploy('KnucklesLP', 'KnuckLP', 98936000000000, owner.address);
        rewardsToken = await RewardsToken.deploy('Knuckles', 'Knuck', 989360000000000, owner.address);
        stakingTreasury = await StakingTreasury.deploy(stakingToken.address, rewardsToken.address, rake);
        roulette = await Roulette.deploy(stakingTreasury.address, rewardsToken.address);
        // Distribute tokens to users
        await stakingToken.transfer(user1.address, 98936000000000 / 4);
        await stakingToken.transfer(user2.address, 98936000000000 / 4);
        await stakingToken.transfer(user3.address, 98936000000000 / 4);
        await stakingToken.transfer(user4.address, 98936000000000 / 4);
        //await rewardsToken.transfer(stakingTreasury.address, ethers.utils.parseEther('1000'));
        // approve spend for treasury deposit
        await rewardsToken.approve(stakingTreasury.address, 98936000000000);

        // verify 'owner' as mock contract to deposit and withdraw.
        await stakingTreasury.verifyContract(owner.address);

        // Starting treasury balance.
        await rewardsToken.transfer(stakingTreasury.address, startingBalance);

        // approve roulette contract to spend rewards
        await roulette.approveTreasury();
        await stakingTreasury.verifyContract(roulette.address);
        await stakingTreasury.approveVerifiedSpend(roulette.address);

        // approve rewardstoken allowance for owner and roulette.
        await rewardsToken.approve(roulette.address, 989360000000000);
    });

    async function playRoulette(betType, tokensBet) {
        const game = await roulette.playRoulette(betType, tokensBet);
        return game;
    }
    // manual deposit and withdraw. Should just run playRoulette instead with owner.
    async function depositRewards(amount) {
        await stakingTreasury.deposit(amount);
    }
    async function withdrawRewards(amount) {
        await stakingTreasury.withdrawReward(amount);
    }

    function getRandomAmount(min, max) {
        // just to handle some edge cases where min is too high.
        if (min >= max) {
            return max;
        }
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    // migrate to new treasury
    describe('Immediately Migrate to new treasury', function () {
        it('should migrate', async function () {
            await stakingTreasury.migrateTreasury(owner.address);
            const balance = await rewardsToken.balanceOf(stakingTreasury.address);
            expect(balance).to.equal(0);
        });
    });
    describe('Round of rewards and Migrate to new treasury', function () {
        it('should keep claimable rewards', async function () {
            // User 1 stakes 1000 tokens
            await stakingToken.connect(user1).approve(stakingTreasury.address, 1000);
            await stakingTreasury.connect(user1).stake(1000);

            // direct reward deposit.
            const staked = await stakingTreasury.addBonusRewards(10000);
            await staked.wait();

            // Ensure rewards are distributed correctly
            const user1Earned = await stakingTreasury.earned(user1.address);

            // user should have all rewards.
            expect(user1Earned).to.equal(10000);

            await stakingTreasury.migrateTreasury(owner.address);
            const balance = await rewardsToken.balanceOf(stakingTreasury.address);

            // balance should not change since user should have all rewards.
            expect(balance).to.equal(10000);

            const postMigrateEarned = await stakingTreasury.earned(user1.address);
            // earned should still be the same.
            expect (postMigrateEarned).to.equal(10000);

            // should claim
            const claim = await stakingTreasury.connect(user1).claimReward();
            const claimReceipt = await claim.wait();

            const claimTotal = claimReceipt.events.find((event) => event.event === 'RewardPaid').args.reward.toNumber();
            expect(claimTotal).to.equal(10000);

            const postBalance = await rewardsToken.balanceOf(stakingTreasury.address);

            // user should have claimed all.
            expect(postBalance).to.equal(0);
        });
    });

    // Test Staking and claiming rewards
    describe('Staking and claiming rewards: 2 users x20', function () {
        it('should handle staking, claiming, and unstaking with correct balances', async function () {
            let user1TotalEarned = 0;
            let user2TotalEarned = 0;
            let totalDeposit = 0;
            let totalRaked = 0;
            let playerWinnings = 0;

            for (let i = 0; i < 20; i++) {
                const stakeAmountUser1 = getRandomAmount(_knuckles20$, _knucles500$);
                const stakeAmountUser2 = getRandomAmount(_knuckles20$, _knucles500$);

                // User 1 stakes 100 tokens
                await stakingToken.connect(user1).approve(stakingTreasury.address, stakeAmountUser1);
                await stakingTreasury.connect(user1).stake(stakeAmountUser1);

                // User 2 stakes 200 tokens
                await stakingToken.connect(user2).approve(stakingTreasury.address, stakeAmountUser2);
                await stakingTreasury.connect(user2).stake(stakeAmountUser2);

                // Deposit some rewards
                const rewardsDeposit = getRandomAmount(1e6, 40e9);

                const betType = getRandomAmount(0, 2);
                const game = await playRoulette(betType, rewardsDeposit);
                // get RouletteGame event from gameReceipt

                const gameReceipt = await game.wait();
                const event = gameReceipt.events.find((event) => event.event === 'RouletteGame');
                const winnings = event.args.tokensEarned.toNumber();
                playerWinnings += winnings;

                //await depositRewards(rewardsDeposit);
                // scale reward by raked amount
                const rakedReward = (rewardsDeposit * rake) / 100;
                totalDeposit += rewardsDeposit;
                totalRaked += Math.trunc(rakedReward);

                // Ensure rewards are distributed correctly
                const totalStaked = await stakingTreasury.totalStakes();
                const user1Earned = await stakingTreasury.earned(user1.address);
                const user2Earned = await stakingTreasury.earned(user2.address);
                user1TotalEarned += user1Earned.toNumber();
                user2TotalEarned += user2Earned.toNumber();

                expect(user1TotalEarned + user2TotalEarned).to.be.closeTo(totalRaked, i + 1);

                expect(user1Earned.toNumber()).to.be.closeTo(
                    Math.trunc((rakedReward * stakeAmountUser1) / totalStaked.toNumber()),
                    i + 1
                );
                expect(user2Earned.toNumber()).to.be.closeTo(
                    Math.trunc((rakedReward * stakeAmountUser2) / totalStaked.toNumber()),
                    i + 1
                );

                // Users claim their rewards
                await stakingTreasury.connect(user1).claimReward();
                await stakingTreasury.connect(user2).claimReward();

                // Check balances after claiming
                expect(await rewardsToken.balanceOf(user1.address)).to.equal(user1TotalEarned);
                expect(await rewardsToken.balanceOf(user2.address)).to.equal(user2TotalEarned);

                // Users unstake ALL their tokens
                await stakingTreasury.connect(user1).unstake(stakeAmountUser1);
                await stakingTreasury.connect(user2).unstake(stakeAmountUser2);

                // Check staking token balances after unstaking
                expect(await stakingToken.balanceOf(user1.address)).to.equal(98936000000000 / 4);
                expect(await stakingToken.balanceOf(user2.address)).to.equal(98936000000000 / 4);

                // Check staking contract's token balance is 0 after all users have unstaked
                expect(await stakingToken.balanceOf(stakingTreasury.address)).to.equal(0);

                // After unstaking, the users should still be able to claim any remaining unclaimed rewards
                // If there are any rewards left due to rounding errors in distribution.
                await stakingTreasury.connect(user1).claimReward();
                await stakingTreasury.connect(user2).claimReward();

                const rewardTokenBalance = await rewardsToken.balanceOf(stakingTreasury.address);
                // Due to rounding we're expecting balance to increase by 1 each iteration.
                expect(rewardTokenBalance.toNumber()).to.be.closeTo(
                    startingBalance + totalDeposit - totalRaked - playerWinnings,
                    i + 1
                );
            }
            console.log('Player Winnings', playerWinnings);
        });
    });

    // Test staking and claiming rewards alternate
    describe('Staking and claiming rewards alternate: 2 users x20', function () {
        it('should handle staking, unstaking and claiming with correct balances', async function () {
            let user1TotalEarned = 0;
            let user2TotalEarned = 0;
            let totalDeposit = 0;
            let totalRaked = 0;
            let playerWinnings = 0;

            for (let i = 0; i < 20; i++) {
                const stakeAmountUser1 = getRandomAmount(_knuckles20$, _knucles500$);
                const stakeAmountUser2 = getRandomAmount(_knuckles20$, _knucles500$);

                // User 1 stakes 100 tokens
                await stakingToken.connect(user1).approve(stakingTreasury.address, stakeAmountUser1);
                await stakingTreasury.connect(user1).stake(stakeAmountUser1);

                // User 2 stakes 200 tokens
                await stakingToken.connect(user2).approve(stakingTreasury.address, stakeAmountUser2);
                await stakingTreasury.connect(user2).stake(stakeAmountUser2);

                // Deposit some rewards
                const rewardsDeposit = getRandomAmount(1e6, 40e9);
                //await depositRewards(rewardsDeposit);
                const betType = getRandomAmount(0, 2);
                const game = await playRoulette(betType, rewardsDeposit);
                const gameReceipt = await game.wait();
                const event = gameReceipt.events.find((event) => event.event === 'RouletteGame');
                const winnings = event.args.tokensEarned.toNumber();
                playerWinnings += winnings;

                // scale reward by raked amount
                const rakedReward = (rewardsDeposit * rake) / 100;
                totalDeposit += rewardsDeposit;
                totalRaked += Math.trunc(rakedReward);

                // save totalSaked before unstaking.
                const totalStaked = await stakingTreasury.totalStakes();

                // Users unstake ALL their tokens
                await stakingTreasury.connect(user1).unstake(stakeAmountUser1);
                await stakingTreasury.connect(user2).unstake(stakeAmountUser2);

                // Check staking token balances after unstaking
                expect(await stakingToken.balanceOf(user1.address)).to.equal(98936000000000 / 4);
                expect(await stakingToken.balanceOf(user2.address)).to.equal(98936000000000 / 4);

                // Check staking contract's token balance is 0 after all users have unstaked
                expect(await stakingToken.balanceOf(stakingTreasury.address)).to.equal(0);

                // Ensure rewards are distributed correctly
                const user1Earned = await stakingTreasury.earned(user1.address);
                const user2Earned = await stakingTreasury.earned(user2.address);
                user1TotalEarned += user1Earned.toNumber();
                user2TotalEarned += user2Earned.toNumber();

                expect(user1Earned.toNumber()).to.be.closeTo(
                    Math.trunc((rakedReward * stakeAmountUser1) / totalStaked.toNumber()),
                    i + 1
                );
                expect(user2Earned.toNumber()).to.be.closeTo(
                    Math.trunc((rakedReward * stakeAmountUser2) / totalStaked.toNumber()),
                    i + 1
                );

                // Users claim their rewards
                await stakingTreasury.connect(user1).claimReward();
                await stakingTreasury.connect(user2).claimReward();

                // Check balances after claiming
                expect(await rewardsToken.balanceOf(user1.address)).to.equal(user1TotalEarned);
                expect(await rewardsToken.balanceOf(user2.address)).to.equal(user2TotalEarned);

                // Due to rounding we're expecting balance to increase by 1 each iteration.
                const rewardTokenBalance = await rewardsToken.balanceOf(stakingTreasury.address);
                expect(rewardTokenBalance.toNumber()).to.be.closeTo(
                    startingBalance + totalDeposit - totalRaked - playerWinnings,
                    i + 1
                );
            }
            console.log('Player Winnings 2', playerWinnings);
        });
    });

    // test multiple deposits, stakes, withdrawals and claims in random orders via iteration:
    describe('Repeated and mixed operations: 2 users x100', function () {
        it('should maintain accurate accounting over multiple random operations', async function () {
            const initialStakeUser1 = getRandomAmount(_knuckles20$, _knucles500$);
            const initialStakeUser2 = getRandomAmount(_knuckles20$, _knucles500$);

            // Initial staking
            await stakingToken.connect(user1).approve(stakingTreasury.address, initialStakeUser1);
            await stakingTreasury.connect(user1).stake(initialStakeUser1);
            await stakingToken.connect(user2).approve(stakingTreasury.address, initialStakeUser2);
            await stakingTreasury.connect(user2).stake(initialStakeUser2);

            let totalDeposit = 0;
            let totalClaimed = 0;

            // Perform multiple random operations
            for (let i = 0; i < 100; i++) {
                // Randomly decide the order of staking, claiming and unstaking for each user
                for (let user of [user1, user2]) {
                    switch (Math.floor(Math.random() * 4)) {
                        case 0: // Stake more
                            const stakeMore = getRandomAmount(_knuckles20$, _knucles500$);
                            await stakingToken.connect(user).approve(stakingTreasury.address, stakeMore);
                            await stakingTreasury.connect(user).stake(stakeMore);
                            break;
                        case 1: // Claim rewards
                            const claim = await stakingTreasury.connect(user).claimReward();
                            const claimReceipt = await claim.wait();
                            // if no claim, break.
                            if (claimReceipt.events.length === 0) break;
                            const claimTotal = claimReceipt.events
                                .find((event) => event.event === 'RewardPaid')
                                .args.reward.toNumber();
                            totalClaimed += claimTotal;
                            break;
                        case 2: // Unstake all
                            const stakedAmount = await stakingTreasury.userStake(user.address);
                            if (stakedAmount.toNumber() === 0) break;
                            const unstakeAmount = getRandomAmount(_knuckles20$, stakedAmount.toNumber());
                            await stakingToken.connect(user).approve(stakingTreasury.address, unstakeAmount);
                            await stakingTreasury.connect(user).unstake(unstakeAmount);
                            break;
                        default:
                            // Deposit random amount of rewards
                            const randomRewards = getRandomAmount(1e6, 40e9);
                            //await depositRewards(randomRewards);
                            const betType = getRandomAmount(0, 2);
                            const game = await playRoulette(betType, randomRewards);
                            const gameReceipt = await game.wait();
                            const event = gameReceipt.events.find((event) => event.event === 'RouletteGame');
                            const winnings = event.args.tokensEarned.toNumber();

                            totalDeposit += randomRewards - winnings;
                            break;
                    }
                }

                // Check that the total staked tokens plus total rewards equals total tokens held by the contract
                const totalStaked = await stakingTreasury.totalStakes();
                const totalRewardsBalance = await rewardsToken.balanceOf(stakingTreasury.address);
                const totalStakingTokenBalance = await stakingToken.balanceOf(stakingTreasury.address);
                //console.log(i);
                expect(totalStaked).to.equal(totalStakingTokenBalance);
                expect(totalRewardsBalance).to.equal(startingBalance + totalDeposit - totalClaimed);
            }

            // Final checks after all operations
            // Check user balances are accurate
            for (let user of [user1, user2]) {
                const stakedAmount = await stakingTreasury.userStake(user.address);
                const earnedRewards = await stakingTreasury.earned(user.address);
                await stakingTreasury.connect(user).claimReward();
                if (stakedAmount.toNumber() > 0) {
                    await stakingTreasury.connect(user).unstake(stakedAmount);
                }
                const userStakingTokenBalance = await stakingToken.balanceOf(user.address);
                const userRewardsTokenBalance = await rewardsToken.balanceOf(user.address);
                expect(userStakingTokenBalance).to.be.at.least(initialStakeUser1);
                expect(userRewardsTokenBalance).to.be.at.least(earnedRewards);
            }
        });
    });

    // test multiple deposits, stakes, withdrawals and claims in random orders via iteration with Wager Simulation:
    describe('Repeated and mixed operations With Wager Simulation: 4 users x1500', function () {
        it('should maintain accurate accounting over multiple operations including Wager Simulation', async function () {
            const initialStakeUser1 = getRandomAmount(_knuckles20$, _knucles500$);
            const initialStakeUser2 = getRandomAmount(_knuckles20$, _knucles500$);
            const initialStakeUser3 = getRandomAmount(_knuckles20$, _knucles500$);
            const initialStakeUser4 = getRandomAmount(_knuckles20$, _knucles500$);

            // Initial staking
            await stakingToken.connect(user1).approve(stakingTreasury.address, initialStakeUser1);
            await stakingTreasury.connect(user1).stake(initialStakeUser1);
            await stakingToken.connect(user2).approve(stakingTreasury.address, initialStakeUser2);
            await stakingTreasury.connect(user2).stake(initialStakeUser2);
            await stakingToken.connect(user3).approve(stakingTreasury.address, initialStakeUser3);
            await stakingTreasury.connect(user3).stake(initialStakeUser3);
            await stakingToken.connect(user4).approve(stakingTreasury.address, initialStakeUser4);
            await stakingTreasury.connect(user4).stake(initialStakeUser4);

            let totalDeposit = 0;
            let totalClaimed = 0;
            let totalWinnings = 0;

            // Perform multiple random operations
            for (let i = 0; i < 1500; i++) {
                // Randomly decide the order of staking, claiming and unstaking for each user
                for (let user of [user1, user2, user3, user4]) {
                    switch (Math.floor(Math.random() * 4)) {
                        case 0: // Stake more
                            const stakeMore = getRandomAmount(_knuckles20$, _knucles500$);
                            await stakingToken.connect(user).approve(stakingTreasury.address, stakeMore);
                            await stakingTreasury.connect(user).stake(stakeMore);
                            break;
                        case 1: // Claim rewards
                            const claim = await stakingTreasury.connect(user).claimReward();
                            const claimReceipt = await claim.wait();
                            // if no claim, break.
                            if (claimReceipt.events.length === 0) break;
                            const claimTotal = claimReceipt.events
                                .find((event) => event.event === 'RewardPaid')
                                .args.reward.toNumber();
                            totalClaimed += claimTotal;
                            break;
                        case 2: // Unstake random amount
                            const stakedAmount = await stakingTreasury.userStake(user.address);
                            if (stakedAmount.toNumber() === 0) break;
                            const unstakeAmount = getRandomAmount(_knuckles20$, stakedAmount.toNumber());
                            await stakingToken.connect(user).approve(stakingTreasury.address, unstakeAmount);
                            await stakingTreasury.connect(user).unstake(unstakeAmount);
                            break;
                        default:
                            // Simulate a wager placed
                            const randomWager = getRandomAmount(1e6, 40e9);
                            const betType = getRandomAmount(0, 2);

                            try {
                                const game = await playRoulette(betType, randomWager);
                                const gameReceipt = await game.wait();
                                const event = gameReceipt.events.find((event) => event.event === 'RouletteGame');
                                const winnings = event.args.tokensEarned.toNumber();

                                totalWinnings += winnings;
                                totalDeposit += randomWager - winnings;
                            } catch (err) {
                                // expected error due to random wagers,we can continue.
                                if (err.message.includes('Bet too large')) {
                                    const balance = await rewardsToken.balanceOf(stakingTreasury.address);
                                    console.log(
                                        'Bet too large, continuing.',
                                        randomWager,
                                        'vs',
                                        balance.toNumber(),
                                        '\n If many output, consider reducing Rake %'
                                    );
                                    console.log('Details: betType', betType, totalWinnings);
                                    break;
                                }
                                // unexpected error, throw it.
                                throw err;
                            }

                            break;
                    }
                }

                // Check that the total staked tokens plus total rewards equals total tokens held by the contract
                const totalStaked = await stakingTreasury.totalStakes();
                const totalRewardsBalance = await rewardsToken.balanceOf(stakingTreasury.address);
                const totalStakingTokenBalance = await stakingToken.balanceOf(stakingTreasury.address);
                //console.log(i);
                expect(totalStaked).to.equal(totalStakingTokenBalance);
                expect(totalRewardsBalance).to.equal(startingBalance + totalDeposit - totalClaimed);
            }

            // Final checks after all operations
            // Check user balances are accurate
            for (let user of [user1, user2, user3, user4]) {
                const stakedAmount = await stakingTreasury.userStake(user.address);
                const earnedRewards = await stakingTreasury.earned(user.address);
                //console.log("*", user.address, earnedRewards.toNumber(), stakedAmount.toNumber());
                await stakingTreasury.connect(user).claimReward();
                // it's possible all was staked, so check
                if (stakedAmount.toNumber() > 0) {
                    await stakingTreasury.connect(user).unstake(stakedAmount);
                }

                const userStakingTokenBalance = await stakingToken.balanceOf(user.address);
                const userRewardsTokenBalance = await rewardsToken.balanceOf(user.address);
                // This can probably be improved.
                expect(userStakingTokenBalance).to.be.at.least(initialStakeUser1);
                expect(userRewardsTokenBalance).to.be.at.least(earnedRewards);
            }

            // final contract balance
            const contractBalance = await rewardsToken.balanceOf(stakingTreasury.address);
            console.log('ending balance', contractBalance.toNumber());
            console.log('Rake %', rake);
            console.log('total winnings', totalWinnings);
            console.log('Expected Treasury Gain', (contractBalance.toNumber() - startingBalance).toLocaleString());
            // we want minimal treasury reduction with the rake.
            expect(
                contractBalance.toNumber(),
                'Treasury balance lower than 90% starting, consider reducing rake for sustainability.'
            ).to.be.at.least(startingBalance * 0.9);
        });
    });
});
