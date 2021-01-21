// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

interface IFlashLoanReceiver {
    function executeOperation(
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
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
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        require(assets[0] == address(WETH), "Invalid asset");
        require(amounts[0] < 0.01 ether, "Invalid amount");

        //insert the code to invoke FakeArbitrageStrategy here
        STRATEGY.arbitrage{value: amounts[0]}();

        return true;
    }

    // function flashLoanCall() public {
    //     address receiverAddress = address(this);

    //     address[] memory assets = new address[](7);
    //     assets[0] = address(0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9); // Mainnet AAVE
    //     assets[1] = address(0x0D8775F648430679A709E98d2b0Cb6250d2887EF); // Mainnet BAT
    //     assets[2] = address(0x6B175474E89094C44Da98b954EedeAC495271d0F); // Mainnet DAI
    //     assets[3] = address(0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984); // Mainnet UNI
    //     assets[4] = address(0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e); // Mainnet YFI
    //     assets[5] = address(0x514910771AF9Ca656af840dff83E8264EcF986CA); // Mainnet LINK
    //     assets[6] = address(0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F); // Mainnet SNX

    //     uint256[] memory amounts = new uint256[](7);
    //     amounts[0] = 1 ether;
    //     amounts[1] = 1 ether;
    //     amounts[2] = 1 ether;
    //     amounts[3] = 1 ether;
    //     amounts[4] = 1 ether;
    //     amounts[5] = 1 ether;
    //     amounts[6] = 1 ether;

    //     // 0 = no debt, 1 = stable, 2 = variable
    //     uint256[] memory modes = new uint256[](7);
    //     modes[0] = 0;
    //     modes[1] = 0;
    //     modes[2] = 0;
    //     modes[3] = 0;
    //     modes[4] = 0;
    //     modes[5] = 0;
    //     modes[6] = 0;

    //     address onBehalfOf = address(this);
    //     bytes memory params = "";
    //     uint16 referralCode = 0;

    //     LENDING_POOL.flashloan(
    //         receiverAddress,
    //         assets,
    //         amounts,
    //         modes,
    //         onBehalfOf,
    //         params,
    //         referralCode
    //     );
    // }
}
