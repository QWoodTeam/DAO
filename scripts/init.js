let QWoodDAOToken = artifacts.require("./QWoodDAOToken.sol"),
    QWoodDAO = artifacts.require("./QWoodDAO.sol");

const util = require('./utils/util');

const configAccounts = require(`./config/accounts.json`);

const init = async function (accounts) {
  const deployerAccount = accounts[0],
        ownerAccount = configAccounts.owner,
        investorsAccount = configAccounts.investors;

  console.log("Init script start.");

  console.log("Accounts:");
  console.log(ownerAccount + " (owner)");
  console.log(investorsAccount + " (investors)");
  console.log(deployerAccount + " (deployer)");


  let token = await QWoodDAOToken.deployed();
  console.log("QWoodDAOToken address: " + QWoodDAOToken.address);

  let dao = await QWoodDAO.deployed();
  console.log("QWoodDAO address: " + QWoodDAO.address);

  console.log("Transfer tokens to owner.."); // 500 000
  let tx = await token.transfer(ownerAccount, '500000000000000000000000', { from: deployerAccount }); // 10**18 = 1000000000000000000
  util.printTxInfo(tx, `passed`);

  console.log("Transfer tokens to investors.."); // 1 500 000
  tx = await token.transfer(investorsAccount, '1500000000000000000000000', { from: deployerAccount }); // 10**18 = 1000000000000000000
  util.printTxInfo(tx, `passed`);

  console.log("Set dao address in token contract..");
  tx = await token.setDAOContract(QWoodDAO.address, { from: deployerAccount });
  util.printTxInfo(tx, `passed`);

  console.log("Transfer tokens to dao contract.."); // 7 000 000
  tx = await token.transfer(QWoodDAO.address, '7000000000000000000000000', { from: deployerAccount }); // 10**18 = 1000000000000000000
  util.printTxInfo(tx, `passed`);

  console.log("Set owner of token contract to ownerAccount");
  tx = await token.transferOwnership(ownerAccount, { from: deployerAccount });
  util.printTxInfo(tx, `passed`);

  console.log("Set owner of dao contract to ownerAccount");
  tx = await dao.transferOwnership(ownerAccount, { from: deployerAccount });
  util.printTxInfo(tx, `passed`);

  console.log("Init script end.");
};

module.exports = function () {
  web3.eth.getAccounts(async (n, a) => await init(a));
};
