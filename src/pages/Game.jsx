import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useConnect } from 'wagmi'
import { parseEther } from 'viem'
import { erc20Abi } from 'viem'
import { API_BASE } from '../config'

// 从运行时配置或环境变量读取配置
// 部署方式1: 自有服务器 → 修改 dist/config.js
// 部署方式2: Vercel/Netlify → 在后台设置环境变量
const getConfig = () => {
  const defaultConfig = {
    minFeed: 1,
    maxFeed: 100,
    dailyLimit: 10,
    expPerToken: 10,
    developerAddress: '0x01db37579e55ce13f4504019025e36047bdad845',
    tokenAddress: ''
  }
  
  // 优先使用运行时配置（window.GAME_CONFIG）
  if (typeof window !== 'undefined' && window.GAME_CONFIG) {
    return { ...defaultConfig, ...window.GAME_CONFIG }
  }
  
  // 其次使用构建时环境变量（Vite）
  return {
    ...defaultConfig,
    tokenAddress: import.meta.env.VITE_TOKEN_ADDRESS || ''
  }
}

const CONFIG = getConfig()

export default function Game() {
  const { address, isConnected } = useAccount()
  const { connectAsync } = useConnect()
  const { writeContractAsync } = useWriteContract()
  const [player, setPlayer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [feeding, setFeeding] = useState(false)
  const [feedAmount, setFeedAmount] = useState(1)
  const [status, setStatus] = useState('')
  const [tokenAddress, setTokenAddress] = useState(CONFIG.tokenAddress)

  // 加载玩家数据
  useEffect(() => {
    if (!address) {
      setLoading(false)
      return
    }
    
    fetch(`${API_BASE}/api/player/${address}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPlayer(data.data)
        } else if (data.message === '玩家不存在') {
          return fetch(`${API_BASE}/api/player`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, name: '小青龙' })
          })
        }
      })
      .then(res => res?.json())
      .then(data => {
        if (data?.success) setPlayer(data.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [address])

  // 喂养
  const handleFeed = async () => {
    if (!isConnected) {
      setStatus('请先连接钱包')
      return
    }
    if (!tokenAddress) {
      setStatus('请先设置代币合约地址')
      return
    }
    if (feedAmount < CONFIG.minFeed || feedAmount > CONFIG.maxFeed) {
      setStatus(`喂养数量需在 ${CONFIG.minFeed}-${CONFIG.maxFeed} 之间`)
      return
    }
    if (player && player.todayFeedCount >= CONFIG.dailyLimit) {
      setStatus('今日喂养次数已用完')
      return
    }

    setFeeding(true)
    setStatus('正在喂养...')

    try {
      // 第一步：玩家转账代币到创始人钱包
      setStatus('正在转账代币到创始人钱包...')
      try {
        await writeContractAsync({
          address: tokenAddress,
          abi: erc20Abi,
          functionName: 'transfer',
          args: [CONFIG.developerAddress, parseEther(feedAmount.toString())]
        })
      } catch (transferError) {
        console.error('代币转账失败:', transferError)
        setStatus('代币转账失败，请确保有足够的代币授权')
        setFeeding(false)
        return
      }

      // 第二步：调用后端API更新游戏数据
      setStatus('正在更新游戏数据...')
      const res = await fetch(`${API_BASE}/api/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, amount: feedAmount })
      })
      const data = await res.json()
      if (data.success) {
        setPlayer(data.data.player)
        setStatus(`喂养成功！+${feedAmount * CONFIG.expPerToken} 经验 (已发送到创始人钱包)`)
      } else {
        setStatus(data.message || '喂养失败')
      }
    } catch (err) {
      setStatus('网络错误')
    } finally {
      setFeeding(false)
    }
  }

  // 计算经验进度
  const expProgress = player 
    ? (player.experience / player.expToNextLevel) * 100 
    : 0

  const dailyLimit = CONFIG.dailyLimit
  const todayFeedCount = player?.todayFeedCount || 0
  const remainingFeeds = dailyLimit - todayFeedCount

  if (!isConnected) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="text-6xl mb-6">🔒</div>
        <h2 className="text-3xl text-white font-bold mb-4">请先连接钱包</h2>
        <p className="text-gray-400 mb-6">连接钱包后可开始养殖你的龙虾</p>
        <button onClick={() => connectAsync({ connector: window.ethereum })} className="glass-button gold-button inline-block text-lg px-8 py-3">
          连接钱包
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="text-6xl mb-6">⏳</div>
        <h2 className="text-3xl text-white font-bold mb-4">正在加载...</h2>
        <p className="text-gray-400">请稍候，正在检查钱包连接状态</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧：龙虾展示 */}
          <div className="glass-card p-8">
            <h2 className="text-2xl text-white font-bold mb-6 text-center">
              {player?.name || '我的龙虾'}
            </h2>
            
            {/* 龙虾图片 */}
            <div className="relative flex justify-center mb-8">
              <div className={`w-48 h-48 text-9xl flex items-center justify-center ${player ? 'animate-bounce' : ''}`}>
                🦞
              </div>
              {player && (
                <div className="absolute -top-2 -right-2 bg-yellow-400 text-black font-bold px-3 py-1 rounded-full">
                  Lv.{player.level}
                </div>
              )}
            </div>

            {/* 等级进度条 */}
            {player && (
              <div className="mb-6">
                <div className="flex justify-between text-white mb-2">
                  <span>等级 {player.level}</span>
                  <span>升级需要 {player.expToNextLevel} 经验</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill experience-fill" 
                    style={{ width: `${expProgress}%` }}
                  />
                </div>
                <div className="text-center text-gray-400 mt-2">
                  {player.experience} / {player.expToNextLevel} 经验
                </div>
              </div>
            )}

            {/* 统计数据 */}
            {player && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-lg text-center">
                  <div className="text-gray-400 text-sm">总经验</div>
                  <div className="text-white text-xl font-bold">{player.totalExp}</div>
                </div>
                <div className="bg-white/5 p-4 rounded-lg text-center">
                  <div className="text-gray-400 text-sm">今日分红</div>
                  <div className="text-yellow-400 text-xl font-bold">{player.dailyDividend} LBC</div>
                </div>
              </div>
            )}
          </div>

          {/* 右侧：喂养和分红 */}
          <div className="space-y-6">
            {/* 代币配置 */}
            <div className="glass-card p-6">
              <h3 className="text-xl text-white font-bold mb-4 flex items-center">
                🪙 代币合约设置
              </h3>
              
              <div className="mb-4">
                <label className="text-gray-400 block mb-2">代币合约地址 (ERC-20)</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="0x..."
                    value={tokenAddress}
                    onChange={(e) => setTokenAddress(e.target.value)}
                    disabled={!!CONFIG.tokenAddress}  // 如果环境变量已配置，则禁用输入
                    className={`flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white text-sm font-mono ${CONFIG.tokenAddress ? 'opacity-60' : ''}`}
                  />
                </div>
                {CONFIG.tokenAddress ? (
                  <p className="text-green-400 text-xs mt-2">
                    ✓ 已配置代币合约（通过环境变量）
                  </p>
                ) : (
                  <p className="text-gray-500 text-xs mt-2">
                    输入你要使用的代币合约地址 (例如 USDT, USDC 等)
                  </p>
                )}
              </div>

              {tokenAddress && (
                <div className="bg-white/5 p-3 rounded-lg">
                  <span className="text-green-400">✓ 代币已设置</span>
                  <div className="text-gray-400 text-xs mt-1 font-mono break-all">{tokenAddress}</div>
                </div>
              )}

              {/* 创始人钱包地址显示 */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded-lg mt-3">
                <div className="text-yellow-400 text-sm font-bold mb-1">📍 收益接收地址:</div>
                <div className="text-gray-300 text-xs font-mono break-all">
                  {CONFIG.developerAddress}
                </div>
                <p className="text-gray-500 text-xs mt-1">
                  喂养代币将直接发送到此地址
                </p>
              </div>
            </div>

            {/* 喂养区域 */}
            <div className="glass-card p-6">
              <h3 className="text-xl text-white font-bold mb-4">🦞 喂养龙虾</h3>
              
              {/* 喂养限制提示 */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">今日喂养:</span>
                  <span className={remainingFeeds > 0 ? 'text-blue-400' : 'text-red-400'}>
                    {todayFeedCount} / {dailyLimit} 次
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-gray-400">每次金额:</span>
                  <span className="text-gray-300">{CONFIG.minFeed} - {CONFIG.maxFeed}</span>
                </div>
                {remainingFeeds <= 0 && (
                  <div className="text-red-400 text-sm mt-2 text-center">
                    ⚠️ 今日喂养次数已用完，明天再来吧！
                  </div>
                )}
              </div>

              {/* 喂养数量选择 */}
              <div className="mb-4">
                <label className="text-gray-400 block mb-2">喂养数量</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 5, 10, 50].filter(v => v <= CONFIG.maxFeed).map(amount => (
                    <button
                      key={amount}
                      onClick={() => setFeedAmount(amount)}
                      className={`py-3 rounded-lg font-bold transition-all ${
                        feedAmount === amount 
                          ? 'bg-red-500 text-white' 
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {amount}
                    </button>
                  ))}
                </div>
              </div>

              {/* 喂养信息 */}
              <div className="bg-white/5 p-4 rounded-lg mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">消耗代币:</span>
                  <span className="text-white">{feedAmount} TOKEN</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">获得经验:</span>
                  <span className="text-green-400">+{feedAmount * CONFIG.expPerToken} XP</span>
                </div>
              </div>

              {/* 喂养按钮 */}
              <button
                onClick={handleFeed}
                disabled={feeding || remainingFeeds <= 0}
                className="glass-button w-full py-4 text-lg"
              >
                {feeding ? '喂养中...' : `🦞 喂养 (${feedAmount} TOKEN)`}
              </button>

              {/* 状态提示 */}
              {status && (
                <div className={`mt-4 p-3 rounded-lg text-center ${
                  status.includes('成功') 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {status}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
