import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import BrowserOnly from './components/BrowserOnly'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Game from './pages/Game'
import Leaderboard from './pages/Leaderboard'

function AppContent() {
  const [WagmiProvider, setWagmiProvider] = useState(null)
  const [wagmiConfig, setWagmiConfig] = useState(null)

  useEffect(() => {
    Promise.all([
      import('wagmi'),
      import('./wagmi')
    ]).then(([{ WagmiProvider }, { config }]) => {
      setWagmiProvider(() => WagmiProvider)
      setWagmiConfig(config)
    })
  }, [])

  if (!WagmiProvider || !wagmiConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    )
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/game" element={<Game />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Routes>
        </div>
      </div>
    </WagmiProvider>
  )
}

export default function App() {
  return (
    <BrowserOnly fallback={<div className="min-h-screen bg-gradient-to-br from-blue-400 to-purple-500" />}>
      <AppContent />
    </BrowserOnly>
  )
}
