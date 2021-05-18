const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");
const { fixture } = require("./fixtures");

describe("Unicorn Token Tests", function () {
  let user, weth, unicornToken, uniswapPool;

  before(async () => {
    ({ user, uniswapFactory, weth, unicornToken } = await fixture());
  });

  it("Creates Uniswap pool with correct token pair", async function () {
    // Creates pool containing UNCN and WETH
    // With fee of 0.05% and tick spacing of 10
    await unicornToken.createPool(500);

    const poolAddress = await unicornToken.poolAddress();

    uniswapPool = await ethers.getContractAt("UniswapV3Pool", poolAddress);

    const poolToken0Address = await uniswapPool.token0();

    const poolToken1Address = await uniswapPool.token1();

    expect(poolToken0Address).to.equal(unicornToken.address);

    expect(poolToken1Address).to.equal(weth.address);
  });

  it("Initializes Uniswap pool", async function () {
    const X96 = BigNumber.from("2").pow(BigNumber.from("96"));

    const initialPrice = "1";

    // Convert initial price to sqrtPriceX96 format
    const initialSqrtPriceX96 = BigNumber.from(Math.pow(initialPrice, 0.5)).mul(
      X96
    );

    // Initialize the pool with the sqrtPriceX96
    await unicornToken.initializePool(initialSqrtPriceX96);

    // Get the pool current sqrtPriceX96
    const returnedSqrtPriceX96 = (await uniswapPool.slot0()).sqrtPriceX96;

    // Convert to price from sqrtPriceX96 format
    const returnedPrice = String(
      Math.pow(returnedSqrtPriceX96.div(X96).toString(), 2)
    );

    expect(initialPrice).to.equal(returnedPrice);
  });

  it("Adds liquidity to Uniswap pool and gives position ownership to user", async function () {
    const decimalMultiplier = BigNumber.from("10").pow(BigNumber.from("18"));

    // Check the user's balance of WETH
    const userWethBalance = await weth.balanceOf(user.address);

    // Gives the UnicornToken contract approval to transfer the user's WETH
    await weth.approve(unicornToken.address, userWethBalance);

    const liquidityToAdd = BigNumber.from("10").mul(decimalMultiplier);

    const initialLiquidity = await uniswapPool.liquidity();

    // Adds liquidity to the Uniswap pool
    await unicornToken.mintLiquidity(-20, 20, liquidityToAdd);

    const finalLiquidity = (await uniswapPool.liquidity()).toString();

    const userLiquidity = (
      await unicornToken.getPosition(user.address, -20, 20)
    )[0].toString();

    expect(initialLiquidity).to.equal("0");
    expect(finalLiquidity).to.equal(liquidityToAdd);
    expect(userLiquidity).to.equal(liquidityToAdd);
  });

  it("Reverts when an address other than the Uniswap pool attempts to call the callback function", async function () {
    // Attempts to call the callback function from the user account
    await expect(
      unicornToken.uniswapV3MintCallback(1000, 1000, user.address)
    ).to.be.revertedWith("Can only be called by the Uniswap pool");
  });
});
