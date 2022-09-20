//SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract SimpleAssetToken is ERC20 {
	constructor(string memory name, string memory symbol)
	ERC20(name, symbol) {}

	function mint(uint256 amount) external {
		_mint(_msgSender(), amount);
	}

	function burn(uint256 amount) external {
		_burn(_msgSender(), amount);
	}
}
