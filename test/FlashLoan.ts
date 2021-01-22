/**
 * @TODO -----------------------------------------------------------------------
 * "Always code [CONCISELY, CLEARLY, and READABLY] as if the guy who ends up 
 * maintaining your code will be a violent psychopath who knows where you 
 * live." - John Woods
 *-----------------------------------------------------------------------------
 */
import { expect } from "chai"
import hre from 'hardhat'
import { Signer } from 'ethers'
import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { JsonRpcSigner } from '@ethersproject/providers'
import { WETH9 } from '../typechain'

describe('DemoFlashLoanReceiver', () => {
  let myAddress: string = '0x97fC2e88D19523F0011Ed3bB4AC592802DC435Ab',
    attacker: string,
    weth: WETH9,
    attackerSigner: JsonRpcSigner,
    fakeArbitrageStrategy: Contract,
    demoFlashLoanReceiver: any

  const wethAddress: string = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'

  before(async () => {
    // Initialize `FakeArbitrageStrategy` contract
    [attacker] = await hre.ethers.provider.listAccounts()

    const fakeArbitrageStrategyAddress: string = hre
      .ethers.utils.getContractAddress({
        from: attacker,
        nonce: (await hre.ethers.provider.getTransactionCount(attacker)) + 1
      })

    attackerSigner = await hre.ethers.provider.getSigner(attacker)

    fakeArbitrageStrategy = await hre.ethers.getContractAt(
      'FakeArbitrageStrategy',
      '0x8F1034CBE5827b381067fCEfA727C069c26270c4'
    )

    weth = await hre.ethers.getContractAt('IERC20', wethAddress) as WETH9

    // Used to call `arbitrage()` function from `FakeArbitrageStrategy` contract
    // through the `IArbitrageStrategy` interface
    const DemoFlashLoanReceiver = await hre.ethers.getContractFactory(
      'DemoFlashLoanReceiver',
      attackerSigner
    )

    demoFlashLoanReceiver = await DemoFlashLoanReceiver.deploy()
    await demoFlashLoanReceiver.deployed()
  })

  describe('Extract funds from FakeArbitrageStrategy to my wallet address', async () => {
    let attackerBalanceBefore: BigNumber,
      contractBalanceBefore: BigNumber,
      demoFlashLoanReceiverSigner: Signer

    before(async () => {
      demoFlashLoanReceiverSigner = await hre
        .ethers.provider.getSigner(demoFlashLoanReceiver.address)

      attackerBalanceBefore = await demoFlashLoanReceiverSigner.getBalance()
      contractBalanceBefore = await hre.
        ethers.provider.getBalance(fakeArbitrageStrategy.address)

      console.log('Attacker balance before: ',
        hre.ethers.utils.formatUnits(attackerBalanceBefore.toString(), 'ether')
      )
      console.log('Contract balance before: ',
        hre.ethers.utils.formatUnits(contractBalanceBefore.toString(), 'ether')
      )
    })

    it('should withdraw funds', async () => {
      // 1. Whitelist my wallet by calling `whitelistTrader()` from 
      // `DemoFlashLoanReceiver.sol`
      await fakeArbitrageStrategy.whitelistTrader(demoFlashLoanReceiver.address)

      // 2. Call `executeOperation()` from `DemoFlashLoanReceiver.sol`
      let arbAmounts = new Array(2).fill(0),
        assetAddresses = new Array(2).fill(0)

      arbAmounts[0] = hre.ethers.utils.parseEther('0.005')
      arbAmounts[1] = hre.ethers.utils.parseEther('0.001')

      assetAddresses[0] = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' // WETH
      assetAddresses[1] = '0x6B175474E89094C44Da98b954EedeAC495271d0F' // DAI

      /** 
       * @TODO --------------------------  TODO  -------------------------------
       * The code block below throws the following error:
       * ```
       * Error: Transaction reverted without a reason
       * ```
       * -----------------------------------------------------------------------
       */
      // 3. Send ETH to `DemoFlashLoanReceiver` contract`
      await weth.transfer(
        demoFlashLoanReceiver.address,
        hre.ethers.utils.parseUnits('1000000', 'wei')
      )


      /** 
       * @TODO --------------------------  TODO  -------------------------------
       * This code block relies on the above to work!
       * -----------------------------------------------------------------------
       */
      // // 4. Execute the flash loan arbitrage strategy
      // await demoFlashLoanReceiver.executeOperation(
      //   assetAddresses,
      //   arbAmounts,
      //   demoFlashLoanReceiver.address,
      // )

      // 5. Check balance of attacker AND contract
      const contractBalanceAfter = await hre.
        ethers.provider.getBalance(fakeArbitrageStrategy.address)

      const contractDiff: BigNumber = contractBalanceBefore.sub(contractBalanceAfter)

      console.log('Contract balance difference after calling `arbitrage()`: ',
        hre.ethers.utils.formatUnits('-' + contractDiff.toString(), 'ether')
      )

      const attackerBalanceAfter: BigNumber = await demoFlashLoanReceiverSigner.getBalance()
      const attackerDiff: BigNumber = attackerBalanceBefore.sub(attackerBalanceAfter)

      console.log('Attacker balance difference after calling `arbitrage()`: ',
        hre.ethers.utils.formatUnits('-' + attackerDiff.toString(), 'ether')
      )

      /** @TODO THIS SHOULD RESOLVE TO ~4500000000000 */
      expect(contractDiff.toString()).to.eq('0.005')
    })
  })
})