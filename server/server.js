import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_FILE = path.join(__dirname, 'data.json')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// 游戏配置
const CONFIG = {
  minFeed: 1,
  maxFeed: 100,
  dailyLimit: 10,
  expPerToken: 10,
  topN: 5,
  dividendPercent: 10,
  baseExpRequired: 100,
  expMultiplier: 1.5,
}

// 数据存储
let data = {
  players: {},
  pool: {
    totalAmount: 0,
    lastDividendTime: new Date().toISOString()
  }
}

// 加载数据
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8')
      data = JSON.parse(content)
    }
  } catch (err) {
    console.log('创建新数据文件...')
  }
}

// 保存数据
function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

// 初始化
loadData()

// 根路由 - Railway 健康检查
app.get('/', (req, res) => {
  res.send('🦞 龙虾服务器运行中')
})

// API: 获取全局统计
app.get('/api/stats', (req, res) => {
  try {
    const playerCount = Object.keys(data.players).length
    const totalExp = Object.values(data.players).reduce((sum, p) => sum + (p.totalExp || 0), 0)
    const poolAmount = data.pool.totalAmount
    
    res.json({
      success: true,
      data: {
        totalPlayers: playerCount,
        totalExp,
        poolAmount
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// API: 获取玩家信息
app.get('/api/player/:address', (req, res) => {
  const { address } = req.params
  const addr = address.toLowerCase()
  
  try {
    const player = data.players[addr]
    
    if (!player) {
      return res.json({ success: false, message: '玩家不存在' })
    }
    
    res.json({
      success: true,
      data: player
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// API: 创建玩家
app.post('/api/player', (req, res) => {
  const { address, name } = req.body
  
  if (!address) {
    return res.status(400).json({ success: false, message: '缺少地址' })
  }
  
  const addr = address.toLowerCase()
  
  try {
    if (data.players[addr]) {
      return res.json({ success: false, message: '玩家已存在' })
    }
    
    data.players[addr] = {
      address: addr,
      name: name || '小青龙',
      level: 1,
      experience: 0,
      expToNextLevel: 100,
      totalExp: 0,
      dailyDividend: 0,
      totalEarned: 0,
      todayFeedCount: 0,
      lastFeedDate: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    saveData()
    
    res.json({
      success: true,
      data: data.players[addr]
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// API: 喂养
app.post('/api/feed', (req, res) => {
  const { address, amount } = req.body
  
  if (!address || !amount) {
    return res.status(400).json({ success: false, message: '缺少必要参数' })
  }
  
  const amountNum = parseInt(amount)
  if (isNaN(amountNum) || amountNum < CONFIG.minFeed || amountNum > CONFIG.maxFeed) {
    return res.status(400).json({ success: false, message: `喂养数量需在 ${CONFIG.minFeed}-${CONFIG.maxFeed} 之间` })
  }
  
  const addr = address.toLowerCase()
  
  try {
    // 获取或创建玩家
    if (!data.players[addr]) {
      data.players[addr] = {
        address: addr,
        name: '小青龙',
        level: 1,
        experience: 0,
        expToNextLevel: 100,
        totalExp: 0,
        dailyDividend: 0,
        totalEarned: 0,
        todayFeedCount: 0,
        lastFeedDate: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }
    
    const player = data.players[addr]
    
    // 检查每日限制
    const today = new Date().toDateString()
    let todayFeedCount = player.todayFeedCount
    if (player.lastFeedDate !== today) {
      todayFeedCount = 0
    }
    
    if (todayFeedCount >= CONFIG.dailyLimit) {
      return res.json({ success: false, message: '今日喂养次数已用完' })
    }
    
    // 计算经验
    const expGain = amountNum * CONFIG.expPerToken
    let newExp = player.experience + expGain
    let newLevel = player.level
    let newExpToNext = player.expToNextLevel
    
    // 升级
    while (newExp >= newExpToNext) {
      newExp -= newExpToNext
      newLevel++
      newExpToNext = Math.floor(newExpToNext * CONFIG.expMultiplier)
    }
    
    // 计算每日分红 = 等级^2 * 10
    const newDailyDividend = newLevel * newLevel * 10
    
    // 更新分红池（每喂养1代币，池子增加0.1）
    const poolIncrease = Math.floor(amountNum * 0.1)
    data.pool.totalAmount += poolIncrease
    
    // 更新玩家
    player.level = newLevel
    player.experience = newExp
    player.expToNextLevel = newExpToNext
    player.totalExp += expGain
    player.dailyDividend = newDailyDividend
    player.todayFeedCount = todayFeedCount + 1
    player.lastFeedDate = today
    player.updatedAt = new Date().toISOString()
    
    saveData()
    
    res.json({
      success: true,
      data: {
        player,
        poolIncrease
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// API: 排行榜
app.get('/api/leaderboard', (req, res) => {
  try {
    const players = Object.values(data.players)
      .sort((a, b) => b.totalExp - a.totalExp)
      .slice(0, 100)
      .map(p => ({
        address: p.address,
        name: p.name,
        level: p.level,
        totalExp: p.totalExp
      }))
    
    const totalPool = data.pool.totalAmount || 0
    const nextDividend = Math.floor(totalPool * CONFIG.dividendPercent / 100)
    
    res.json({
      success: true,
      data: {
        players,
        poolInfo: {
          totalPool,
          nextDividend
        }
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// API: 提取分红
app.post('/api/claim', (req, res) => {
  const { address } = req.body
  
  if (!address) {
    return res.status(400).json({ success: false, message: '缺少地址' })
  }
  
  const addr = address.toLowerCase()
  
  try {
    const player = data.players[addr]
    
    if (!player) {
      return res.json({ success: false, message: '玩家不存在' })
    }
    
    if (player.dailyDividend <= 0) {
      return res.json({ success: false, message: '没有可提取的分红' })
    }
    
    // 玩家排名
    const sortedPlayers = Object.values(data.players).sort((a, b) => b.totalExp - a.totalExp)
    const rank = sortedPlayers.findIndex(p => p.address === addr) + 1
    
    if (rank > CONFIG.topN) {
      return res.json({ success: false, message: '只有前5名可以提取分红' })
    }
    
    // 计算分红
    const totalPool = data.pool.totalAmount || 0
    const dividendAmount = Math.floor(totalPool * CONFIG.dividendPercent / 100 / CONFIG.topN)
    
    if (dividendAmount <= 0) {
      return res.json({ success: false, message: '分红池不足' })
    }
    
    // 更新分红池
    data.pool.totalAmount -= dividendAmount
    
    // 更新玩家
    player.dailyDividend = 0
    player.totalEarned += dividendAmount
    player.updatedAt = new Date().toISOString()
    
    saveData()
    
    res.json({
      success: true,
      data: {
        player,
        claimed: dividendAmount
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`🦞 龙虾大亨服务器运行在 http://localhost:${PORT}`)
})
