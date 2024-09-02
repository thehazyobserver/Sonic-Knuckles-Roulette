const { ethers, artifacts } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log('Staking a small amount with the account:', deployer.address);
    console.log('Account balance:', (await deployer.getBalance()).toString());

    // Treasury
    const TREASURY = await ethers.getContractFactory('StakingTreasury');
    const treasury = TREASURY.attach("0x93804593aDa024BD796621378Ff767D924A80FDA");
    const treasuryAddress = treasury.address;

    console.log('Treasury address:', treasuryAddress);

    // Stake
    const stakeAmount = ethers.utils.parseUnits('2', 18);
    const staked = await treasury.stake(stakeAmount);
    await staked.wait();
    
    // check staked amount.
    const totalStaked = await treasury.totalStakes();
    const userStaked = await treasury.userStake(deployer.address);
    
    console.log("totalStaked", totalStaked.toString());
    console.log("userStaked", userStaked.toString());

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
