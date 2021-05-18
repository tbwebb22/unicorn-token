// SPDX-License-Identifier: MIT
pragma solidity =0.7.6;

import "./libraries/BytesLib.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./uniswap/interfaces/IUniswapV3Pool.sol";
import "./uniswap/interfaces/IUniswapV3Factory.sol";
import "hardhat/console.sol";

/// @title A Uniswap token
/// @author Taylor Webb
contract UnicornToken is ERC20 { 
    using BytesLib for address;

    address public uniswapFactoryAddress;
    address public poolAddress;
    address public wethAddress;
    bytes32 public positionKey;

    /// @param _uniswapFactoryAddress The address of the deployed Uniswap factory
    /// @param _wethAddress The address of the deployed wrapped ETH contract
    constructor(address _uniswapFactoryAddress, address _wethAddress) ERC20("Unicorn", "UNCN") {
        uniswapFactoryAddress = _uniswapFactoryAddress;
        wethAddress = _wethAddress;
        _mint(address(this), 100 * 10 ** decimals());
    }
    
    /// @dev Creates a Uniswap pool with the specified fee
    /// @param _fee The pool fee
    function createPool(uint24 _fee) external {
        poolAddress = IUniswapV3Factory(uniswapFactoryAddress).createPool(address(this), wethAddress, _fee);
    }

    /// @dev Initializes the Uniswap pool
    /// @param _initialSqrtPriceX96 The SqrtPriceX96 to initialize the pool with
    function initializePool(uint160 _initialSqrtPriceX96) external {
        IUniswapV3Pool(poolAddress).initialize(_initialSqrtPriceX96);
    }

    /// @dev Adds liquidity to the Uniswap pool
    /// @param _tickLower The lower tick bound of the liquidity range
    /// @param _tickUpper The upper tick bound of the liquidity range
    /// @param _amount The amount of liquidity to add
    function mintLiquidity(int24 _tickLower, int24 _tickUpper, uint128 _amount) external {
        bytes memory _data = abi.encodePacked(msg.sender);
        IUniswapV3Pool(poolAddress).mint(msg.sender, _tickLower, _tickUpper, _amount, _data);
    }

    /// @dev The mint callback that transfers the tokens to the Uniswap pool
    /// @dev Transfers the liquidity position to the caller of the mintLiquidity function
    /// @param _amount0 The amount of token0 to be transferred to the pool
    /// @param _amount1 The amount of token1 to be transferred to the pool
    /// @param _data Contains the address of the caller of the mintLiquidity function
    function uniswapV3MintCallback(uint256 _amount0, uint256 _amount1, bytes calldata _data) external {
        require(msg.sender == poolAddress, "Can only be called by the Uniswap pool");
        address _sender = BytesLib.toAddress(_data, 0);
        _transfer(address(this), poolAddress, _amount0);
        IERC20(wethAddress).transferFrom(_sender, poolAddress, _amount1);
    }

    /// @dev Gets information of the specified liquidity position
    /// @param _owner The owner of the position
    /// @param _tickLower The lower tick bound of the liquidity range
    /// @param _tickUpper The upper tick bound of the liquidity range
    function getPosition(address _owner, int24 _tickLower, int24 _tickUpper) external view returns (uint128, uint256, uint256, uint128, uint128) {
        bytes32 _key = keccak256(abi.encodePacked(_owner, _tickLower, _tickUpper));
        return IUniswapV3Pool(poolAddress).positions(_key);
    }
}