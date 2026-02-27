import http from 'http'
import { WebSocketServer } from 'ws'
import { RoomManager } from './RoomManager.js'

const PORT = process.env.WS_PORT || 4567
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ status: 'ok', rooms: roomManager.rooms.size }))
})

const wss = new WebSocketServer({ server })
const roomManager = new RoomManager()

wss.on('connection', (ws) => {
  ws.isAlive = true
  ws.on('pong', () => { ws.isAlive = true })

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString())
      roomManager.handleMessage(ws, msg)
    } catch (e) {
      console.error('Invalid message:', e.message)
    }
  })

  ws.on('close', () => {
    roomManager.handleDisconnect(ws)
  })

  ws.on('error', (err) => {
    console.error('WebSocket error:', err.message)
  })
})

// 心跳：15秒检测死连接
setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) return ws.terminate()
    ws.isAlive = false
    ws.ping()
  })
}, 15000)

server.listen(PORT, () => {
  console.log(`🃏 抚州32张 WebSocket 服务端运行在 ws://localhost:${PORT}`)
})
