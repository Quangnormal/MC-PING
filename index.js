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

setInterval(tcpPing, 300000)

// ===== MINECRAFT BOT =====
let manualDisconnect = false
let disconnectTimer = null

function startBot() {
  const bot = mc.createClient({
    host: HOST,
    port: MC_PORT,
    username: 'PING_BOT',
    version: false
  })

  bot.on('login', () => {
    console.log('✅ Bot joined')

    // Huỷ timer cũ nếu có (đề phòng trường hợp login lại trước khi timer chạy)
    if (disconnectTimer) clearTimeout(disconnectTimer)

    // Ngắt kết nối sau 2-5 giây
    const delay = Math.floor(Math.random() * 3000) + 2000 // 2000-5000 ms
    disconnectTimer = setTimeout(() => {
      manualDisconnect = true
      bot.end('Disconnecting after join')
    }, delay)
  })

  bot.on('end', (reason) => {
    console.log('🔌 Bot disconnected:', reason || 'unknown reason')

    // Huỷ timer phòng khi end xảy ra trước khi timer kịp chạy
    if (disconnectTimer) {
      clearTimeout(disconnectTimer)
      disconnectTimer = null
    }

    if (manualDisconnect) {
      console.log('⏳ Manual disconnect – waiting 5 minutes before next join')
      manualDisconnect = false
      setTimeout(startBot, 5 * 60 * 1000) // 5 phút
    } else {
      console.log('⚠️ Connection lost – reconnecting in 5 seconds')
      setTimeout(startBot, 5000)
    }
  })

  bot.on('error', err => {
    console.log('❌', err.message)
    // 'end' sẽ tự động được gọi sau error
  })
}

startBot()
