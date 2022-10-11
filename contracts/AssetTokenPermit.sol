//SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "@openzeppelin/contracts/metatx/MinimalForwarder.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

contract AssetTokenPermit is ERC2771Context, ERC20Permit {
    constructor(
        string memory name,
        string memory symbol,
        address initialAccount,
        uint256 initialBalance,
        MinimalForwarder forwarder
    )
        ERC2771Context(address(forwarder))
        ERC20(name, symbol)
        ERC20Permit(name)
    {
        _mint(initialAccount, initialBalance);
    }

    function _msgSender()
        internal
        view
        virtual
        override(Context, ERC2771Context)
        returns (address sender)
    {
        return ERC2771Context._msgSender();
    }

    function _msgData()
        internal
        view
        virtual
        override(Context, ERC2771Context)
        returns (bytes calldata)
    {
        return ERC2771Context._msgData();
    }

    function getChainId() external view returns (uint256) {
        return block.chainid;
    }

    function mint(uint256 amount) external {
        _mint(_msgSender(), amount);
    }

    function burn(uint256 amount) external {
        _burn(_msgSender(), amount);
    }
}
