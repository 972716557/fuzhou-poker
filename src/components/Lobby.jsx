import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../game/GameContext.jsx'
import { AVATARS } from '../../shared/constants.js'

export default function Lobby() {
  const { connected, connectionState, roomState, actions } = useGame()
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(AVATARS[Math.floor(Math.random() * AVATARS.length)])
  const [roomIdInput, setRoomIdInput] = useState('')
  const [mode, setMode] = useState(null) // null | 'create' | 'join'

  // 从 URL 参数读取房间号
  useState(() => {
    const params = new URLSearchParams(window.location.search)
    const roomFromUrl = params.get('room')
    if (roomFromUrl) {
      setRoomIdInput(roomFromUrl.toUpperCase())
      setMode('join')
    }
  })

  const handleCreate = () => {
    if (!name.trim()) return
    actions.createRoom(name.trim(), avatar)
  }

  const handleJoin = () => {
    if (!name.trim() || !roomIdInput.trim()) return
    actions.joinRoom(roomIdInput.trim().toUpperCase(), name.trim(), avatar)
  }

  return (
    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8 w-full max-w-md"
      >
        {/* 标题 */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-emerald-300 mb-1">抚州32张</h1>
          <p className="text-gray-500 text-sm">博弈扑克 - 在线对战</p>
        </div>

        {/* 连接状态 */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className={`w-2 h-2 rounded-full ${
            connected ? 'bg-green-400' :
            connectionState === 'reconnecting' ? 'bg-yellow-400 animate-pulse' :
            'bg-red-400'
          }`} />
          <span className="text-gray-500 text-xs">
            {connected ? '已连接' :
             connectionState === 'reconnecting' ? '重连中...' :
             connectionState === 'connecting' ? '连接中...' : '未连接'}
          </span>
        </div>

        {/* 错误提示 */}
        {roomState.error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 text-sm px-4 py-2 rounded-lg mb-4 text-center">
            {roomState.error}
          </div>
        )}

        {/* 昵称输入 */}
        <div className="mb-4">
          <label className="text-gray-400 text-sm mb-1 block">你的昵称</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="输入昵称..."
            maxLength={8}
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-2.5 border border-gray-600 focus:border-emerald-500 focus:outline-none transition"
          />
        </div>

        {/* 头像选择 */}
        <div className="mb-6">
          <label className="text-gray-400 text-sm mb-2 block">选择头像</label>
          <div className="flex flex-wrap gap-2">
            {AVATARS.map((a) => (
              <button
                key={a}
                onClick={() => setAvatar(a)}
                className={`w-10 h-10 rounded-full text-xl flex items-center justify-center transition-all ${
                  avatar === a
                    ? 'bg-emerald-600 ring-2 ring-emerald-400 scale-110'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* 模式选择 / 操作按钮 */}
        {!mode && (
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode('create')}
              disabled={!connected}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-xl hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              创建房间
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode('join')}
              disabled={!connected}
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              加入房间
            </motion.button>
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreate}
              disabled={!connected || !name.trim()}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-xl hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              创建新房间
            </motion.button>
            <button
              onClick={() => setMode(null)}
              className="w-full py-2 text-gray-500 hover:text-gray-300 text-sm transition"
            >
              返回
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-3">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">房间号</label>
              <input
                type="text"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                placeholder="输入4位房间号..."
                maxLength={4}
                className="w-full bg-gray-700 text-white text-center text-2xl tracking-[0.5em] rounded-lg px-4 py-3 border border-gray-600 focus:border-blue-500 focus:outline-none transition font-mono uppercase"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleJoin}
              disabled={!connected || !name.trim() || roomIdInput.length < 4}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              加入房间
            </motion.button>
            <button
              onClick={() => setMode(null)}
              className="w-full py-2 text-gray-500 hover:text-gray-300 text-sm transition"
            >
              返回
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
