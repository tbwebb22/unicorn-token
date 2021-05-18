// SPDX-License-Identifier: MIT
pragma solidity =0.7.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockWeth is ERC20 {
    constructor() ERC20("Wrapped Eth", "WETH") {
        _mint(msg.sender, 100 * 10**decimals());
    }
}