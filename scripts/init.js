let QWoodDAOToken = artifacts.require("./QWoodDAOToken.sol"),
    QWoodDAO = artifacts.require("./QWoodDAO.sol");

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

  // TODO: transfer tokens to owner

  // TODO: transfer tokens to investors

  // TODO: set dao address in token contract

  // TODO: transfer tokens to dao contract

  // TODO: set owner of token contract to 0x0

  // TODO: unpause dao contract (add this functionality)

  // TODO: set owner of dao contract to ownerAccount

  console.log("Init script end.");
};

module.exports = function () {
  web3.eth.getAccounts(async (n, a) => await init(a));
};
