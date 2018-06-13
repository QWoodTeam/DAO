const util = require("./util.js");

const BN = web3.BigNumber;

const gasPrice = new BN('1e11');

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BN))
  .should();

const QWoodDAOTokenSale = artifacts.require("./QWoodDAOTokenSale.sol");
const QWoodDAOToken = artifacts.require("./QWoodDAOToken.sol");

contract("QWoodDAOTokenSale", function(accounts) {
  const eq = assert.equal.bind(assert);

  // Accounts aliases
  const owner = accounts[0];
  const ledger = accounts[1];
  const user1 = accounts[2];
  const user2 = accounts[3];
  const user3 = accounts[4];
  const userBeneficiary = accounts[5];

  // Token params
  const periodOne = '1527811200',
        periodTwo = '1543622400',
        periodThree = '1559347200';

  // TokenSale params
  const initRate = new BN(1200), // For ether cost 600$ (1 wei = 1200 QOD decimal units)
        tokensForSale = new BN('5e23'); // 500 000 QOD

  // Deployed contract instances
  let token, tokensale;

  // Global data for tests
  const valEth = new BN('1e18'),
        valToken = valEth.mul(initRate);

  // Deploy contracts
  const deploy = async (_rate, _tokensForSale) => {
    token = await QWoodDAOToken.new(periodOne, periodTwo, periodThree, { from: owner });
    tokensale = await QWoodDAOTokenSale.new(initRate, ledger, token.address, { from: owner });

    // transfer tokens to tokensale contract
    await token.transfer(tokensale.address, _tokensForSale, { from: owner });
  };

  // before(() => {});
  // after(() => {});
  // beforeEach(async () => {});
  // afterEach(async () => {});

  beforeEach(async () => {
    await deploy(initRate, tokensForSale);
  });

  describe("Initial State", function () {
    it("should own contract", async function () {
      eq(await tokensale.owner(), owner);
    });

    it("should start with rate, ledger wallet and QOD token address", async function () {
      const rate = await tokensale.rate();
      assert(rate.eq(initRate));

      eq(await tokensale.wallet(), ledger);
      eq(await tokensale.token(), token.address);
    });

    it("should start with weiRaised is 0", async function () {
      const weiRaised = await tokensale.weiRaised();
      assert(weiRaised.eq(new BN(0)));
    });
  });

  describe("Changing State", function () {
    it("set new rate by only owner", async function () {
      const events = tokensale.ChangeRate();

      await tokensale.setRate(new BN(600), { from: owner });

      const eventsLog = await events.get();
      eq(eventsLog[0].event, "ChangeRate");
      assert(eventsLog[0].args.newRate.eq(new BN(600)));

      const rate = await tokensale.rate();
      assert(rate.eq(new BN(600)));

      await util.expectThrow(tokensale.setRate(new BN(0), { from: owner }));

      await util.expectThrow(tokensale.setRate(new BN(800), { from: user1 }));
    });

    it("set new wallet by only owner", async function () {
      await tokensale.setWallet(accounts[9], { from: owner });

      const wallet = await tokensale.wallet();
      eq(wallet, accounts[9]);

      await util.expectThrow(tokensale.setWallet(0, { from: owner }));

      await util.expectThrow(tokensale.setWallet(accounts[9], { from: user1 }));
    });

    it("set new token address by only owner", async function () {
      await tokensale.setToken(accounts[8], { from: owner });

      const token = await tokensale.token();
      eq(token, accounts[8]);

      await util.expectThrow(tokensale.setToken(0, { from: owner }));

      await util.expectThrow(tokensale.setToken(accounts[8], { from: user1 }));
    });
  });

  describe("Accepting ether payments", function () {
    it("should accept payments", async function () {
      await tokensale.send(new BN('1e18'), { from: user1 }).should.be.fulfilled;

      await tokensale.buyTokens(userBeneficiary, { value: new BN('1e18'), from: user1 }).should.be.fulfilled;
    });
  });

  describe("High-level purchase for ether", function () {
    it("should log purchase for ether", async function () {
      const { logs } = await tokensale.sendTransaction({ value: valEth, from: user1 });
      const event = logs.find(e => e.event === 'TokenPurchase');

      eq(event.event, 'TokenPurchase');
      eq(event.args.purchaser, user1);
      eq(event.args.beneficiary, user1);
      assert(event.args.value.eq(valEth));
      assert(event.args.amount.eq(valToken));
    });

    it('should assign tokens to sender', async function () {
      await tokensale.sendTransaction({ value: valEth, from: user1 });

      let balance = await token.balanceOf(user1);

      balance.should.be.bignumber.equal(valToken);
    });

    it('should forward funds to wallet', async function () {
      const pre = web3.eth.getBalance(ledger);

      await tokensale.sendTransaction({ value: valEth, from: user1 });

      const post = web3.eth.getBalance(ledger);

      post.minus(pre).should.be.bignumber.equal(valEth);
    });
  });

  describe('Low-level purchase for ether', function () {
    it('should log purchase', async function () {
      const { logs } = await tokensale.buyTokens(userBeneficiary, { value: valEth, from: user1 });
      const event = logs.find(e => e.event === 'TokenPurchase');

      should.exist(event);
      event.args.purchaser.should.equal(user1);
      event.args.beneficiary.should.equal(userBeneficiary);
      event.args.value.should.be.bignumber.equal(valEth);
      event.args.amount.should.be.bignumber.equal(valToken);
    });

    it('should assign tokens to beneficiary', async function () {
      await tokensale.buyTokens(userBeneficiary, { value: valEth, from: user1 });

      const balance = await token.balanceOf(userBeneficiary);
      balance.should.be.bignumber.equal(valToken);
    });

    it('should forward funds to wallet', async function () {
      const pre = web3.eth.getBalance(ledger);

      await tokensale.buyTokens(userBeneficiary, { value: valEth, from: user1 });

      const post = web3.eth.getBalance(ledger);
      post.minus(pre).should.be.bignumber.equal(valEth);
    });
  });

  describe('Low-level purchase with excess for ether', function () {
    const newRate = new BN(100000); // rate = 100 000 QOD decimals for 1 wei

    const ether = new BN('7e18'), // 7 ETH
          cost = tokensForSale.div(newRate); // 5 ETH
          excess = ether.minus(cost); // 2 ETH

    beforeEach(async () => {
      // 5 ETH = all 500 000 QOD
      await tokensale.setRate(newRate, { from: owner });
    });

    it('should log send excess', async function () {
      const { logs } = await tokensale.buyTokens(userBeneficiary, { value: ether, from: user1 });
      const event = logs.find(e => e.event === 'SendEtherExcess');
      should.exist(event);
      event.args.beneficiary.should.equal(user1);
      event.args.value.should.be.bignumber.equal(excess);
    });

    it('should return excess ether to sender', async function () {
      const pre = web3.eth.getBalance(user1);

      const { receipt } = await tokensale.buyTokens(userBeneficiary, { value: ether, from: user1 });
      const gas = gasPrice.mul(new BN(receipt.gasUsed));

      const post = web3.eth.getBalance(user1);

      pre.minus(post).minus(gas).should.be.bignumber.equal(cost);

      const balance = await token.balanceOf(userBeneficiary);
      balance.should.be.bignumber.equal(tokensForSale); // all 500 000 QOD

      const contractBalance = await token.balanceOf(tokensale.address);
      contractBalance.should.be.bignumber.equal(new BN(0)); // no tokens
    });

    it('should forward funds to wallet without sender excess', async function () {
      const pre = web3.eth.getBalance(ledger);

      await tokensale.buyTokens(userBeneficiary, { value: ether, from: user1 });

      const post = web3.eth.getBalance(ledger);
      post.minus(pre).should.be.bignumber.equal(cost);
    });

    it('should fail if tokens on tokensale contract is 0', async function () {
      await tokensale.buyTokens(userBeneficiary, { value: ether, from: user1 });

      await util.expectThrow(tokensale.buyTokens(user2, { value: new BN('1e18'), from: user2 }));
    });
  });


  // TODO: withdraw ether
  // TODO: withdraw foreign tokens
  describe("Withdraw", function () {

  });


  // TODO: add received tokens
  // TODO: remove received tokens
  // TODO: change received tokens rate
  describe("Manage received tokens", function () {

  });

  // TODO: approve + transferFrom scenario -- function depositTokens
  // TODO: approveAndCall scenario -- function receiveApproval
  describe("Accepting foreign token payments", function () {

  });


  // TODO: internal functions test
});
