import "./App.css";
import React, { useState } from 'react';
import Header from "./components/Header";
import Swap from "./components/Swap";
import Footer from "./components/Footer";
import { useConnect, useAccount } from "wagmi";
import { InjectedConnector } from 'wagmi/connectors/injected';

function App(props) {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  });
  const [resetBalances, setResetBalances] = useState(false);
  
  return (
    <div className="App">
      <Header connect={connect} isConnected={isConnected} address={address} setResetBalances={setResetBalances} />
      <div className="mainWindow">
        <Swap isConnected={isConnected} address={address} resetBalances={resetBalances} setResetBalances={setResetBalances} networkConfig={props.networkConfig} useTestnet={props.useTestnet} />
      </div>
      <Footer />
    </div>
  );
}

export default App;