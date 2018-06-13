let QWoodDAOToken = artifacts.require("./QWoodDAOToken.sol"),
    QWoodDAOTokenSale = artifacts.require("./QWoodDAOTokenSale.sol");

const rate = 1200;

module.exports = function(deployer, network, accounts) {
  const deployerAccount = accounts[0],
        wallet = accounts[2];

  // console.log(deployerAccount);

  deployer.deploy(QWoodDAOTokenSale, rate, wallet, QWoodDAOToken.address, { from: deployerAccount });

};
