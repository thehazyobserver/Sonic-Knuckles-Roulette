# KnucklesFTM Roulette and Staking dApp
> [Original Roulette game authored by BraisCabo.](https://github.com/BraisCabo/Decentralized-Crypto-Casino)  
> Adaptations, enhancements, staking and expansion into split contracts authored by [lunchtime.](https://github.com/0xLunch)

## Directories:

### Roulette
Simple Roulette dApp for using KnucklesFTM token on Fantom.  
Includes Solidity Contracts for Roulette game.

**When updating contracts, _PLEASE_ use the `migrateTreasury()` function of the Roulette Contract as it will keep any remaining staking rewards in the old contract.**  
You'll have to adjust the front end for staking to show people if they have stake on the old contract and to withdraw from it! This is a feature I didn't get around to finishing.

### StakingDapp
Staking dApp and Treasury Contracts.


## Note:
- The Roulette Contract needs to have the Treasury address set since the Roulette Contract holds no tokens.
- The Treasury Contract requires that 'Game Contracts' be whitelisted in order to authorize certain transactions to access tokens within the treasury and properly enable raking logic to stakers.
- Do believe the current deployment scripts and other scripts handle this, but do double check!

See the Readmes of each directory for more information.
