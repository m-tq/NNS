import { useState } from 'react'
import { ethers } from 'ethers'
import { Search, Wallet, ExternalLink, CircleAlert as AlertCircle, CircleCheck as CheckCircle, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useWeb3 } from '@/components/web3-provider'
import { isValidDomain, NEX_REGISTRAR_ABI } from '@/lib/web3'
import { getContractAddresses } from '@/config/contracts'

export function NNSInterface() {
  const { signer, account, isConnected, isCorrectNetwork, connect, disconnect, switchNetwork, chainId } = useWeb3()
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<{
    name: string
    available: boolean
    price?: string
    expires?: Date
  } | null>(null)
  const [isRegistering, setIsRegistering] = useState(false)

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
      const contractAddresses = getContractAddresses(chainId)
      const registrarContract = new ethers.Contract(
        contractAddresses.NexRegistrar,
        NEX_REGISTRAR_ABI,
        signer
      )

      // Check if domain is available using the available() method
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

      // Get registration fee
      console.log('Getting registration fee...')
      const registrationFee = await registrarContract.registrationFee()
      console.log('Registration fee:', ethers.formatEther(registrationFee), 'NEX')

      // Check wallet balance
      const provider = signer.provider
      const balance = await provider.getBalance(account)
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
      console.log('  - account:', account)
      console.log('  - duration:', duration)
      console.log('  - registrationFee:', registrationFee.toString())
      console.log('  - contract address:', contractAddresses.NexRegistrar)
      
      // Using a fixed gas limit because estimation is failing with RPC errors
      const gasLimit = 350000n;
      console.log('Using fixed gas limit:', gasLimit.toString());

      // Submit transaction with explicit gas limit
      console.log('Submitting transaction...')
      const tx = await registrarContract.register(
        searchResult.name,
        account,
        duration,
        { 
          value: registrationFee,
          gasLimit: gasLimit
        }
      )

      console.log('Transaction submitted:', tx.hash)
      alert(`Transaction submitted! Hash: ${tx.hash}\n\nWaiting for confirmation...`)
      
      // Wait for transaction confirmation
      const receipt = await tx.wait()
      
      if (receipt.status === 1) {
        alert(`✅ Successfully registered ${searchResult.name}.nex!\n\nTransaction confirmed in block ${receipt.blockNumber}`)
        setSearchResult(null)
        setSearchTerm('')
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
      if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
        alert('❌ Transaction was rejected by user')
      } else if (error.code === 'INSUFFICIENT_FUNDS' || error.message?.includes('insufficient funds')) {
        alert('❌ Insufficient funds for registration and gas fees')
      } else if (error.code === -32603 || error.message?.includes('Internal JSON-RPC error')) {
        alert('❌ Internal JSON-RPC error occurred.\n\nThis could be due to:\n• Network connectivity issues\n• Gas estimation problems\n• Contract execution failure\n\nPlease check the console for details and try again.')
      } else if (error.code === -32602) {
        alert('❌ Invalid parameters sent to the network')
      } else if (error.code === -32000) {
        alert('❌ Transaction failed during execution')
      } else if (error.message?.includes('Gas estimation failed')) {
        alert('❌ Gas estimation failed. The transaction may fail due to:\n• Insufficient gas limit\n• Contract execution issues\n• Network problems')
      } else if (error.message?.includes('execution reverted')) {
        const reason = error.reason || error.data || 'Unknown reason'
        alert('❌ Transaction reverted: ' + reason)
      } else if (error.message?.includes('network')) {
        alert('❌ Network error: Please check your connection to Nexus Testnet')
      } else {
        alert('❌ Registration failed: ' + error.message + '\n\nCheck console for detailed error information.')
      }
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
            <CardDescription className="space-y-2">
              <div>Please switch to Nexus Testnet to use NNS</div>
              <div className="flex items-center justify-center text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                Current Network: {chainId ? `Chain ID ${chainId}` : 'Unknown'}
              </div>
              <div className="flex items-center justify-center text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Required: Nexus Testnet (Chain ID 3940)
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
    <div className="min-h-screen bg-background">
      {/* Header with wallet info and disconnect button */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold">Nexus Name Service</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-muted-foreground">Nexus Testnet</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Connected: </span>
                <span className="font-mono">{account?.slice(0, 6)}...{account?.slice(-4)}</span>
              </div>
              <Button variant="outline" size="sm" onClick={disconnect}>
                <LogOut className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Register Your .nex Domain</h2>
          <p className="text-muted-foreground text-lg">
            Simplify your Nexus address with a memorable domain name
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="mb-8">
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
                  <Search className="h-4 w-4" />
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
        </div>
      </div>
    </div>
  )
}