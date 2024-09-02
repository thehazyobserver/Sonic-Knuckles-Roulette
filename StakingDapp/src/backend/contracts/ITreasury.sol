// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

interface ITreasury {
    function deposit(uint256 amount) external;
    function withdrawReward(uint256 amount) external;
    function earned(address _token) external view returns (uint256);
}
