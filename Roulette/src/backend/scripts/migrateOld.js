const { ethers, artifacts } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log('Migrating old balance:', deployer.address);
    console.log('Account balance:', ethers.utils.formatUnits((await deployer.getBalance()), 18));

    // Treasury
    const TREASURY = await ethers.getContractFactory('StakingTreasury');
    const treasury = TREASURY.attach("0x93804593aDa024BD796621378Ff767D924A80FDA");
    const treasuryAddress = treasury.address;

    // Old Roulette
    const ROULETTE = await ethers.getContractFactory('Roulette');
    const roulette = ROULETTE.attach("0x7418b4C96e5F0FC33B982271a8d317A6Ca09B4b3");
    const rouletteAddress = roulette.address;

    console.log('Treasury address:', treasuryAddress);
    console.log('Roulette address:', rouletteAddress);

    const MockERC20 = require('@openzeppelin/contracts/build/contracts/ERC20PresetFixedSupply.json');
    const knucklesAddress = "0x3865c1c3fa1fdf7bec666e8fc9c0df3d98aee300";
    const KNUCKLES = await ethers.getContractFactory(MockERC20.abi, MockERC20.bytecode);
    const Knuckles = KNUCKLES.attach(knucklesAddress);

    const myPreBalance = await Knuckles.balanceOf(deployer.address);
    console.log("deployer knuckles balance pre withdraw", ethers.utils.formatUnits(myPreBalance, 18));

    // get Knuckles Balance from Roulette
    const rouletteBalance = await Knuckles.balanceOf(rouletteAddress);
    console.log("Current Roulette Balance", ethers.utils.formatUnits(rouletteBalance, 18));

    const takeTenPercent = rouletteBalance.div(10);
    console.log("withdrawing 10%", takeTenPercent.toString());
    const withdraw = await roulette.withdrawTokens(takeTenPercent);
    // wait for state change confirmation.
    const withdrawReceipt = await withdraw.wait();
    console.log("withdraw tx", withdrawReceipt.transactionHash);

    // transfer to treasury.
    const myPostBalance = await Knuckles.balanceOf(deployer.address);
    console.log("deployer knuckles balance post withdraw", ethers.utils.formatUnits(myPostBalance,18));

    if(myPostBalance.lt(takeTenPercent)) {
        console.error("Some reason balance is low. Check chain and txs. Quitting.");
        return;
    }

    const transfer = await Knuckles.transfer(treasuryAddress, takeTenPercent);
    const transferReceipt = await transfer.wait();

    console.log("Transfer of 10% complete, tx:", transferReceipt.transactionHash);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
