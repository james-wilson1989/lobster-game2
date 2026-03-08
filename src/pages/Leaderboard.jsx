import { useState, useEffect } from 'react'
import { useWallet } from '../wallet'

const API_BASE = 'http://localhost:3001'

const CONFIG = {
  topN: 5,
  dividendPercent: 10,
}

export default function Leaderboard() {
  const { address, isConnected } = useWallet()
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [poolInfo, setPoolInfo] = useState({ totalPool: 0, nextDividend: 0 })

  useEffect(() => {
    fetch(`${API_BASE}/api/leaderboard`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPlayers(data.data.players)
          setPoolInfo(data.data.poolInfo)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return rank
    }
  }

  const getRankClass = (rank) => {
    switch (rank) {
      case 1: return 'bg-yellow-500/20 border-yellow-500'
      case 2: return 'bg-gray-400/20 border-gray-400'
      case 3: return 'bg-orange-600/20 border-orange-600'
      default: return 'bg-white/5 border-white/10'
    }
  }

  return (
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🏆 排行榜</h1>
          <p className="text-gray-400">全球最强龙虾养殖者</p>
        </div>

        {/* 分红池信息 */}
        <div className="glass-card p-6 mb-8">
          <div className="grid grid-cols-2 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-yellow-400">
                {poolInfo.totalPool.toLocaleString()}
              </div>
              <div className="text-gray-400 mt-1">当前分红池</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-400">
                {poolInfo.nextDividend.toLocaleString()}
              </div>
              <div className="text-gray-400 mt-1">下次分红金额</div>
            </div>
          </div>
          <div className="mt-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-center">
            <span className="text-yellow-400 text-lg">🏆 前 {CONFIG.topN} 名可获得分红</span>
          </div>
        </div>

        {/* 排行榜列表 */}
        <div className="glass-card overflow-hidden">
          <div className="grid grid-cols-4 gap-4 p-4 bg-white/10 text-gray-400 font-bold">
            <div className="text-center">排名</div>
            <div>玩家</div>
            <div className="text-center">等级</div>
            <div className="text-right">总经验</div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-4xl">⏳</div>
              <p className="text-gray-400 mt-4">加载中...</p>
            </div>
          ) : players.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              暂无玩家数据
            </div>
          ) : (
            players.map((player, index) => (
              <div 
                key={player.address} 
                className={`grid grid-cols-4 gap-4 p-4 border-b border-white/10 hover:bg-white/5 items-center ${
                  index < CONFIG.topN ? 'bg-yellow-500/5' : ''
                }`}
              >
                <div className="text-center">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full border-2 text-lg ${getRankClass(index + 1)}`}>
                    {getRankIcon(index + 1)}
                  </span>
                </div>
                <div className="text-green-400 font-mono text-sm">
                  {player.address.slice(0, 8)}...{player.address.slice(-6)}
                  {player.name && <span className="text-gray-400 ml-2">{player.name}</span>}
                </div>
                <div className="text-center">
                  <span className={`px-3 py-1 rounded-full font-bold ${
                    index < CONFIG.topN 
                      ? 'bg-yellow-500/20 text-yellow-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    Lv.{player.level}
                  </span>
                </div>
                <div className={`text-right font-bold ${index < CONFIG.topN ? 'text-yellow-400' : 'text-white'}`}>
                  {player.totalExp.toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
