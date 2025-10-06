import { useState } from 'react'
import { ethers } from 'ethers'
import { Search, Wallet, ExternalLink, CircleAlert as AlertCircle, CircleCheck as CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { TransactionModal } from '@/components/ui/modal'
import { RegisteredDomains, clearDomainCache } from '@/components/registered-domains'
import { useWeb3 } from '@/components/web3-provider'
import { isValidDomain, NEX_REGISTRAR_ABI } from '@/lib/web3'
import { getContractAddresses } from '@/config/contracts'

export function NNSInterface() {
  const { signer, account, isConnected, isCorrectNetwork, connect, switchNetwork, chainId } = useWeb3()
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<{
    name: string
    available: boolean
    price?: string
    expires?: Date
  } | null>(null)
  const [isRegistering, setIsRegistering] = useState(false)
  const [transactionModal, setTransactionModal] = useState<{
    isOpen: boolean
    status: 'pending' | 'success' | 'error'
    hash?: string
    message?: string
  }>({
    isOpen: false,
    status: 'pending'
  })
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleSearch = async () => {
    if (!searchTerm || !isValidDomain(searchTerm)) {
      alert('Please enter a valid domain name (3+ characters, alphanumeric and hyphens only)')
      return
    }

    if (!signer || !chainId) {
      alert('Please connect your wallet first')
      return
    }

    setIsSearching(true)
    try {
      // Debug: Log network information
      console.log('🔍 Debug Info:')
      console.log('Chain ID:', chainId)
      console.log('Signer address:', await signer.getAddress())
      
      const contractAddresses = getContractAddresses(chainId)
      console.log('Contract addresses:', contractAddresses)
      console.log('NexRegistrar address:', contractAddresses.NexRegistrar)
      
      // Check if we're on the correct network
      if (chainId !== 3940) {
        alert(`❌ Wrong network! Please switch to Nexus Testnet (Chain ID: 3940). Current: ${chainId}`)
        return
      }
      
      const registrarContract = new ethers.Contract(
        contractAddresses.NexRegistrar,
        NEX_REGISTRAR_ABI,
        signer
      )

      // Debug: Check contract code
      const provider = signer.provider
      const code = await provider.getCode(contractAddresses.NexRegistrar)
      console.log('Contract code length:', code.length)
      
      if (code === '0x') {
        alert('❌ No contract found at address! Please check network connection.')
        return
      }

      // Check if domain is available using the available() method
      console.log('Calling available() for domain:', searchTerm)
      const isAvailable = await registrarContract.available(searchTerm)

      // Get registration fee
      const registrationFee = await registrarContract.registrationFee()
      const priceInEth = ethers.formatEther(registrationFee)

      // Get domain info if not available
      let expirationDate;
      if (!isAvailable) {
        const domainInfo = await registrarContract.getDomain(searchTerm)
        expirationDate = new Date(Number(domainInfo.expires) * 1000)
      }

      setSearchResult({
        name: searchTerm,
        available: isAvailable,
        price: isAvailable ? priceInEth : undefined,
        expires: expirationDate
      })
    } catch (error) {
      console.error('Search failed:', error)
      alert('Search failed. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleRegister = async () => {
    if (!searchResult || !searchResult.available || !signer || !chainId) return

    setIsRegistering(true)
    try {
      const contractAddresses = getContractAddresses(chainId)
      const registrarContract = new ethers.Contract(
        contractAddresses.NexRegistrar,
        NEX_REGISTRAR_ABI,
        signer
      )

      // Check account is connected
      if (!account) {
        throw new Error('Account not connected')
      }

      // Verify the signer address matches the connected account
      const signerAddress = await signer.getAddress()
      console.log('Connected account:', account)
      console.log('Signer address:', signerAddress)
      
      if (signerAddress.toLowerCase() !== account.toLowerCase()) {
        throw new Error(`Account mismatch! Connected: ${account}, Signer: ${signerAddress}. Please refresh and reconnect your wallet.`)
      }

      // Get registration fee
      console.log('Getting registration fee...')
      const registrationFee = await registrarContract.registrationFee()
      console.log('Registration fee:', ethers.formatEther(registrationFee), 'NEX')

      // Check wallet balance for the actual signer address
      const provider = signer.provider
      const balance = await provider.getBalance(signerAddress)
      console.log('Wallet balance:', ethers.formatEther(balance), 'NEX')

      if (balance < registrationFee) {
        throw new Error(`Insufficient balance. Required: ${ethers.formatEther(registrationFee)} NEX, Available: ${ethers.formatEther(balance)} NEX`)
      }
      
      // Register domain for 1 year (31536000 seconds)
      const duration = 31536000
      
      // Estimate gas first
      console.log('Estimating gas...')
      console.log('Parameters for gas estimation:')
      console.log('  - name:', searchResult.name)
      console.log('  - account:', signerAddress)
      console.log('  - duration:', duration)
      console.log('  - registrationFee:', registrationFee.toString())
      console.log('  - contract address:', contractAddresses.NexRegistrar)
      
      // Using a fixed gas limit because estimation is failing with RPC errors
      // Gas estimation shows ~385k needed, so using 500k for extra safety
      const gasLimit = 500000n;
      console.log('Using fixed gas limit:', gasLimit.toString());

      // Submit transaction with explicit gas limit
      console.log('Submitting transaction...')
      const tx = await registrarContract.register(
        searchResult.name,
        signerAddress, // Use verified signer address
        duration,
        { 
          value: registrationFee,
          gasLimit: gasLimit
        }
      )

      console.log('Transaction submitted:', tx.hash)
      
      // Show pending modal
      setTransactionModal({
        isOpen: true,
        status: 'pending',
        hash: tx.hash,
        message: 'Transaction submitted! Waiting for confirmation...'
      })
      
      // Wait for transaction confirmation
      const receipt = await tx.wait()
      
      if (receipt.status === 1) {
        // Show success modal
        setTransactionModal({
          isOpen: true,
          status: 'success',
          hash: tx.hash,
          message: `Successfully registered ${searchResult.name}.nex!`
        })
        setSearchResult(null)
        setSearchTerm('')
        // Clear domain cache to force fresh fetch
        if (account && chainId) {
          clearDomainCache(account, chainId)
        }
        // Trigger refresh of registered domains
        setRefreshTrigger(prev => prev + 1)
      } else {
        throw new Error('Transaction failed during execution')
      }
      
    } catch (error: any) {
      console.error('Registration failed:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        reason: error.reason,
        data: error.data,
        stack: error.stack
      })
      
      // Handle specific error types with more detailed messages
      let errorMessage = ''
      if (error.message?.includes('Account mismatch')) {
        errorMessage = error.message + ' Try disconnecting and reconnecting your wallet, or switch to the correct account in MetaMask.'
      } else if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        errorMessage = 'Transaction was rejected by user'
      } else if (error.code === 'INSUFFICIENT_FUNDS' || error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for registration and gas fees. Make sure you have enough NEX in the account currently selected in MetaMask.'
      } else if (error.code === -32603 || error.message?.includes('Internal JSON-RPC error')) {
        errorMessage = 'Internal JSON-RPC error occurred. This could be due to network connectivity issues, gas estimation problems, or contract execution failure.'
      } else if (error.code === -32602) {
        errorMessage = 'Invalid parameters sent to the network'
      } else if (error.code === -32000) {
        errorMessage = 'Transaction failed during execution'
      } else if (error.message?.includes('Gas estimation failed')) {
        errorMessage = 'Gas estimation failed. The transaction may fail due to insufficient gas limit, contract execution issues, or network problems.'
      } else if (error.message?.includes('execution reverted')) {
        const reason = error.reason || error.data || 'Unknown reason'
        errorMessage = 'Transaction reverted: ' + reason
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error: Please check your connection to Nexus Testnet'
      } else {
        errorMessage = 'Registration failed: ' + error.message
      }

      // Show error modal
      setTransactionModal({
        isOpen: true,
        status: 'error',
        message: errorMessage
      })
    } finally {
      setIsRegistering(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center">
              <Wallet className="mr-2 h-6 w-6" />
              Connect Wallet
            </CardTitle>
            <CardDescription className="space-y-2">
              <span className="block">Connect your wallet to start using Nexus Name Service</span>
              <span className="flex items-center justify-center text-sm text-muted-foreground">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2 inline-block"></span>
                Network: Not Connected
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={connect} className="w-full" size="lg">
              <Wallet className="mr-2 h-4 w-4" />
              Connect MetaMask
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isCorrectNetwork) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center">
              <AlertCircle className="mr-2 h-6 w-6 text-yellow-500" />
              Wrong Network
            </CardTitle>
            <CardDescription className="space-y-3">
              <div>Please switch to Nexus Testnet to use NNS</div>
              <div className="flex items-center justify-center text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                Current Network: {chainId ? `Chain ID ${chainId}` : 'Unknown'}
              </div>
              <div className="flex items-center justify-center text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Required: Nexus Testnet (Chain ID 3940)
              </div>
              <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">
                <div className="font-medium mb-1">Network Details:</div>
                <div>• RPC URL: https://testnet3.rpc.nexus.xyz</div>
                <div>• Chain ID: 3940</div>
                <div>• Currency: NEX</div>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={switchNetwork} className="w-full" size="lg">
              Switch to Nexus Testnet
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="bg-background">
      {/* Top navbar dipindahkan ke App.tsx (fixed-top) untuk menghindari duplikasi */}

      <div className="container mx-auto px-4 py-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Register Your .nex Domain</h2>
          <p className="text-muted-foreground text-lg">
            Simplify your Nexus address with a memorable domain name
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Search Domains</CardTitle>
              <CardDescription>
                Enter a domain name to check availability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    placeholder="Enter domain name"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    .nex
                  </span>
                </div>
                <Button 
                  onClick={handleSearch} 
                  disabled={isSearching || !searchTerm}
                >
                  {isSearching ? (
                    <Spinner size="sm" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {searchResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {searchResult.available ? (
                    <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
                  )}
                  {searchResult.name}.nex
                </CardTitle>
                <CardDescription>
                  {searchResult.available ? 'Available for registration' : 'Already registered'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {searchResult.available ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Registration Price:</span>
                      <span className="font-semibold">{searchResult.price} NEX</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Duration:</span>
                      <span>1 year</span>
                    </div>
                    <Button 
                      onClick={handleRegister} 
                      disabled={isRegistering}
                      className="w-full"
                      size="lg"
                    >
                      {isRegistering ? 'Registering...' : 'Register Domain'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Expires:</span>
                      <span>{searchResult.expires?.toLocaleDateString()}</span>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        if (chainId) {
                          const contractAddresses = getContractAddresses(chainId)
                          window.open(`https://testnet3.explorer.nexus.xyz/address/${contractAddresses.NexRegistrar}`, '_blank')
                        }
                      }}
                    >
                      View on Explorer
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Registered Domains Dashboard */}
          <div className="mt-4">
            <RegisteredDomains refreshTrigger={refreshTrigger} />
          </div>
        </div>

        {/* Transaction Modal */}
        <TransactionModal
          isOpen={transactionModal.isOpen}
          onClose={() => setTransactionModal({ ...transactionModal, isOpen: false })}
          status={transactionModal.status}
          hash={transactionModal.hash}
          message={transactionModal.message}
          explorerUrl={transactionModal.hash && chainId ? 
            `https://testnet3.explorer.nexus.xyz` : 
            undefined
          }
        />
      </div>
    </div>
  )
}