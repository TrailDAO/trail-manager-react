import React, { useState } from 'react';
import './App.css';
import { ethers } from "ethers"

declare var window: any

function App() {
  const [isConnected, setIsConnected] = useState(false)

  const connectWallet = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    await provider.send("eth_requestAccounts", []);
    setIsConnected(true)
  }

  return (
    <div className="App">
      <header className="App-header">
        {isConnected ? <div></div> : (
            <button className="Connect-button" type="button" onClick={() => connectWallet()}>Connect</button>
          ) 
        }
      </header>
    </div>
  );
}

export default App;
