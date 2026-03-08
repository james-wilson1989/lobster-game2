import { Link, useLocation } from 'react-router-dom'
import { useWallet } from '../wallet'

export default function Navbar() {
  const { address, isConnected } = useWallet()
  const location = useLocation()

  const formatAddress = (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : ''

  return (
    <nav className="bg-black/30 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-3xl">🦞</span>
            <span className="text-xl font-bold text-white">龙虾大亨</span>
          </Link>
          
          <div className="flex items-center space-x-8">
            <Link 
              to="/" 
              className={`text-lg transition-colors ${location.pathname === '/' ? 'text-yellow-400 font-bold' : 'text-gray-300 hover:text-white'}`}
            >
              首页
            </Link>
            <Link 
              to="/game" 
              className={`text-lg transition-colors ${location.pathname === '/game' ? 'text-yellow-400 font-bold' : 'text-gray-300 hover:text-white'}`}
            >
              养殖
            </Link>
            <Link 
              to="/leaderboard" 
              className={`text-lg transition-colors ${location.pathname === '/leaderboard' ? 'text-yellow-400 font-bold' : 'text-gray-300 hover:text-white'}`}
            >
              排行榜
            </Link>
          </div>

          <div className="text-gray-400 text-sm">
            {isConnected ? formatAddress(address) : '未连接钱包'}
          </div>
        </div>
      </div>
    </nav>
  )
}
