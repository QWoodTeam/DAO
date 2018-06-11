pragma solidity ^0.4.23;


/**
 * @title SafeMath
 * @dev Math operations with safety checks that throw on error
 */
library SafeMath {

  /**
  * @dev Multiplies two numbers, throws on overflow.
  */
  function mul(uint256 a, uint256 b) internal pure returns (uint256 c) {
    // Gas optimization: this is cheaper than asserting 'a' not being zero, but the
    // benefit is lost if 'b' is also tested.
    // See: https://github.com/OpenZeppelin/openzeppelin-solidity/pull/522
    if (a == 0) {
      return 0;
    }

    c = a * b;
    assert(c / a == b);
    return c;
  }

  /**
  * @dev Integer division of two numbers, truncating the quotient.
  */
  function div(uint256 a, uint256 b) internal pure returns (uint256) {
    // assert(b > 0); // Solidity automatically throws when dividing by 0
    // uint256 c = a / b;
    // assert(a == b * c + a % b); // There is no case in which this doesn't hold
    return a / b;
  }

  /**
  * @dev Subtracts two numbers, throws on overflow (i.e. if subtrahend is greater than minuend).
  */
  function sub(uint256 a, uint256 b) internal pure returns (uint256) {
    assert(b <= a);
    return a - b;
  }

  /**
  * @dev Adds two numbers, throws on overflow.
  */
  function add(uint256 a, uint256 b) internal pure returns (uint256 c) {
    c = a + b;
    assert(c >= a);
    return c;
  }
}


/**
 * @title ERC20 interface (only needed methods)
 * @dev see https://github.com/ethereum/EIPs/issues/20
 */
contract ERC20 {
  function balanceOf(address who) public view returns (uint256);
  function transfer(address to, uint256 value) public returns (bool);
  function transferFrom(address from, address to, uint256 value) public returns (bool);
}


/**
 * @title Ownable
 * @dev The Ownable contract has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 */
contract Ownable {
  address public owner;


  event OwnershipRenounced(address indexed previousOwner);
  event OwnershipTransferred(
    address indexed previousOwner,
    address indexed newOwner
  );


  /**
   * @dev The Ownable constructor sets the original `owner` of the contract to the sender
   * account.
   */
  constructor() public {
    owner = msg.sender;
  }

  /**
   * @dev Throws if called by any account other than the owner.
   */
  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }

  /**
   * @dev Allows the current owner to transfer control of the contract to a newOwner.
   * @param newOwner The address to transfer ownership to.
   */
  function transferOwnership(address newOwner) public onlyOwner {
    require(newOwner != address(0));
    emit OwnershipTransferred(owner, newOwner);
    owner = newOwner;
  }

  /**
   * @dev Allows the current owner to relinquish control of the contract.
   */
  function renounceOwnership() public onlyOwner {
    emit OwnershipRenounced(owner);
    owner = address(0);
  }
}


/**
 * @title Pausable
 * @dev Base contract which allows children to implement an emergency stop mechanism.
 */
contract Pausable is Ownable {
  event Pause();
  event Unpause();

  bool public paused = false;


  /**
   * @dev Modifier to make a function callable only when the contract is not paused.
   */
  modifier whenNotPaused() {
    require(!paused);
    _;
  }

  /**
   * @dev Modifier to make a function callable only when the contract is paused.
   */
  modifier whenPaused() {
    require(paused);
    _;
  }

  /**
   * @dev called by the owner to pause, triggers stopped state
   */
  function pause() onlyOwner whenNotPaused public {
    paused = true;
    emit Pause();
  }

  /**
   * @dev called by the owner to unpause, returns to normal state
   */
  function unpause() onlyOwner whenPaused public {
    paused = false;
    emit Unpause();
  }
}


// TODO: Add pausable functionality
/**
 * @title QWoodDAOTokenSale
 * @dev The QWoodDAOTokenSale contract receive ether and other foreign tokens and exchange them to set tokens.
 */
contract QWoodDAOTokenSale is Pausable {
  using SafeMath for uint256;


  // Represents data of foreign token which can be exchange to token
  struct ReceivedToken {
    // name of foreign token
    string name;

    // number of token units a buyer gets per foreign token unit
    uint256 rate;

    // amount of raised foreign tokens
    uint256 raised;
  }


  // The token being sold
  ERC20 public token;

  // Address where funds are collected
  address public wallet;

  // How many token units a buyer gets per wei.
  // The rate is the conversion between wei and the smallest and indivisible token unit.
  // So, if you are using a rate of 1 with a ERC20 token with 3 decimals called TOK
  // 1 wei will give you 1 unit, or 0.001 TOK.
  uint256 public rate;

  // Amount of wei raised
  uint256 public weiRaised;

  // Map from token address to token data
  mapping (address => ReceivedToken) public receivedTokens;


  /**
   * Event for token purchase logging
   * @param purchaser who paid for the tokens
   * @param beneficiary who got the tokens
   * @param value weis paid for purchase
   * @param amount amount of tokens purchased
   */
  event TokenPurchase(
    address indexed purchaser,
    address indexed beneficiary,
    uint256 value,
    uint256 amount
  );

  /**
   * Event for change rate logging
   * @param newRate new number of token units a buyer gets per wei
   */
  event ChangeRate(uint256 newRate);

  /**
   * Event for add received token logging
   * @param tokenAddress address of added foreign token
   * @param name name of added token
   * @param rate number of token units a buyer gets per added foreign token unit
   */
  event AddReceivedToken(
    address indexed tokenAddress,
    string name,
    uint256 rate
  );

  /**
   * Event for remove received token logging
   * @param tokenAddress address of removed foreign token
   */
  event RemoveReceivedToken(address indexed tokenAddress);

  /**
   * Event for set new received token rate logging
   * @param tokenAddress address of foreign token
   * @param newRate new number of token units a buyer gets per added foreign token unit
   */
  event SetReceivedTokenRate(
    address indexed tokenAddress,
    uint256 newRate
  );


  /**
   * @param _rate Number of token units a buyer gets per wei
   * @param _wallet Address where collected funds will be forwarded to
   * @param _token Address of the token being sold
   */
  constructor (
    uint256 _rate,
    address _wallet,
    ERC20 _token
  )
    public
  {
    require(_rate > 0);
    require(_wallet != address(0));
    require(_token != address(0));

    rate = _rate;
    wallet = _wallet;
    token = _token;
  }


  // -----------------------------------------
  // External interface
  // -----------------------------------------

  /**
 * @dev fallback function ***DO NOT OVERRIDE***
 */
  function () external payable {
    buyTokens(msg.sender);
  }

  /**
   * @dev low level token purchase ***DO NOT OVERRIDE***
   * @param _beneficiary Address performing the token purchase
   */
  function buyTokens(address _beneficiary) public payable {
    require(_beneficiary != address(0));

    uint256 weiAmount = msg.value;
    require(weiAmount != 0);

    // TODO: test
    uint256 tokenBalance = token.balanceOf(address(this));
    require(tokenBalance > 0);

    // calculate token amount to be created
    uint256 tokens = _getTokenAmount(address(0), weiAmount);

    // TODO: test
    if (tokens > tokenBalance) {
      tokens = tokenBalance; // new tokens
      weiAmount = _inverseGetTokenAmount(address(0), tokens); // new weiAmount

      uint256 senderExcess = msg.value.sub(weiAmount);
      msg.sender.transfer(senderExcess);
    }

    // update state
    weiRaised = weiRaised.add(weiAmount);

    _processPurchase(_beneficiary, tokens); // transfer tokens to sender
    emit TokenPurchase(
      msg.sender,
      _beneficiary,
      weiAmount,
      tokens
    );

    _forwardFunds(weiAmount); // transfer ether to wallet
  }

  // TODO: test
  /**
   * @dev Sets new rate.
   * @param _newRate New number of token units a buyer gets per wei
   */
  function setRate(uint256 _newRate) onlyOwner public {
    require(_newRate > 0);
    rate = _newRate;

    emit ChangeRate(_newRate);
  }

  // TODO: test
  /**
   * @dev Set new wallet address.
   * @param _newWallet New address where collected funds will be forwarded to
   */
  function setWallet(address _newWallet) onlyOwner public {
    require(_newWallet != address(0));
    wallet = _newWallet;
  }

  // TODO: test
  /**
   * @dev Set new token address.
   * @param _newToken New address of the token being sold
   */
  function setToken(ERC20 _newToken) onlyOwner public {
    require(_newToken != address(0));
    token = _newToken;
  }

  // TODO: test
  /**
   * @dev Withdraws any tokens from this contract to wallet.
   * @param _tokenContract The address of the foreign token
   */
  function withdrawTokens(ERC20 _tokenContract) onlyOwner public {
    uint256 amount = _tokenContract.balanceOf(address(this));
    _tokenContract.transfer(wallet, amount);
  }

  // TODO: test
  /**
   * @dev Withdraws all ether from this contract to wallet.
   */
  function withdraw() onlyOwner public {
    wallet.transfer(address(this).balance);
  }

  // TODO: test
  /**
   * @dev Adds received foreign token.
   * @param _tokenAddress Address of the foreign token being added
   * @param _tokenName Name of the foreign token
   * @param _tokenRate Number of token units a buyer gets per foreign token unit
   */
  function addReceivedToken(
    ERC20 _tokenAddress,
    string _tokenName,
    uint256 _tokenRate
  )
    onlyOwner
    public
  {
    require(_tokenAddress != address(0));
    require(_tokenRate > 0);

    ReceivedToken memory _token = ReceivedToken({
      name: _tokenName,
      rate: _tokenRate,
      raised: 0
    });

    receivedTokens[_tokenAddress] = _token;

    emit AddReceivedToken(
      _tokenAddress,
      _token.name,
      _token.rate
    );
  }

  // TODO: test
  /**
   * @dev Removes received foreign token.
   * @param _tokenAddress Address of the foreign token being removed
   */
  function removeReceivedToken(ERC20 _tokenAddress) onlyOwner public {
    require(_tokenAddress != address(0));

    delete receivedTokens[_tokenAddress];

    emit RemoveReceivedToken(_tokenAddress);
  }


  // TODO: test
  /**
   * @dev Sets new rate for received foreign token.
   * @param _tokenAddress Address of the foreign token
   * @param _newTokenRate New number of token units a buyer gets per foreign token unit
   */
  function setReceivedTokenRate(
    ERC20 _tokenAddress,
    uint256 _newTokenRate
  )
    onlyOwner
    public
  {
    require(_tokenAddress != address(0));
    require(receivedTokens[_tokenAddress].rate > 0);
    require(_newTokenRate > 0);

    receivedTokens[_tokenAddress].rate = _newTokenRate; // TODO: test this (???)

    emit SetReceivedTokenRate(
      _tokenAddress,
      _newTokenRate
    );
  }

  // TODO: add tokenFallback interface -- transferAndCall scenario


  // Token recipient interface implementation

  event ReceivedTokens(
    address _from,
    uint256 _amount,
    address _tokenAddress,
    bytes _extraData
  );

  // For approveAndCall scenario
  function receiveApproval(
    address _from,
    uint256 _amount,
    address _tokenAddress,
    bytes _extraData
  )
    public
  {

    require(_from != address(0));
    require(_tokenAddress != address(0));
    require(receivedTokens[_tokenAddress].rate > 0); // check: token in receivedTokens
    require(_amount > 0);

    require(msg.sender == _tokenAddress);

    emit ReceivedTokens(
      _from,
      _amount,
      _tokenAddress,
      _extraData
    );

    _exchangeTokens(ERC20(_tokenAddress), _from, _amount);
  }

  // For approve + transferFrom scenario
  function depositToken(
    ERC20 _tokenAddress,
    uint256 _amount
  )
    public
  {
    // Remember to call ERC20(address).approve(this, amount) or this contract will not be able to do the transfer on your behalf
    require(_tokenAddress != address(0));
    require(receivedTokens[_tokenAddress].rate > 0); // check: token in receivedTokens
    require(_amount > 0);

    _exchangeTokens(_tokenAddress, msg.sender, _amount);
  }

  // -----------------------------------------
  // Internal interface
  // -----------------------------------------

  // low-level exchange method
  function _exchangeTokens(
    ERC20 _tokenAddress,
    address _sender,
    uint256 _amount
  )
    internal
  {
    uint256 foreignTokenAmount = _amount;

    // Transfer tokens to this contract
    require(_tokenAddress.transferFrom(_sender, address(this), foreignTokenAmount));

    // check balance tokens on this contract
    uint256 tokenBalance = token.balanceOf(address(this));
    require(tokenBalance > 0);

    // calculate token amount
    uint256 tokens = _getTokenAmount(_tokenAddress, foreignTokenAmount);

    // check: token excess
    if (tokens > tokenBalance) {
      tokens = tokenBalance;
      foreignTokenAmount = _inverseGetTokenAmount(_tokenAddress, tokens); // new foreign tokens amount

      uint256 senderForeignTokenExcess = _amount.sub(foreignTokenAmount);
      _tokenAddress.transfer(_sender, senderForeignTokenExcess);
    }

    // update raised state
    receivedTokens[_tokenAddress].raised = receivedTokens[_tokenAddress].raised.add(foreignTokenAmount);

    // transfer tokens to sender
    _processPurchase(_sender, tokens);
    emit TokenPurchase(
      _sender,
      _sender,
      foreignTokenAmount,
      tokens
    );

    // transfer foreign tokens to wallet (or collect)
    _forwardTokens(_tokenAddress, foreignTokenAmount);
  }

  /**
   * @dev Source of tokens. Override this method to modify the way in which the crowdsale ultimately gets and sends its tokens.
   * @param _beneficiary Address performing the token purchase
   * @param _tokenAmount Number of tokens to be emitted
   */
  function _deliverTokens(
    address _beneficiary,
    uint256 _tokenAmount
  )
  internal
  {
    token.transfer(_beneficiary, _tokenAmount);
  }

  /**
   * @dev Executed when a purchase has been validated and is ready to be executed. Not necessarily emits/sends tokens.
   * @param _beneficiary Address receiving the tokens
   * @param _tokenAmount Number of tokens to be purchased
   */
  function _processPurchase(
    address _beneficiary,
    uint256 _tokenAmount
  )
  internal
  {
    _deliverTokens(_beneficiary, _tokenAmount);
  }

  /**
   * @dev Override to extend the way in which ether or foreign token unit is converted to tokens.
   * @param _tokenAddress Address of foreign token or 0 if ether to tokens
   * @param _amount Value in wei or foreign token units to be converted into tokens
   * @return Number of tokens that can be purchased with the specified _amount (wei or foreign token units)
   */
  function _getTokenAmount(address _tokenAddress, uint256 _amount)
  internal view returns (uint256)
  {
    uint256 _rate;

    if (_tokenAddress == address(0)) {
      _rate = rate;
    } else {
      _rate = receivedTokens[_tokenAddress].rate;
    }

    return _amount.mul(_rate);
  }

  // Get wei or foreign tokens amount (inverse _getTokenAmount method)
  function _inverseGetTokenAmount(address _tokenAddress, uint256 _tokenAmount)
  internal view returns (uint256)
  {
    uint256 _rate;

    if (_tokenAddress == address(0)) {
      _rate = rate;
    } else {
      _rate = receivedTokens[_tokenAddress].rate;
    }

    return _tokenAmount.div(_rate);
  }

  /**
   * @dev Determines how ETH is stored/forwarded on purchases.
   */
  function _forwardFunds(uint256 _weiAmount) internal {
    wallet.transfer(_weiAmount);
  }

  /**
   * @dev Determines how foreign tokens is stored/forwarded on purchases.
   */
  function _forwardTokens(ERC20 _tokenAddress, uint256 _amount) internal {
    _tokenAddress.transfer(wallet, _amount);
  }
}
