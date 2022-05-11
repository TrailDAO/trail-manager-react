import React, { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import axios from 'axios'
import CompiledCircuit from './CompiledCircuit'

declare var window: any

function App() {
  const [isConnected, setIsConnected] = useState(false)
  const [authToken, setAuthToken] = useState<string>()
  const [compiledCircuits, setCompiledCircuits] = useState<CompiledCircuit[]>([])

  const connectWallet = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    await provider.send('eth_requestAccounts', [])
    setIsConnected(true)
  }

  const login = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const accounts = await provider.send('eth_requestAccounts', [])

    let res = await axios.get('http://localhost:3000/web3-login-message')
    const msg = res.data
    
    const signer = provider.getSigner()
    const sig = await signer.signMessage(msg)
    
    const address = accounts[0]

    res = await axios.post('http://localhost:3000/web3-login-verify', {
        address,
        msg,
        sig,
    })

    setAuthToken(res.data)
  }

  useEffect(() => {
    const getCompiledCircuits = async () => {
      if (authToken) {
        const compiledCircuits = await axios.get('http://localhost:3000/compile', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        })
        setCompiledCircuits(compiledCircuits.data)
      }
    }
    getCompiledCircuits()
  }, [authToken])

  const deploy = async (id: string) => {
    // get contract bytecode and construct transaction to deploy
    // create deployment for compile

    const bytecode = await axios.get(`http://localhost:3000/compile/${id}/bytecode`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })

    const abi = await axios.get(`http://localhost:3000/compile/${id}/abi`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })
    
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()


    const factory = new ethers.ContractFactory(abi.data, bytecode.data, signer)
    const contract = await factory.deploy()

    // The address the Contract WILL have once mined
    // See: https://ropsten.etherscan.io/address/0x2bd9aaa2953f988153c8629926d22a6a5f69b14e
    console.log(contract.address)
    // "0x2bD9aAa2953F988153c8629926D22A6a5F69b14E"

    // The transaction that was sent to the network to deploy the Contract
    // See: https://ropsten.etherscan.io/tx/0x159b76843662a15bd67e482dcfbee55e8e44efad26c5a614245e12a00d4b1a51
    console.log(contract.deployTransaction.hash)
    // "0x159b76843662a15bd67e482dcfbee55e8e44efad26c5a614245e12a00d4b1a51"

    // The contract is NOT deployed yet; we must wait until it is mined
    await contract.deployed()

    // Hit api and add deployment information, set status to deployed
  }

  const showDeployButton = (id: string) => {
    return (
      <button 
        className="btn btn-primary" 
        type="button" 
        onClick={() => deploy(id)}>
          Deploy
      </button>
    )
  }

  const showCompiledCircuits = () => {
    // TODO: Turn compiled circuits into decently styled list
    return (
      <ul className="list-group">
        { 
          compiledCircuits.map(compiledCircuit => {
            console.log(compiledCircuit.status)
            return (
              <li className="list-group-item" style={{height: '150px'}} key={compiledCircuit.id}>
                <p>Location check-in at the corner of 51st St and Idaho St, Dallas Texas</p>
                <p>{compiledCircuit.status}</p>
                { compiledCircuit.status === 'Ready for Deployment' ? showDeployButton(compiledCircuit.id) : <></> }
                <p>If there is a deployment, number of check-ins</p>
                <p>If there is a deployment, number of tokens distributed</p>
              </li>
            )
          })
        }
      </ul>
    )
  }

  const showConnectButton = () => {
    return (
      <button 
        className="btn btn-primary" 
        type="button" 
        onClick={() => connectWallet()}>
          Connect
      </button>
    )
  }

  const showLoginButton = () => {
    return (
      <button
        className="btn btn-primary"
        type="button"
        onClick={() => login()}>
          Login
      </button>
    )
  }

  return (
    <div className="container-sm" style={{ marginTop: '10px' }}>
        { isConnected ? authToken ? showCompiledCircuits() : showLoginButton() : showConnectButton() }
    </div>
  )
}

export default App
