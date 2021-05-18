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
    await unicornToken.createPool(500);

    const poolAddress = await unicornToken.poolAddress();

    uniswapPool = await ethers.getContractAt("UniswapV3Pool", poolAddress);

    const poolToken0Address = await uniswapPool.token0();

    const poolToken1Address = await uniswapPool.token1();

    expect(poolToken0Address).to.equal(unicornToken.address);

    expect(poolToken1Address).to.equal(weth.address);
  });

  it("Initializes Uniswap pool", async function () {
    const initialSqrtPriceX96 = BigNumber.from("2").pow(BigNumber.from("96"));

    await unicornToken.initializePool(initialSqrtPriceX96);

    const slot0 = await uniswapPool.slot0();

    const sqrtPriceX96 = slot0.sqrtPriceX96;

    const X96 = BigNumber.from("2").pow(BigNumber.from("96"));

    const price = sqrtPriceX96.div(X96).toString();

    expect(price).to.equal("1");
  });

  it("Adds liquidity to Uniswap pool and gives position ownership to user", async function () {
    const userWethBalance = await weth.balanceOf(user.address);

    await weth.approve(unicornToken.address, userWethBalance);

    const liquidityToAdd = BigNumber.from("10").pow(BigNumber.from("18"));

    await unicornToken.mintLiquidity(-20, 20, liquidityToAdd);

    const userLiquidity = (
      await unicornToken.getPosition(user.address, -20, 20)
    )[0];

    expect(liquidityToAdd).to.equal(userLiquidity);
  });
});
