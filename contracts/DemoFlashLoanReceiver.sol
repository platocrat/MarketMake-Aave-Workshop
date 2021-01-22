// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

interface IFlashLoanReceiver {
    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        address initiator
    ) external returns (bool);
}

interface IArbitrageStrategy {
    function arbitrage() external payable;
}

interface IWETH {
    function deposit() external payable;

    function withdraw(uint256) external;

    function approve(address guy, uint256 wad) external returns (bool);

    function transferFrom(
        address src,
        address dst,
        uint256 wad
    ) external returns (bool);
}

contract DemoFlashLoanReceiver is IFlashLoanReceiver {
    address constant LENDING_POOL = 0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9;
    IWETH constant WETH = IWETH(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
    IArbitrageStrategy constant STRATEGY =
        IArbitrageStrategy(0x8F1034CBE5827b381067fCEfA727C069c26270c4);

    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        address initiator
    ) external override returns (bool) {
        for (uint256 i = 0; i < assets.length; i++) {
            require(amounts[i] < 0.01 ether, "Invalid amount");
        }

        require(assets[0] == address(WETH), "Invalid asset");
        require(
            assets[1] == address(0x6B175474E89094C44Da98b954EedeAC495271d0F),
            "Invalid asset"
        );

        //insert the code to invoke FakeArbitrageStrategy here
        STRATEGY.arbitrage{value: amounts[0]}();
        STRATEGY.arbitrage{value: amounts[1]}();
        // `120e9` == 120 gwei
        // STRATEGY.arbitrage{value: 0.015 ether, gas: 120e9}();

        return true;
    }
}
