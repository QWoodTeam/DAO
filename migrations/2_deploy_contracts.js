let QWoodDAOToken = artifacts.require("./QWoodDAOToken.sol"),
    QWoodDAO = artifacts.require("./QWoodDAO.sol"),
    QWoodDAOTokenSale = artifacts.require("./QWoodDAOTokenSale.sol");

// Token params
const periodOne = '1527811200',
      periodTwo = '1543622400',
      periodThree = '1559347200';

// DAO params
const minimumSharesToPassAVote = '1000000000000000000000000', // 1 000 000  *  10**18 = 1000000000000000000
      minutesForDebate = '1440', // 24 hours
      minShare = '100000000000000000000000'; // 100 000  *  10**18 = 1000000000000000000

// TokenSale params
const rate = 1000; // 1 ETH = 500$

module.exports = function(deployer, network, accounts) {
  const ownerAccount = accounts[0],
        tokenSaleLedgerAccount = accounts[9];

  deployer.deploy(QWoodDAOToken, periodOne, periodTwo, periodThree, {from: ownerAccount})
    .then(() => deployer.deploy(QWoodDAO, QWoodDAOToken.address, minimumSharesToPassAVote, minutesForDebate, minShare, {from: ownerAccount}))
    .then(() => deployer.deploy(QWoodDAOTokenSale, rate, tokenSaleLedgerAccount, QWoodDAOToken.address, { from: ownerAccount }));
};
