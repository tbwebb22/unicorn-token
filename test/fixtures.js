const { deployments } = require("hardhat");

const fixture = deployments.createFixture(async ({ ethers }) => {
  const [user] = await ethers.getSigners();
  const UniswapFactory = await ethers.getContractFactory("UniswapV3Factory");
  const uniswapFactory = await UniswapFactory.deploy();

  const Weth = await ethers.getContractFactory("MockWeth");
  const weth = await Weth.deploy();

  const UnicornToken = await ethers.getContractFactory("UnicornToken");
  const unicornToken = await UnicornToken.deploy(
    uniswapFactory.address,
    weth.address
  );
  return {
    user,
    weth,
    unicornToken,
  };
});

module.exports = { fixture };
