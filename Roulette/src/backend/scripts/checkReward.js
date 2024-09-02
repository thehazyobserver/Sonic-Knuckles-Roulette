const { ethers, artifacts } = require('hardhat');

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log('Staking a small amount with the account:', deployer.address);
    console.log('Account balance:', (await deployer.getBalance()).toString());

    // Treasury
    const TREASURY = await ethers.getContractFactory('StakingTreasury');
    const treasury = TREASURY.attach('0x93804593aDa024BD796621378Ff767D924A80FDA');
    const treasuryAddress = treasury.address;

    console.log('Treasury address:', treasuryAddress);

    const currentRake = await treasury.rakePercent();
    console.log("current Rake", currentRake);

    const userStaked = await treasury.userStake(deployer.address);
    if(userStaked.eq(0)) {
        console.log("nothing staked");
        return;
    };
    console.log('userStaked', userStaked.toString());

    // check user rewards
    const claimable = await treasury.earned(deployer.address);

    console.log('claimable', claimable.toString());

    if(claimable.eq(0)) {
        console.log("nothing to claim");
        return;
    };

    const claim = await treasury.claimReward();
    const claimReceipt = await claim.wait();
    const claimTotal = claimReceipt.events.find((event) => event.event === 'RewardPaid').args.reward.toString();
    console.log('claimed', claimTotal);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
