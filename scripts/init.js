let QWoodDAOToken = artifacts.require("./QWoodDAOToken.sol"),
    QWoodDAO = artifacts.require("./QWoodDAO.sol"),
    QWoodDAOTokenSale = artifacts.require("./QWoodDAOTokenSale.sol");;

const util = require('./utils/util');

const init = async function (accounts) {
  const ownerAccount = accounts[0],
        investorsAccount = accounts[1];

  console.log("Init script start.");

  console.log("Accounts:");
  console.log(ownerAccount + " (owner)");
  console.log(investorsAccount + " (investors)");


  let token = await QWoodDAOToken.deployed();
  console.log("QWoodDAOToken address: " + QWoodDAOToken.address);

  let dao = await QWoodDAO.deployed();
  console.log("QWoodDAO address: " + QWoodDAO.address);

  let tokensale = await QWoodDAOTokenSale.deployed();
  console.log("QWoodDAOTokenSale address: " + QWoodDAOTokenSale.address);

  console.log("Transfer tokens to investors.."); // 1 500 000
  tx = await token.transfer(investorsAccount, '1500000000000000000000000', { from: ownerAccount }); // 10**18 = 1000000000000000000
  util.printTxInfo(tx, `passed`);

  console.log("Set dao address in token contract..");
  tx = await token.setDAOContract(QWoodDAO.address, { from: ownerAccount });
  util.printTxInfo(tx, `passed`);

  console.log("Transfer tokens to dao contract.."); // 7 000 000
  tx = await token.transfer(QWoodDAO.address, '7000000000000000000000000', { from: ownerAccount }); // 10**18 = 1000000000000000000
  util.printTxInfo(tx, `passed`);

  console.log("Transfer tokens to tokensale.."); // 500 000
  tx = await token.transfer(QWoodDAOTokenSale.address, '500000000000000000000000', { from: ownerAccount }); // 10**18 = 1000000000000000000
  util.printTxInfo(tx, `passed`);

  console.log("Init script end.");
};

module.exports = function () {
  web3.eth.getAccounts(async (n, a) => await init(a));
};
