pragma solidity ^0.4.23;


import "zeppelin-solidity/contracts/token/ERC20/StandardToken.sol";

contract TokenRecipient {
  function receiveApproval(address _from, uint256 _value, address _token, bytes _extraData) external;
}

contract TestToken4 is StandardToken {

  string public constant name = "TestToken4";
  string public constant symbol = "TT4";
  uint8 public constant decimals = 18;

  uint256 public constant INITIAL_SUPPLY = 10000 * (10 ** uint256(decimals));

  constructor() public {
    totalSupply_ = INITIAL_SUPPLY;
    balances[msg.sender] = INITIAL_SUPPLY;
    emit Transfer(0x0, msg.sender, INITIAL_SUPPLY);
  }

  function approveAndCall(
    address _recipient,
    uint256 _value,
    bytes _extraData
  )
    external
  {
    approve(_recipient, _value);
    TokenRecipient(_recipient).receiveApproval(
      msg.sender,
      _value,
      address(this),
      _extraData);
  }

}
