const util = require("./util.js");

const BN = web3.BigNumber;

const gasPrice = new BN('1e11');

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BN))
  .should();

const QWoodDAOTokenSale = artifacts.require("./QWoodDAOTokenSale.sol");
const QWoodDAOToken = artifacts.require("./QWoodDAOToken.sol");

const TestToken1 = artifacts.require("./TestToken1.sol"),
      TestToken2 = artifacts.require("./TestToken2.sol"),
      TestToken3 = artifacts.require("./TestToken3.sol");

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

  let testToken1, testToken2, testToken3;

  // Deploy contracts
  const deploy = async (_rate, _tokensForSale) => {
    token = await QWoodDAOToken.new(periodOne, periodTwo, periodThree, { from: owner });
    tokensale = await QWoodDAOTokenSale.new(initRate, ledger, token.address, { from: owner });

    // transfer tokens to tokensale contract
    await token.transfer(tokensale.address, _tokensForSale, { from: owner });
  };

  const deployTestTokens = async () => {
    testToken1 = await TestToken1.new({ from: owner });
    testToken2 = await TestToken2.new({ from: owner });
    testToken3 = await TestToken3.new({ from: owner });
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
      const preWeiRaised = await tokensale.weiRaised();

      await tokensale.sendTransaction({ value: valEth, from: user1 });

      const post = web3.eth.getBalance(ledger);
      const postWeiRaised = await tokensale.weiRaised();

      post.minus(pre).should.be.bignumber.equal(valEth);
      postWeiRaised.minus(preWeiRaised).should.be.bignumber.equal(valEth);
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
      const preWeiRaised = await tokensale.weiRaised();

      await tokensale.buyTokens(userBeneficiary, { value: valEth, from: user1 });

      const post = web3.eth.getBalance(ledger);
      const postWeiRaised = await tokensale.weiRaised();
      post.minus(pre).should.be.bignumber.equal(valEth);
      postWeiRaised.minus(preWeiRaised).should.be.bignumber.equal(valEth);
    });
  });

  describe('High-level purchase with excess for ether', function () {
    const newRate = new BN(100000); // rate = 100 000 QOD decimals for 1 wei

    const ether = new BN('7e18'), // 7 ETH
          cost = tokensForSale.div(newRate); // 5 ETH
          excess = ether.minus(cost); // 2 ETH

    beforeEach(async () => {
      // 5 ETH = all 500 000 QOD
      await tokensale.setRate(newRate, { from: owner });
    });

    it('should log send excess', async function () {
      const { logs } = await tokensale.sendTransaction({ value: ether, from: user1 });
      const event = logs.find(e => e.event === 'SendEtherExcess');
      should.exist(event);
      event.args.beneficiary.should.equal(user1);
      event.args.value.should.be.bignumber.equal(excess);
    });

    it('should return excess ether to sender', async function () {
      const pre = web3.eth.getBalance(user1);

      const { receipt } = await tokensale.sendTransaction({ value: ether, from: user1 });

      const gas = gasPrice.mul(new BN(receipt.gasUsed));

      const post = web3.eth.getBalance(user1);

      pre.minus(post).minus(gas).should.be.bignumber.equal(cost);

      const balance = await token.balanceOf(user1);
      balance.should.be.bignumber.equal(tokensForSale); // all 500 000 QOD

      const contractBalance = await token.balanceOf(tokensale.address);
      contractBalance.should.be.bignumber.equal(new BN(0)); // no tokens
    });

    it('should forward funds to wallet without sender excess', async function () {
      const pre = web3.eth.getBalance(ledger);
      const preWeiRaised = await tokensale.weiRaised();

      await tokensale.sendTransaction({ value: ether, from: user1 });

      const post = web3.eth.getBalance(ledger);
      const postWeiRaised = await tokensale.weiRaised();
      post.minus(pre).should.be.bignumber.equal(cost);
      postWeiRaised.minus(preWeiRaised).should.be.bignumber.equal(cost);
    });

    it('should fail if tokens on tokensale contract is 0', async function () {
      await tokensale.sendTransaction({ value: ether, from: user1 });

      await util.expectThrow(tokensale.sendTransaction({ value: new BN('1e18'), from: user2 }));
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
      const preWeiRaised = await tokensale.weiRaised();

      await tokensale.buyTokens(userBeneficiary, { value: ether, from: user1 });

      const post = web3.eth.getBalance(ledger);
      const postWeiRaised = await tokensale.weiRaised();
      post.minus(pre).should.be.bignumber.equal(cost);
      postWeiRaised.minus(preWeiRaised).should.be.bignumber.equal(cost);
    });

    it('should fail if tokens on tokensale contract is 0', async function () {
      await tokensale.buyTokens(userBeneficiary, { value: ether, from: user1 });

      await util.expectThrow(tokensale.buyTokens(user2, { value: new BN('1e18'), from: user2 }));
    });
  });

  describe("Withdraw", function () {
    const ether = new BN('1e18'),
          testToken1amount = new BN('3e18');

    before(async () => {
      await deployTestTokens();
    });

    beforeEach(async () => {
      await tokensale.sendTransaction({ value: ether, from: user3 });

      await testToken1.transfer(tokensale.address, testToken1amount, { from: owner });
    });

    it('should collect ether on wallet (not contract)', async function () {
      const balance = web3.eth.getBalance(tokensale.address);
      balance.should.be.bignumber.equal(new BN(0));
    });

    it('should be able withdraw any tokens to wallet by owner', async function () {
      const pre = await testToken1.balanceOf(ledger);
      const preTokensale = await testToken1.balanceOf(tokensale.address);

      await tokensale.withdrawTokens(testToken1.address, { from: owner }).should.be.fulfilled;

      const post = await testToken1.balanceOf(ledger);
      const postTokensale = await testToken1.balanceOf(tokensale.address);
      post.minus(pre).should.be.bignumber.equal(testToken1amount);
      preTokensale.minus(postTokensale).should.be.bignumber.equal(testToken1amount);
      postTokensale.should.be.bignumber.equal(new BN(0));
    });

    it('should fail if token address is 0', async function () {
      await util.expectThrow(tokensale.withdrawTokens(0, { from: owner }));
    });

    it('should fail if not owner withdraw any tokens', async function () {
      await util.expectThrow(tokensale.withdrawTokens(testToken1.address, { from: user3 }));
    });
  });

  describe("Manage received tokens", function () {
    const tokenRate = new BN(1000),
          newTokenRate = new BN(1500);

    let addTestToken1Tx;

    before(async () => {
      await deployTestTokens();
    });

    beforeEach(async () => {
      addTestToken1Tx = await tokensale.addReceivedToken(testToken1.address, 'TestToken1', tokenRate, { from: owner });
    });

    it('should add received token', async function () {
      const [
        tName,
        tRate,
        tRaised
      ] = await tokensale.receivedTokens(testToken1.address);

      tName.should.equal('TestToken1');
      tRate.should.be.bignumber.equal(tokenRate);
      tRaised.should.be.bignumber.equal(new BN(0));
    });

    it('should log adding received token', async function () {
      const logs = addTestToken1Tx.logs;

      const event = logs.find(e => e.event === 'AddReceivedToken');
      should.exist(event);
      event.args.tokenAddress.should.equal(testToken1.address);
      event.args.name.should.equal('TestToken1');
      event.args.rate.should.be.bignumber.equal(tokenRate);
    });

    it('should remove received token', async function () {
      await tokensale.removeReceivedToken(testToken1.address, { from: owner }).should.be.fulfilled;

      const [
        tName,
        tRate,
        tRaised
      ] = await tokensale.receivedTokens(testToken1.address);

      tName.should.equal('');
      tRate.should.be.bignumber.equal(new BN(0));
      tRaised.should.be.bignumber.equal(new BN(0));
    });

    it('should log removing received token', async function () {
      const { logs } = await tokensale.removeReceivedToken(testToken1.address, { from: owner });

      const event = logs.find(e => e.event === 'RemoveReceivedToken');
      should.exist(event);
      event.args.tokenAddress.should.equal(testToken1.address);
    });

    it('should set new token rate', async function () {
      await tokensale.setReceivedTokenRate(testToken1.address, newTokenRate, { from: owner }).should.be.fulfilled;

      const [
        tName,
        tRate,
        tRaised
      ] = await tokensale.receivedTokens(testToken1.address);

      tRate.should.be.bignumber.equal(newTokenRate);
    });

    it('should log changing token rate', async function () {
      const { logs } = await tokensale.setReceivedTokenRate(testToken1.address, newTokenRate, { from: owner });

      const event = logs.find(e => e.event === 'SetReceivedTokenRate');
      should.exist(event);
      event.args.tokenAddress.should.equal(testToken1.address);
      event.args.newRate.should.be.bignumber.equal(newTokenRate);
    });

    it('should fail if not owner use manage function', async function () {
      await util.expectThrow(tokensale.addReceivedToken(testToken2.address, 'TestToken2', tokenRate, { from: user3 }));
      await util.expectThrow(tokensale.removeReceivedToken(testToken1.address, { from: user3 }));
      await util.expectThrow(tokensale.setReceivedTokenRate(testToken1.address, newTokenRate, { from: user3 }));
    });

    it('should fail if used incorrect params', async function () {
      await util.expectThrow(tokensale.addReceivedToken(0, 'TestToken2', tokenRate, { from: owner }));
      await util.expectThrow(tokensale.addReceivedToken(testToken2.address, 'TestToken2', new BN(0), { from: owner }));

      await util.expectThrow(tokensale.removeReceivedToken(0, { from: owner }));

      await util.expectThrow(tokensale.setReceivedTokenRate(0, newTokenRate, { from: owner }));
      await util.expectThrow(tokensale.setReceivedTokenRate(testToken3.address, newTokenRate, { from: owner }));
      await util.expectThrow(tokensale.setReceivedTokenRate(testToken1.address, new BN(0), { from: owner }));

    });
  });

  // Data for tests
  const testTokens = [
    {
      name: 'TestToken1',
      rate: new BN('1000'),
      amount: new BN('1e18'),
      amountToken: new BN('1e18').mul(new BN('1000'))
    },
    {
      name: 'TestToken2',
      rate: new BN('2000'),
      amount: new BN('2e18'),
      amountToken: new BN('2e18').mul(new BN('2000'))
    },
    {
      name: 'TestToken3',
      rate: new BN('3000'),
      amount: new BN('3e18'),
      amountToken: new BN('3e18').mul(new BN('3000'))
    },
  ];

  const addTestTokensToReceived = async () => {
    await tokensale.addReceivedToken(testToken1.address, testTokens[0].name, testTokens[0].rate, { from: owner });
    await tokensale.addReceivedToken(testToken2.address, testTokens[1].name, testTokens[1].rate, { from: owner });
  };

  const approveTestTokens = async () => {
    await testToken1.approve(tokensale.address, testTokens[0].amount, { from: owner });

    // transfer 10 TestToken1 to user1 and approve 1 for tokensale contract
    await testToken1.transfer(user1, new BN('10e18'), { from: owner });
    await testToken1.approve(tokensale.address, testTokens[0].amount, { from: user1 });
  };

  describe("Accepting foreign token payments. Approve + transferFrom scenario", function () {
    beforeEach(async () => {
      await deployTestTokens();
      await addTestTokensToReceived();
      await approveTestTokens();
    });

    it("should accept token payments", async function () {
      await tokensale.depositToken(testToken1.address, testTokens[0].amount, { from: owner }).should.be.fulfilled;
    });

    it('should fail if used incorrect params, token not received, no approved', async function () {
      await util.expectThrow(tokensale.depositToken(0, testTokens[0].amount, { from: owner }));
      await util.expectThrow(tokensale.depositToken(testToken1.address, 0, { from: owner }));

      // TestToken3 not received
      await util.expectThrow(tokensale.depositToken(testToken3.address, testTokens[2].amount, { from: owner }));

      // TestToken2 received, but not approved for owner
      await util.expectThrow(tokensale.depositToken(testToken2.address, testTokens[1].amount, { from: owner }));
    });

    it('should log token purchase', async function () {
      const { logs } = await tokensale.depositToken(testToken1.address, testTokens[0].amount, { from: owner });
      const event = logs.find(e => e.event === 'TokenForTokenPurchase');

      should.exist(event);
      event.args.purchaser.should.equal(owner);
      event.args.beneficiary.should.equal(owner);
      event.args.value.should.be.bignumber.equal(testTokens[0].amount);
      event.args.amount.should.be.bignumber.equal(testTokens[0].amountToken);
    });

    it('should assign tokens to sender', async function () {
      await tokensale.depositToken(testToken1.address, testTokens[0].amount, { from: user1 });

      const balance = await token.balanceOf(user1);
      balance.should.be.bignumber.equal(testTokens[0].amountToken);
    });

    it('should forward foreign tokens to wallet', async function () {
      const pre = await testToken1.balanceOf(ledger);
      const preToken = await tokensale.receivedTokens(testToken1.address);

      await tokensale.depositToken(testToken1.address, testTokens[0].amount, { from: user1 });

      const post = await testToken1.balanceOf(ledger);
      const postToken = await tokensale.receivedTokens(testToken1.address);

      post.minus(pre).should.be.bignumber.equal(testTokens[0].amount);

      // preToken[2] and postToken[2] - tokenRaised field
      postToken[2].minus(preToken[2]).should.be.bignumber.equal(testTokens[0].amount);
    });
  });

  describe('Accepting foreign token payments with excess. Approve + transferFrom scenario', function () {
    const testToken1NewRate = new BN(100000); // rate = 100 000 QOD decimals for 1 decimal unit TT1

    const sendTokens = new BN('7e18'), // 7 TT1
          needTokens = tokensForSale.div(testToken1NewRate); // 5 TT1
          excessTokens = sendTokens.minus(needTokens); // 2 TT1

    beforeEach(async () => {
      await deployTestTokens();

      await tokensale.addReceivedToken(testToken1.address, 'TestToken1', testToken1NewRate, { from: owner });

      // transfer 10 TestToken1 to user1 and approve 1 for tokensale contract
      await testToken1.transfer(user1, new BN('10e18'), { from: owner });
      await testToken1.approve(tokensale.address, sendTokens, { from: user1 });
    });

    it('should log send tokens excess', async function () {
      const { logs } = await tokensale.depositToken(testToken1.address, sendTokens, { from: user1 });

      const event = logs.find(e => e.event === 'SendTokensExcess');
      should.exist(event);
      event.args.beneficiary.should.equal(user1);
      event.args.value.should.be.bignumber.equal(excessTokens);
    });

    it('should return excess tokens to sender', async function () {
      const pre = await testToken1.balanceOf(user1);

      await tokensale.depositToken(testToken1.address, sendTokens, { from: user1 });

      const post = await testToken1.balanceOf(user1);

      // with returned excess
      pre.minus(post).should.be.bignumber.equal(needTokens);

      const balance = await token.balanceOf(user1);
      balance.should.be.bignumber.equal(tokensForSale); // all 500 000 QOD

      const contractBalance = await token.balanceOf(tokensale.address);
      contractBalance.should.be.bignumber.equal(new BN(0)); // no tokens
    });

    it('should forward foreign tokens to wallet without sender tokens excess', async function () {
      const pre = await testToken1.balanceOf(ledger);
      const preToken = await tokensale.receivedTokens(testToken1.address);

      await tokensale.depositToken(testToken1.address, sendTokens, { from: user1 });

      const post = await testToken1.balanceOf(ledger);
      const postToken = await tokensale.receivedTokens(testToken1.address);

      post.minus(pre).should.be.bignumber.equal(needTokens);

      // preToken[2] and postToken[2] - tokenRaised field
      postToken[2].minus(preToken[2]).should.be.bignumber.equal(needTokens);
    });

    it('should fail if tokens on tokensale contract is 0', async function () {
      await tokensale.depositToken(testToken1.address, sendTokens, { from: user1 });

      // Transfer + approve for user2 from user1
      await testToken1.transfer(user2, new BN('1e18'), { from: user1 });
      await testToken1.approve(tokensale.address, new BN('1e18'), { from: user2 });
      await util.expectThrow(tokensale.depositToken(testToken1.address, new BN('1e18'), { from: user2 }));
    });
  });

  // TODO: approveAndCall scenario -- function receiveApproval
});
