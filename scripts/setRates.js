let TestToken1 = artifacts.require("./TestToken1.sol"),
    TestToken2 = artifacts.require("./TestToken2.sol"),
    TestToken3 = artifacts.require("./TestToken3.sol"),
    QWoodDAOTokenSale = artifacts.require("./QWoodDAOTokenSale.sol");

const util = require('./utils/util');

const BN = web3.BigNumber;

const addTokens = async function (accounts) {
  const ownerAccount = accounts[0];

  let tokensale = await QWoodDAOTokenSale.deployed();
  console.log("QWoodDAOTokenSale address: " + QWoodDAOTokenSale.address);

  let tt1 = await TestToken1.deployed(),
      tt2 = await TestToken2.deployed(),
      tt3 = await TestToken3.deployed();

  console.log("TT1 address: " + TestToken1.address);
  console.log("TT2 address: " + TestToken2.address);
  console.log("TT3 address: " + TestToken3.address);

  await tokensale.addReceivedToken(TestToken1.address, 'TestToken1', new BN(2000), { from: ownerAccount });
  await tokensale.addReceivedToken(TestToken2.address, 'TestToken2', new BN(3000), { from: ownerAccount });
  await tokensale.addReceivedToken(TestToken3.address, 'TestToken3', new BN(4000), { from: ownerAccount });
};

const setRates = async function (accounts) {
  const ownerAccount = accounts[0];

  let tokensale = await QWoodDAOTokenSale.deployed();
  console.log("QWoodDAOTokenSale address: " + QWoodDAOTokenSale.address);

  let tt1 = await TestToken1.deployed(),
      tt2 = await TestToken2.deployed(),
      tt3 = await TestToken3.deployed();

  console.log("TT1 address: " + TestToken1.address);
  console.log("TT2 address: " + TestToken2.address);
  console.log("TT3 address: " + TestToken3.address);

  await tokensale.setReceivedTokenRate(TestToken1.address, new BN(2000), { from: ownerAccount });
  await tokensale.setReceivedTokenRate(TestToken2.address, new BN(3000), { from: ownerAccount });
  await tokensale.setReceivedTokenRate(TestToken3.address, new BN(4000), { from: ownerAccount });
};

module.exports = function () {
  web3.eth.getAccounts(async (n, a) => await addTokens(a));
};
