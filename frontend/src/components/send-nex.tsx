import { useState } from 'react'
import { ethers } from 'ethers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useWeb3 } from '@/components/web3-provider'
import { NEXUS_TESTNET, PUBLIC_RESOLVER_ABI, NNS_REGISTRY_ABI } from '@/lib/web3'
import { getContractAddresses } from '@/config/contracts'
import { namehash } from '@/lib/namehash'
import { TransactionModal } from '@/components/ui/modal'

function isNexDomain(value: string) {
  return typeof value === 'string' && value.trim().toLowerCase().endsWith('.nex')
}

export function SendNex() {
  const { signer, account, chainId, isConnected, switchNetwork } = useWeb3()
  const [recipientInput, setRecipientInput] = useState('')
  const [amountInput, setAmountInput] = useState('0.01')
  const [status, setStatus] = useState<'idle' | 'resolving' | 'sending' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string>('')
  const [txHash, setTxHash] = useState<string | null>(null)
  const [transactionModal, setTransactionModal] = useState<{
    isOpen: boolean
    status: 'pending' | 'success' | 'error'
    hash?: string
    message?: string
  }>({ isOpen: false, status: 'pending' })

  // Auto-resolve state
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null)
  const [resolveMessage, setResolveMessage] = useState<string>('')
  let resolveTimer: ReturnType<typeof setTimeout> | undefined
  const triggerAutoResolve = (value: string) => {
    if (resolveTimer) clearTimeout(resolveTimer)
    resolveTimer = setTimeout(async () => {
      console.debug('[SendNex] triggerAutoResolve input:', value)
      if (!isNexDomain(value)) {
        // If it's an address, show validity immediately
        if (ethers.isAddress(value)) {
          setResolvedAddress(value)
          setResolveMessage('Valid address')
          console.debug('[SendNex] Detected EVM address, valid:', value)
        } else {
          setResolvedAddress(null)
          setResolveMessage('')
          console.debug('[SendNex] Non-.nex and not an EVM address')
        }
        return
      }
      if (!signer || !chainId) return
      if (chainId !== NEXUS_TESTNET.chainId) {
        setMessage('Please switch to Nexus Testnet (3940) to resolve .nex')
        setResolveMessage('Switch to Nexus Testnet (3940) to resolve .nex')
        setResolvedAddress(null)
        console.debug('[SendNex] Wrong network for .nex resolution. current chainId:', chainId)
        return
      }
      try {
        setStatus('resolving')
        setResolveMessage('Resolving…')
        const { NNSRegistry, PublicResolver } = getContractAddresses(chainId)
        const node = namehash(value)
        console.debug('[SendNex] Using contracts:', { chainId, NNSRegistry, PublicResolver })
        console.debug('[SendNex] Namehash:', node)
        const registry = new ethers.Contract(NNSRegistry, NNS_REGISTRY_ABI, signer)
        let resolverAddr: string = await registry.resolver(node)
        console.debug('[SendNex] Registry.resolver returned:', resolverAddr)
        if (!resolverAddr || resolverAddr === ethers.ZeroAddress) {
          resolverAddr = PublicResolver
          console.debug('[SendNex] Fallback to PublicResolver:', resolverAddr)
        }
        const resolver = new ethers.Contract(resolverAddr, PUBLIC_RESOLVER_ABI, signer)
        let addr: string = await resolver.addr(node)
        console.debug('[SendNex] Resolver.addr returned:', addr)
        // Try multi-coin addr(bytes32,uint256) with EVM coinType 60 if standard addr is empty
        if (!addr || addr === ethers.ZeroAddress) {
          try {
            const multi = await (resolver as any)["addr(bytes32,uint256)"](node, 60)
            console.debug('[SendNex] Resolver.addr(node,60) returned:', multi)
            if (multi && ethers.isAddress(multi) && multi !== ethers.ZeroAddress) {
              addr = multi
            }
          } catch (e) {
            console.debug('[SendNex] addr(bytes32,uint256) not available or failed:', e)
          }
        }
        // Fallback to registry owner if still empty
        if ((!addr || addr === ethers.ZeroAddress)) {
          try {
            const owner: string = await registry.owner(node)
            console.debug('[SendNex] Registry.owner returned:', owner)
            if (owner && ethers.isAddress(owner) && owner !== ethers.ZeroAddress) {
              addr = owner
            }
          } catch (e) {
            console.debug('[SendNex] Registry.owner lookup failed:', e)
          }
        }
        if (addr && ethers.isAddress(addr) && addr !== ethers.ZeroAddress) {
          setResolvedAddress(addr)
          setMessage(`Resolved to: ${addr}`)
          setResolveMessage(`Valid .nex → ${addr}`)
          setStatus('idle')
        } else {
          setResolvedAddress(null)
          setMessage('Name has no address record')
          setResolveMessage('Not valid: no address record')
          setStatus('idle')
          console.debug('[SendNex] No address record for name')
        }
      } catch (err: any) {
        setResolvedAddress(null)
        setMessage(`Failed to resolve: ${err?.message || String(err)}`)
        setResolveMessage('Failed to resolve')
        setStatus('error')
        console.error('[SendNex] Resolve error:', err)
      }
    }, 350)
  }

  const resolveRecipient = async (): Promise<string> => {
    const value = recipientInput.trim()
    console.debug('[SendNex] resolveRecipient input:', value)
    if (!value) throw new Error('Enter recipient (address or .nex name)')

    if (isNexDomain(value)) {
      if (resolvedAddress && ethers.isAddress(resolvedAddress)) {
        console.debug('[SendNex] Using cached resolvedAddress:', resolvedAddress)
        return resolvedAddress
      }
      if (!signer || !chainId) throw new Error('Connect wallet first')
      if (chainId !== NEXUS_TESTNET.chainId) throw new Error('Switch to Nexus Testnet (3940)')
      const { NNSRegistry, PublicResolver } = getContractAddresses(chainId)
      const node = namehash(value)
      console.debug('[SendNex] Resolving via contracts:', { chainId, NNSRegistry, PublicResolver, node })
      const registry = new ethers.Contract(NNSRegistry, NNS_REGISTRY_ABI, signer)
      let resolverAddr: string = await registry.resolver(node)
      console.debug('[SendNex] Registry.resolver returned:', resolverAddr)
      if (!resolverAddr || resolverAddr === ethers.ZeroAddress) {
        resolverAddr = PublicResolver
        console.debug('[SendNex] Fallback to PublicResolver:', resolverAddr)
      }
      const resolver = new ethers.Contract(resolverAddr, PUBLIC_RESOLVER_ABI, signer)
      let addr: string = await resolver.addr(node)
      console.debug('[SendNex] Resolver.addr returned:', addr)
      // Try multi-coin addr(bytes32,uint256) with EVM coinType 60 if standard addr is empty
      if (!addr || addr === ethers.ZeroAddress) {
        try {
          const multi = await (resolver as any)["addr(bytes32,uint256)"](node, 60)
          console.debug('[SendNex] Resolver.addr(node,60) returned:', multi)
          if (multi && ethers.isAddress(multi) && multi !== ethers.ZeroAddress) {
            addr = multi
          }
        } catch (e) {
          console.debug('[SendNex] addr(bytes32,uint256) not available or failed:', e)
        }
      }
      // Fallback to registry owner if still empty
      if ((!addr || addr === ethers.ZeroAddress)) {
        try {
          const owner: string = await registry.owner(node)
          console.debug('[SendNex] Registry.owner returned:', owner)
          if (owner && ethers.isAddress(owner) && owner !== ethers.ZeroAddress) {
            addr = owner
          }
        } catch (e) {
          console.debug('[SendNex] Registry.owner lookup failed:', e)
        }
      }
      console.debug('[SendNex] Resolver.addr returned:', addr)
      if (addr && ethers.isAddress(addr) && addr !== ethers.ZeroAddress) {
        return addr
      }
      throw new Error('Name has no address record')
    }

    if (!ethers.isAddress(value)) {
      throw new Error('Invalid address. Use 0x… or a .nex name')
    }
    return value
  }

  const handleSend = async () => {
    try {
      if (!isConnected || !signer || !account) {
        throw new Error('Sambungkan wallet terlebih dahulu')
      }
      if (chainId !== NEXUS_TESTNET.chainId) {
        await switchNetwork()
        throw new Error('Berpindah jaringan ke Nexus Testnet. Coba lagi setelah tersambung.')
      }

      setStatus('resolving')
      setMessage('Resolving recipient…')
      const to = await resolveRecipient()

      const valueWei = ethers.parseEther(amountInput || '0')
      if (valueWei <= 0n) throw new Error('Amount must be greater than 0')

      setStatus('sending')
      setMessage('Sending transaction…')
      setTransactionModal({ isOpen: true, status: 'pending', message: 'Transaksi dikirim. Menunggu konfirmasi…' })
      const tx = await signer.sendTransaction({ to, value: valueWei })
      setTxHash(tx.hash)
      setTransactionModal(prev => ({ ...prev, hash: tx.hash }))
      // Jangan blok UI: tunggu konfirmasi secara non-blocking
      tx.wait()
        .then((receipt) => {
          if (receipt && receipt.status === 1) {
            const targetLabel = isNexDomain(recipientInput.trim()) ? recipientInput.trim() : to
            const successMsg = `You have successfully transfer ${amountInput} NEXT to ${targetLabel}`
            setStatus('success')
            setMessage('Transaction confirmed')
            setTransactionModal({
              isOpen: true,
              status: 'success',
              hash: tx.hash,
              message: successMsg,
            })
          } else {
            setStatus('error')
            setMessage('Transaction failed')
            setTransactionModal({ isOpen: true, status: 'error', hash: tx.hash, message: 'Transaction failed' })
          }
        })
        .catch((err) => {
          // Bisa jadi timeout / jaringan; tetap tampilkan pending dan biarkan user menutup modal
          console.debug('[SendNex] tx.wait error:', err)
          setTransactionModal(prev => ({
            ...prev,
            isOpen: true,
            status: 'pending',
            message: 'Masih menunggu konfirmasi… Anda bisa menutup modal dan cek Explorer.',
          }))
        })

      // Kembalikan tombol ke kondisi aktif agar tidak terasa "loading" lama
      setStatus('idle')
    } catch (err: any) {
      setStatus('error')
      setMessage(err?.message || 'An error occurred while sending transaction')
      setTransactionModal({
        isOpen: true,
        status: 'error',
        message: err?.message || 'An error occurred while sending transaction',
      })
    }
  }

  return (
    <Card className="mt-0 mb-2 max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Send NEX</CardTitle>
        <CardDescription>
          Enter an address or .nex name, resolve and send NEX
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Recipient (.nex or 0x…)</label>
            <Input
              placeholder="alice.nex or 0x…"
              value={recipientInput}
              onChange={(e) => { setRecipientInput(e.target.value); triggerAutoResolve(e.target.value) }}
            />
            {recipientInput && (
              <p className={`mt-1 text-xs ${status === 'resolving' ? 'text-muted-foreground' : resolvedAddress ? 'text-green-600' : 'text-red-600'}`}>{resolveMessage}</p>
            )}
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Amount (NEX)</label>
            <Input
              type="number"
              min="0"
              step="0.0001"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleSend} disabled={status === 'sending' || status === 'resolving'}>
              {status === 'resolving' ? 'Resolving…' : status === 'sending' ? 'Sending…' : 'Send'}
            </Button>
          </div>
          {status !== 'idle' && (
            <p className={`text-sm ${status === 'error' ? 'text-red-500' : 'text-muted-foreground'}`}>{message}</p>
          )}
        </div>
      </CardContent>
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
    </Card>
  )
}