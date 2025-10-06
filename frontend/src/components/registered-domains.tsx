import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { ExternalLink, Clock, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useWeb3 } from '@/components/web3-provider'
import { NEX_REGISTRAR_ABI, NEXUS_TESTNET } from '@/lib/web3'
import { getContractAddresses } from '@/config/contracts'

interface RegisteredDomain {
  name: string
  expires: Date
  isExpired: boolean
  daysUntilExpiry: number
  transactionHash: string
  tokenId: number
}

interface RegisteredDomainsProps {
  refreshTrigger?: number
}

// Function to clear domain cache (can be called from other components)
export const clearDomainCache = (account: string, chainId: number) => {
  const cacheKey = `nns_domains_${account}_${chainId}`
  localStorage.removeItem(cacheKey)
  console.log('Domain cache cleared for', account, 'on chain', chainId)
}

export function RegisteredDomains({ refreshTrigger }: RegisteredDomainsProps) {
  const { signer, account, chainId } = useWeb3()
  const [domains, setDomains] = useState<RegisteredDomain[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRegisteredDomains = async () => {
    if (!signer || !account || !chainId) return

    setLoading(true)
    setError(null)
    
    try {
      console.log('🔍 Debug Info:')
      console.log('  Chain ID:', chainId)
      console.log('  Account:', account)
      
      const contractAddresses = getContractAddresses(chainId)
      console.log('  Contract Addresses:', contractAddresses)
      console.log('  NexRegistrar Address:', contractAddresses.NexRegistrar)
      
      const registrarContract = new ethers.Contract(
        contractAddresses.NexRegistrar,
        NEX_REGISTRAR_ABI,
        signer
      )

      console.log('📡 Fetching domains using NFT approach for account:', account)
      console.log('📍 Using contract at:', contractAddresses.NexRegistrar)

      // Use the new NFT approach to get all domains owned by the user
      const domainNames = await registrarContract.getDomainsOfOwner(account)
      console.log('✅ Found domains via NFT:', domainNames)
      
      const domainData: RegisteredDomain[] = []
      
      // Process each domain name from NFT approach
      for (const domainName of domainNames) {
        try {
          console.log('Processing domain:', domainName)
          
          // Get domain information from contract
          const domainInfo = await registrarContract.getDomain(domainName)
          console.log('Domain info:', domainInfo)
          
          if (domainInfo.exists && domainInfo.owner.toLowerCase() === account.toLowerCase()) {
            const expiryTimestamp = Number(domainInfo.expires) * 1000
            const expiryDate = new Date(expiryTimestamp)
            const now = new Date()
            const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            
            // Add .nex suffix if not present
            const fullDomainName = domainName.endsWith('.nex') ? domainName : `${domainName}.nex`
            
            // Try to find the registration transaction hash from events
            let transactionHash = ''
            try {
              // Look for DomainRegistered events for this domain
              const filter = registrarContract.filters.DomainRegistered(domainName)
              const events = await registrarContract.queryFilter(filter, -10000) // Look back 10k blocks
              if (events.length > 0) {
                // Get the most recent registration event
                const latestEvent = events[events.length - 1]
                transactionHash = latestEvent.transactionHash
                console.log(`Found registration tx for ${domainName}: ${transactionHash}`)
              }
            } catch (eventError) {
              console.log(`Could not find registration event for ${domainName}:`, eventError)
            }
            
            domainData.push({
              name: fullDomainName,
              expires: expiryDate,
              isExpired: expiryDate < now,
              daysUntilExpiry: daysUntilExpiry,
              transactionHash: transactionHash,
              tokenId: Number(domainInfo.tokenId)
            })
            
            console.log('Added domain:', fullDomainName)
          }
        } catch (error) {
          console.error(`Error processing domain ${domainName}:`, error)
        }
      }

      // Sort by expiry date (soonest first)
      domainData.sort((a, b) => a.expires.getTime() - b.expires.getTime())
      console.log('Final domain data:', domainData)
      
      setDomains(domainData)
    } catch (err) {
      console.error('Error fetching registered domains:', err)
      setError('Failed to fetch registered domains')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRegisteredDomains()
  }, [signer, account, chainId, refreshTrigger])

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getExpiryStatus = (domain: RegisteredDomain) => {
    if (domain.isExpired) {
      return { color: 'text-red-500', icon: AlertTriangle, text: 'Expired' }
    } else if (domain.daysUntilExpiry <= 30) {
      return { color: 'text-orange-500', icon: Clock, text: `${domain.daysUntilExpiry} days left` }
    } else {
      return { color: 'text-green-500', icon: Clock, text: `${domain.daysUntilExpiry} days left` }
    }
  }

  if (!account) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Registered Domains</CardTitle>
        <CardDescription>
          Domains registered with your wallet
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="mr-2" />
            <span>Loading your domains...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-500">{error}</p>
            <Button 
              variant="outline" 
              onClick={fetchRegisteredDomains}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        ) : domains.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No domains registered yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {domains.map((domain) => {
              const status = getExpiryStatus(domain)
              const StatusIcon = status.icon
              
              return (
                <div
                  key={domain.name}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">{domain.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Expires: {formatDate(domain.expires)}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className={`flex items-center space-x-1 ${status.color}`}>
                      <StatusIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">{status.text}</span>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (domain.transactionHash) {
                          // If we have the registration transaction hash, show that
                          window.open(`${NEXUS_TESTNET.blockExplorer}/tx/${domain.transactionHash}`, '_blank')
                        } else if (chainId) {
                          // Otherwise, show the contract address
                          const contractAddresses = getContractAddresses(chainId)
                          window.open(`${NEXUS_TESTNET.blockExplorer}/address/${contractAddresses.NexRegistrar}`, '_blank')
                        }
                      }}
                      title={domain.transactionHash ? "View Registration Transaction" : "View NexRegistrar Contract"}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}