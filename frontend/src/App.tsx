import { ThemeProvider } from '@/components/theme-provider'
import { Web3Provider } from '@/components/web3-provider'
import { ThemeToggle } from '@/components/theme-toggle'
import { NNSInterface } from '@/components/nns-interface'

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="nns-ui-theme">
      <Web3Provider>
        <div className="relative">
          <div className="absolute top-4 right-4 z-10">
            <ThemeToggle />
          </div>
          <NNSInterface />
        </div>
      </Web3Provider>
    </ThemeProvider>
  )
}

export default App
