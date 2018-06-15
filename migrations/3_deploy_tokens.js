let TestToken1 = artifacts.require("./TestToken1.sol"),
    TestToken2 = artifacts.require("./TestToken2.sol"),
    TestToken3 = artifacts.require("./TestToken3.sol");

module.exports = function(deployer, network, accounts) {
  const ownerAccount = accounts[0];

  deployer.deploy(TestToken1, {from: ownerAccount})
    .then(() => deployer.deploy(TestToken2, {from: ownerAccount}))
    .then(() => deployer.deploy(TestToken3, {from: ownerAccount}));
};
