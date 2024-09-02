## Staking dApp

### Note from Lunch:
Exact same as the Roulette dApp, just different components.  
The plan was to unify these into a single dApp and set of contracts, so there may be a bit of a mess when it comes to deployments. 

It seems you should just use the Roulette deployment for backend contracts only so not accidentally doing a double deployment. Just copy the contract addresses over to this dApp. 

**When migrating to an updated treasury (new deployment), you should incoroprate a popup that notifies a staker that they have a balance and stake on the old contract and to withdraw it and move it over! The current contracts only allow for the owner of the stake to operate on their claim and stake!! Consider an admin function to also migrate user's stakes and rewards.**  
** This feature does not currently exist!! Be warned that a new deployment and migration will keep stakes and pending rewards in the old treasury contract!

It's likely worth the effort to unify the dApp into a single react app and just handle the sections with a router. Good luck!