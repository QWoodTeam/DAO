let QWoodDAOToken = artifacts.require("./QWoodDAOToken.sol"),
    QWoodDAO = artifacts.require("./QWoodDAO.sol");

// Token params
const periodOne = '',
      periodTwo = '',
      periodThree = '';

// DAO params
const minimumSharesToPassAVote = 100,
      minutesForDebate = 10080; // 1 week

module.exports = function(deployer, network, accounts) {
  const deployerAccount = accounts[0];

  deployer.deploy(QWoodDAOToken, periodOne, periodTwo, periodThree, {from: deployerAccount})
    .then(() => deployer.deploy(QWoodDAO, QWoodDAOToken.address, minimumSharesToPassAVote, minutesForDebate, {from: deployerAccount}));
};
