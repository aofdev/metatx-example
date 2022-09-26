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

    event Mint(
        uint256 id,
        address indexed sender,
        address input,
        uint256 inputAmount,
        address indexed asset,
        uint256 assetAmount,
        uint256 pricePerUnit,
        uint256 feeAmount
    );
    event SetVault(address sender, address vault);
    event SetFee(address sender, address to);

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
    address public vault;
    address public fee;
    uint256 public lastId; // starts from 1
    mapping(uint256 => Order) public orders;

    constructor(
        address _inputToken,
        address _vault,
        address _fee,
        MinimalForwarder _trustedForwarder
    ) ERC2771Context(address(_trustedForwarder)) {
        inputToken = _inputToken;
        setVault(_vault);
        setFee(_fee);
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

    function setVault(address _vault) public onlyOwner {
        require(_vault != address(0), "!vault");
        vault = _vault;
        emit SetVault(msg.sender, _vault);
    }

    function setFee(address _fee) public onlyOwner {
        fee = _fee;
        emit SetFee(msg.sender, fee);
    }

    function mint(
        address asset,
        uint256 assetAmount,
        uint256 pricePerUnit
    ) external payable whenNotPaused nonReentrant returns (uint256) {
        uint256 inputAmount = (assetAmount * pricePerUnit) / 1 ether;
        uint256 feeAmount = (1 * inputAmount) / 1000; // 0.1%
        uint256 gasAmount = (1 * inputAmount) / 100000; // 0.001%
        uint256 totalAmount = inputAmount + feeAmount + gasAmount;

        IERC20(inputToken).safeTransferFrom(
            _msgSender(),
            address(this),
            totalAmount
        );

        IERC20(inputToken).safeTransfer(vault, feeAmount);
        IERC20(inputToken).safeTransfer(fee, gasAmount);

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

        emit Mint(
            lastId,
            _msgSender(),
            inputToken,
            inputAmount,
            asset,
            assetAmount,
            pricePerUnit,
            feeAmount
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
