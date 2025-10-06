import { useWeb3 } from '@/components/web3-provider'
import { ThemeToggle } from '@/components/theme-toggle'
import { NNSInterface } from '@/components/nns-interface'
import { SendNex } from '@/components/send-nex'
import { Button } from '@/components/ui/button'
import { Wallet, LogOut } from 'lucide-react'

function App() {
  const { account, isConnected, isCorrectNetwork, connect, disconnect, switchNetwork } = useWeb3()
  const shortAccount = account ? `${account.slice(0, 6)}…${account.slice(-4)}` : ''
  return (
    <div className="relative">
      <header className="fixed top-0 left-0 right-0 z-20 bg-background/80 backdrop-blur border-b">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="text-sm font-medium">
            <span className="hidden md:inline text-lg font-semibold">Nexus Name Service</span>
            <span className="md:hidden">NNS</span>
          </div>
          <div className="flex items-center gap-3">
            {isConnected ? (
              <>
                <span className="text-xs text-muted-foreground">{shortAccount}</span>
                {!isCorrectNetwork && (
                  <Button variant="outline" size="sm" onClick={switchNetwork}>Switch Network</Button>
                )}
                <Button variant="outline" size="sm" onClick={disconnect}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
                <ThemeToggle />
              </>
            ) : (
              <>
                <Button size="sm" onClick={connect}>
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect Wallet
                </Button>
                <ThemeToggle />
              </>
            )}
          </div>
        </div>
      </header>
      <main className="pt-16">
        <NNSInterface />
        <div className="container mx-auto px-4">
          <SendNex />
        </div>
      </main>
    </div>
  )
}

export default App
