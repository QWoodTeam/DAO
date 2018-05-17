# Qwood DAO
DAO smart-contract for Qwood.  
With using [Truffle framework](http://truffleframework.com/).
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
geth --testnet --syncmode "light" --rpc --rpcport 7545 --rpcapi "personal,admin,eth,web3,net" --rpccorsdomain "*" --rpcvhosts "*" -maxpendpeers 10
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
geth --syncmode "light" --rpc --rpcport 7545 --rpcapi "personal,admin,eth,web3,net" --rpccorsdomain "*" --rpcvhosts "*" -maxpendpeers 10
```
#### Run
```
$ npm run mainnetNode
> compile
> migrate --reset
```
