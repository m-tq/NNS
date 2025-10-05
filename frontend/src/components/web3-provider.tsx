import React, { createContext, useContext, useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { NEXUS_TESTNET, switchToNexusNetwork } from '@/lib/web3'

interface Web3ContextType {
  provider: ethers.BrowserProvider | null
  signer: ethers.JsonRpcSigner | null
  account: string | null
  chainId: number | null
  isConnected: boolean
  isCorrectNetwork: boolean
  connect: () => Promise<void>
  disconnect: () => void
  switchNetwork: () => Promise<void>
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined)

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null)
  const [account, setAccount] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [hasUserDisconnected, setHasUserDisconnected] = useState(false)

  const isCorrectNetwork = chainId === NEXUS_TESTNET.chainId

  const connect = async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed')
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await provider.send('eth_requestAccounts', [])
      const signer = await provider.getSigner()
      const network = await provider.getNetwork()

      setProvider(provider)
      setSigner(signer)
      setAccount(accounts[0])
      setChainId(Number(network.chainId))
      setIsConnected(true)
      setHasUserDisconnected(false)
      
      // Remove disconnect flag from localStorage
      localStorage.removeItem('nns_user_disconnected')

      // Switch to Nexus network if not already connected
      if (Number(network.chainId) !== NEXUS_TESTNET.chainId) {
        await switchToNexusNetwork()
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      throw error
    }
  }

  const disconnect = () => {
    console.log('Disconnecting wallet...')
    
    setProvider(null)
    setSigner(null)
    setAccount(null)
    setChainId(null)
    setIsConnected(false)
    setHasUserDisconnected(true)
    
    // Set disconnect flag in localStorage to prevent auto-reconnect
    localStorage.setItem('nns_user_disconnected', 'true')
    
    console.log('Wallet disconnected, localStorage flag set')
  }

  const switchNetwork = async () => {
    try {
      await switchToNexusNetwork()
    } catch (error) {
      console.error('Failed to switch network:', error)
      throw error
    }
  }

  useEffect(() => {
    // Initialize disconnect state from localStorage
    const userDisconnected = localStorage.getItem('nns_user_disconnected') === 'true'
    console.log('Initializing Web3Provider, userDisconnected:', userDisconnected)
    setHasUserDisconnected(userDisconnected)

    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        const userDisconnected = localStorage.getItem('nns_user_disconnected') === 'true'
        console.log('Accounts changed:', accounts, 'userDisconnected:', userDisconnected)
        
        if (accounts.length === 0) {
          disconnect()
        } else if (!userDisconnected) {
          // Only update account if user hasn't manually disconnected
          setAccount(accounts[0])
        }
      }

      const handleChainChanged = (chainId: string) => {
        setChainId(parseInt(chainId, 16))
      }

      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)

      // Check if already connected, but only auto-reconnect if user hasn't manually disconnected
      window.ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        console.log('Checking existing accounts:', accounts, 'userDisconnected:', userDisconnected)
        if (accounts.length > 0 && !userDisconnected) {
          console.log('Auto-reconnecting...')
          connect().catch(console.error)
        } else {
          console.log('Not auto-reconnecting')
        }
      })

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum?.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [])

  const value: Web3ContextType = {
    provider,
    signer,
    account,
    chainId,
    isConnected,
    isCorrectNetwork,
    connect,
    disconnect,
    switchNetwork
  }

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>
}

export function useWeb3() {
  const context = useContext(Web3Context)
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider')
  }
  return context
}