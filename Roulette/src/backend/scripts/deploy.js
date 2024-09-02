const { ethers, artifacts } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log('Deploying contracts with the account:', deployer.address);
    console.log('Account balance:', (await deployer.getBalance()).toString());

    // Treasury
    const TREASURY = await ethers.getContractFactory('StakingTreasury');
    const knucklesToken = '0x1f008f9af47b387BDF67a25f2B8219942207298f';
    const knucklesLP = '0xD9Cb02ad1D3fD66a33172A8BFfF7Fcee774F7c0F';

    // stakingToken, rewardsToken, rake.
    // 4 rake so we can give 6% to compounders in future update assuming total 10% sustainable.
    const treasury = await TREASURY.deploy(knucklesLP, knucklesToken, 4);
    //const treasury = TREASURY.attach("0x6b123fecf79384d41f3445212b0eb10266c059b6");
    const treasuryAddress = treasury.address;

    const ROULETTE = await ethers.getContractFactory('Roulette');
    const roulette = await ROULETTE.deploy(treasuryAddress, knucklesToken);
    const rouletteAddress = roulette.address;

    //const roulette = CASINO.attach("0x4A9726EDAa47d01AF079c7a1b4178167B645C748");

    // Save copies of each contracts abi and address to the frontend.
    saveFrontendFiles(treasury, 'StakingTreasury');
    saveFrontendFiles(roulette, 'Roulette');

    console.log('Treasury address:', treasuryAddress);
    console.log('Roulette address:', rouletteAddress);

    // roulette approve treasury.
    const approve1 = await roulette.approveTreasury();
    await approve1.wait();
    // verify Roulette
    const verify = await treasury.verifyContract(rouletteAddress);
    await verify.wait();
    const approve2 = await treasury.approveVerifiedSpend(rouletteAddress);
    await approve2.wait();

    console.log('Deployed! Transfer some Knuckles to Treasury Address: ', treasuryAddress);
    console.log(
        'Execute withdrawTokens from old Roulette address (1,507,792,533,716.999999999999999001 Knuckles): ',
        '0x7418b4C96e5F0FC33B982271a8d317A6Ca09B4b3'
    );
    console.log('Deposit old balance to new Treasury:', treasuryAddress);
    console.log('Then good to deploy new dApps!');
}

function saveFrontendFiles(contract, name) {
    const fs = require('fs');
    const contractsDir = __dirname + '/../../backend/contractsData';

    if (!fs.existsSync(contractsDir)) {
        fs.mkdirSync(contractsDir);
    }

    fs.writeFileSync(
        contractsDir + `/${name}-address.json`,
        JSON.stringify({ address: contract.address }, undefined, 2)
    );

    const contractArtifact = artifacts.readArtifactSync(name);

    fs.writeFileSync(contractsDir + `/${name}.json`, JSON.stringify(contractArtifact, null, 2));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
