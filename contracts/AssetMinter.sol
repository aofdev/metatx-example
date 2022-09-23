//SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "@openzeppelin/contracts/metatx/MinimalForwarder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract AssetMinter is ERC2771Context, Ownable, Pausable, ReentrancyGuard {
	using SafeERC20 for IERC20;

	enum OrderStatus {
		PENDING,
		FULFILLED,
		REJECTED,
		REFUND
	}

	struct Order {
		address sender;
		address asset;
		OrderStatus status;
		uint256 inputAmount;
		uint256 feeAmount;
		uint256 assetAmount;
		uint256 pricePerUnit;
		uint256 time;
		uint256 refundAmount;
	}

	address public immutable inputToken;
	uint256 public lastId; // starts from 1
	mapping (uint256 => Order) public orders;

	constructor(
		address _inputToken,
		MinimalForwarder _trustedForwarder
	) ERC2771Context(address(_trustedForwarder)) {
		inputToken = _inputToken;
	}

	function _msgSender() internal view virtual override(Context, ERC2771Context) returns (address sender) {
			return ERC2771Context._msgSender();
	}

	function _msgData() internal view virtual override(Context, ERC2771Context) returns (bytes calldata) {
			return ERC2771Context._msgData();
	}

	function mint(address asset, uint256 assetAmount, uint256 pricePerUnit) external payable whenNotPaused nonReentrant returns (uint256) {

		uint256 inputAmount = (assetAmount * pricePerUnit) / 1 ether;
		uint256 feeAmount = 0;

		IERC20(inputToken).safeTransferFrom(_msgSender(), address(this), inputAmount);

		lastId++;
		orders[lastId] = Order(
			_msgSender(),
			asset,
			OrderStatus.PENDING,
			inputAmount,
			feeAmount,
			assetAmount,
			pricePerUnit,
			block.timestamp,
			0
		);

		return lastId;
	}

	function pause() external onlyOwner {
		_pause();
	}

	function unpause() external onlyOwner {
		_unpause();
	}
}
