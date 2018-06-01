# QWood Decentralized Autonomous Organization
### - ERC827 freezable token smart-contract for DAO.
### - Decentralized organization of shareholders with voting rights.
With using [Truffle framework](http://truffleframework.com/). Powered by [Ethereum](https://ethereum.org/).
## Install
```
$ npm i -g truffle
$ npm i
```
## Quick Usage
### Run in testrpc 
```
$ npm run develop
> compile
> migrate --reset
> test
```
### Run in Ropsten test network (Infura)
```
$ npm run ropstenInfura
> compile
> migrate --reset
```
### Run in Ropsten test network (Geth)
#### Geth node start
```
geth --testnet --syncmode "light" --rpc --rpcport 7545 --rpcapi "personal,admin,eth,web3,net" --rpccorsdomain "*" --rpcvhosts "*" --maxpendpeers 10
```
#### Run
```
$ npm run ropstenNode
> compile
> migrate --reset
```
### Run in main Ethereum network (Infura)
```
$ npm run mainnetInfura
> compile
> migrate --reset
```
### Run in main Ethereum network (Geth)
### Geth node start
```
geth --syncmode "light" --rpc --rpcport 7545 --rpcapi "personal,admin,eth,web3,net" --rpccorsdomain "*" --rpcvhosts "*" --maxpendpeers 10
```
#### Run
```
$ npm run mainnetNode
> compile
> migrate --reset
```
## Deploy
```
1. Configure accounts in script/config/accounts.json
2. Configure params in migrations/2_deploy_contracts.js
3. Configure deployer account (nmemonic in .env)
4. Set gaslimit/gasprice (.env)
truffle compile --network <NET>
truffle migrate --network <NET> --reset
truffle exec scripts/init.js --network <NET>
```
