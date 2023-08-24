import { AppConfig } from '@0xsquid/widget/widget/core/types/config'

import { SquidCallType } from '@0xsquid/sdk'
import { SquidStakingWidget } from '@0xsquid/staking-widget'
import { StakeConfig } from '@0xsquid/staking-widget/widget/core/types/config'
import { ethers } from 'ethers'
import erc20Abi from '../abi/erc20Abi'
import styles from '../styles/Home.module.css'
import meTokenAbi from '../abi/meTokenAbi'

export default function Home() {
  // Define the staking contract config
  const lineaId = 59144
 
  const meUsdcAddress = '0x333D8b480BDB25eA7Be4Dd87EEB359988CE1b30D' //we use mint function to supply liquidity to the pool
  const usdcAddress = '0x176211869cA2b568f2A7D4EE941E073a821EE1ff'

  const meTokenInterface = new ethers.utils.Interface(meTokenAbi)
  const erc20Interface = new ethers.utils.Interface(erc20Abi)

  const stakeConfig: StakeConfig = {
    // This method will be used to compute the exchange rate between the staked token and the token to stake
    // Basically a multiplier from 0 to x
    // Then if the amount that the route gets is 100, and the exchange rate is 0.5, we'll show 50 as the amount to be received for stakedToken
    // If nothing is specified, the exchange rate will be 1
    stakedTokenExchangeRateGetter: async () => {
      await new Promise((res) => setTimeout(res, 5000))
      return 1
    },

    // This link will be used to redirect the user to the unstake page, because it's not possible yet with the widget
    unstakeLink: 'https://mendi.finance',

    // Here are the calls that will be called by Squid MultiCall contract after the cross chain swap is done
    customContractCalls: [
      {
        callType: SquidCallType.FULL_TOKEN_BALANCE, // Full token balance means that the MultiCall will stake all token balance it received from the swap
        target: usdcAddress, // Contract address
        value: '0',

        // CallData is a method instead of a static value because it could depend on the route
        callData: () => {
          return erc20Interface.encodeFunctionData('approve', [
            meUsdcAddress,
            '0',
          ])
        },
        payload: {
          tokenAddress: usdcAddress,
          inputPos: 1,
        },
        estimatedGas: '50000',
      },
      {
        callType: SquidCallType.FULL_TOKEN_BALANCE,
        target: meUsdcAddress,
        value: '0',

        // CallData is a method instead of a static value because it could depend on the route
        // Here we can see that we use the user address as a parameter (destinationAddress)
        // It's needed as a callback because you can't know upfront what the user address will be
        // route object also offers the possibility to get other parameters like swapRoute:
        // - fromChainId?: number | string;
        // - toChainId?: number | string;
        // - fromTokenAddress?: string;
        // - toTokenAddress?: string;
        callData: () => {
          return meTokenInterface.encodeFunctionData('mint', ['0'])
        },
        payload: {
          tokenAddress: usdcAddress,
          inputPos: 0,
        },
        estimatedGas: '250000',
      },
    ],

    // This will be the token that the user will receive after the swap + staking
    // The coingeckoId is used to fetch the price of the token (USD price)
    stakedToken: {
      chainId: lineaId,
      address: meUsdcAddress,
      name: 'meUSDC',
      symbol: 'meUSDC',
      decimals: 8,
      logoURI:
        'https://assets.coingecko.com/coins/images/6319/thumb/USD_Coin_icon.png?1547042389',
      coingeckoId: 'usd-coin',
    },

    // Won't be seen by the user, but is needed for the config
    // This is the token that will be swapped TO
    tokenToStake: {
      chainId: lineaId,
      address: usdcAddress,
    },
  }

  const config = {
    companyName: 'Test Widget',
    integratorId: 'example-swap-widget',
    slippage: 3,
    instantExec: true,
    infiniteApproval: false,
    apiUrl: 'https://api.0xsquid.com',
    stakeConfig,
  } as AppConfig

  return (
    <div className={styles.container}>
      <SquidStakingWidget config={config} />
    </div>
  )
}
