import { GenericContract } from 'eth-components/ant/generic-contract';
import { useContractReader, useBalance, useEthersAdaptorFromProviderOrSigners, useEventListener } from 'eth-hooks';
import { useEthersAppContext } from 'eth-hooks/context';
import { useDexEthPrice } from 'eth-hooks/dapps';
import { asEthersAdaptor } from 'eth-hooks/functions';
import { NextPage } from 'next';
import Head from 'next/head';
import { ReactElement } from 'react';

import { MainPageFooter, MainPageHeader, createTabsAndPages, TContractPageList } from '.';

import { useLoadAppContracts, useConnectAppContracts, useAppContracts } from '~common/components/context';
import { useCreateAntNotificationHolder } from '~common/components/hooks/useAntNotification';
import { useBurnerFallback } from '~common/components/hooks/useBurnerFallback';
import { useScaffoldAppProviders } from '~common/components/hooks/useScaffoldAppProviders';
import { networkDefinitions } from '~common/constants';
import { useScaffoldHooksExamples } from '~~/components/hooks/useScaffoldHooksExamples';
import { TAppConfig } from '~~/config/app.config';

/** ********************************
 * ⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️
 * See ./config/app.config.ts for configuration, such as TARGET_NETWORK
 * See ../common/src/config/appContracts.config.ts and ../common/src/config/externalContracts.config.ts to configure your contracts
 * See pageList variable below to configure your pages
 * See ../common/src/config/web3Modal.config.ts to configure the web3 modal
 * ⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️⛳️
 * ******************************** */

interface IMainPageProps {
  pageName: string;
  children?: ReactElement;
  config?: TAppConfig;
}

/**
 * The main component
 * @returns
 */
export const MainPage: NextPage<IMainPageProps> = (props) => {
  const notificationHolder = useCreateAntNotificationHolder();

  // passed in by nextjs getInitalProps
  const config: TAppConfig = props.config!;

  // -----------------------------
  // Providers, signers & wallets
  // -----------------------------
  // 🛰 providers
  // see useLoadProviders.ts for everything to do with loading the right providers
  const scaffoldAppProviders = useScaffoldAppProviders({
    targetNetworks: config.TARGET_NETWORK_INFO,
    connectToBurnerAutomatically: config.CONNECT_TO_BURNER_AUTOMATICALLY,
    localProvider: config.LOCAL_PROVIDER,
    mainnetProvider: config.MAINNET_PROVIDER,
    infuraId: config.INFURA_ID,
  });

  // 🦊 Get your web3 ethers context from current providers
  const ethersAppContext = useEthersAppContext();

  // if no user is found use a burner wallet on localhost as fallback if enabled
  useBurnerFallback(scaffoldAppProviders, config.BURNER_FALLBACK_ENABLED);

  // -----------------------------
  // Load Contracts
  // -----------------------------
  // 🛻 load contracts
  useLoadAppContracts();
  // 🏭 connect to contracts for mainnet network & signer
  const [mainnetAdaptor] = useEthersAdaptorFromProviderOrSigners(config.MAINNET_PROVIDER);
  useConnectAppContracts(mainnetAdaptor);
  // 🏭 connec to  contracts for current network & signer
  useConnectAppContracts(asEthersAdaptor(ethersAppContext));

  // -----------------------------
  // Hooks use and examples
  // -----------------------------
  // 🎉 Console logs & More hook examples:
  // 🚦 disable this hook to stop console logs
  // 🏹🏹🏹 go here to see how to use hooks!
  useScaffoldHooksExamples(scaffoldAppProviders);

  // -----------------------------
  // These are the contracts!
  // -----------------------------

  // init contracts
  const yourContract = useAppContracts('YourContract', ethersAppContext.chainId);
  const yourNFT = useAppContracts('YourNFT', ethersAppContext.chainId);
  const mainnetDai = useAppContracts('DAI', networkDefinitions.mainnet.chainId);

  // keep track of a variable from the contract in the local React state:
  const [purpose, update] = useContractReader(
    yourContract,
    yourContract?.purpose,
    [],
    yourContract?.filters.SetPurpose()
  );

  // 📟 Listen for broadcast events
  const [setPurposeEvents] = useEventListener(yourContract, 'SetPurpose', 0);

  // -----------------------------
  // .... 🎇 End of examples
  // -----------------------------
  // 💵 This hook will get the price of ETH from 🦄 Uniswap:
  const [ethPrice] = useDexEthPrice(
    scaffoldAppProviders.mainnetAdaptor?.provider,
    ethersAppContext.chainId !== 1 ? scaffoldAppProviders.currentTargetNetwork : undefined
  );

  // 💰 this hook will get your balance
  const [yourCurrentBalance] = useBalance(ethersAppContext.account);

  // -----------------------------
  // 📃 App Page List
  // -----------------------------
  // This is the list of tabs and their contents
  const pageList: TContractPageList = {
    mainPage: {
      name: 'YourContract',
      content: (
        <GenericContract
          contractName="YourContract"
          contract={yourContract}
          mainnetAdaptor={scaffoldAppProviders.mainnetAdaptor}
          blockExplorer={scaffoldAppProviders.currentTargetNetwork.blockExplorer}
        />
      ),
    },
    pages: [
      {
        name: 'YourNFT',
        content: (
          <GenericContract
            contractName="YourNFT"
            contract={yourNFT}
            mainnetAdaptor={scaffoldAppProviders.mainnetAdaptor}
            blockExplorer={scaffoldAppProviders.currentTargetNetwork.blockExplorer}></GenericContract>
        ),
      },
      {
        name: 'Mainnet-Dai',
        content: (
          <GenericContract
            contractName="Dai"
            contract={mainnetDai}
            mainnetAdaptor={scaffoldAppProviders.mainnetAdaptor}
            blockExplorer={scaffoldAppProviders.currentTargetNetwork.blockExplorer}
          />
        ),
      },
    ],
  };
  const { tabMenu, pages } = createTabsAndPages(pageList);
  const RouteNotFound = <h3 className="p-10 mt-10 text-xl">Route Not Found </h3>;

  // -----------------------------
  // 📃 Render the react components
  // -----------------------------

  return (
    <div className="App">
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <MainPageHeader scaffoldAppProviders={scaffoldAppProviders} price={ethPrice} />
      {tabMenu}
      {pages[props.pageName] ?? RouteNotFound}
      <MainPageFooter scaffoldAppProviders={scaffoldAppProviders} price={ethPrice} />
      <div style={{ position: 'absolute' }}>{notificationHolder}</div>
    </div>
  );
};
