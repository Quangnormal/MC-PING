const express = require('express')
const mc = require('minecraft-protocol')
const net = require('net')

const HOST = process.env.MC_HOST
const MC_PORT = parseInt(process.env.MC_PORT)
const WEB_PORT = process.env.PORT || 3000

// ===== WEB SERVER (giữ Render sống) =====
const app = express()
app.get('/', (req, res) => {
  res.send('Bot running')
})
app.listen(WEB_PORT, () => {
  console.log('🌍 Web server running')
})

// ===== TCP PING =====
function tcpPing() {
  const socket = new net.Socket()
  socket.setTimeout(5000)

  socket.connect(MC_PORT, HOST, () => {
    console.log('📡 TCP ping success')
    socket.destroy()
  })

  socket.on('error', () => socket.destroy())
  socket.on('timeout', () => socket.destroy())
}

setInterval(tcpPing, 60000)

// ===== MINECRAFT BOT =====
function startBot() {
  const bot = mc.createClient({
    host: HOST,
    port: MC_PORT,
    username: 'PING_BOT',
    version: false
  })

  bot.on('login', () => console.log('✅ Bot joined'))

  bot.on('spawn', () => {
    console.log('🎮 Spawned')

    setInterval(() => {
      bot.write('arm_animation', { hand: 0 })
      console.log('🤖 Activity ping')
    }, 240000)
  })

  bot.on('end', () => {
    console.log('⚠ Reconnecting...')
    setTimeout(startBot, 5000)
  })

  bot.on('error', err => console.log('❌', err.message))
}


startBot()
