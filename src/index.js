import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import App from "./App"
import { WagmiConfig, createConfig } from 'wagmi'
import { configureChains } from '@wagmi/core'
import { bsc, bscTestnet } from '@wagmi/core/chains'
import {publicProvider} from "wagmi/providers/public"
import tokenData from './data.json'

const USE_TESTNET = false;

const networkKey = USE_TESTNET ? "testnet" : "mainnet";
const networkConfig = tokenData[networkKey];
const chainsToUse = USE_TESTNET ? [bscTestnet] : [bsc];

const {
  publicClient,
  webSocketPublicClient
} = configureChains(
  chainsToUse,
  [publicProvider()],
)

const config = createConfig({
  autoConnect: true,
  publicClient,
  webSocketPublicClient
})

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <WagmiConfig config={config}>
      <App networkConfig={networkConfig} useTestnet={USE_TESTNET} />
    </WagmiConfig>
  </React.StrictMode>
);
