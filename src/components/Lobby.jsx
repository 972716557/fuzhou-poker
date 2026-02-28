import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../game/GameContext.jsx'
import { AVATARS } from '../../shared/constants.js'

export default function Lobby() {
  const { connected, connectionState, roomState, actions } = useGame()
  const [name, setName] = useState('脚王')
  const [avatar, setAvatar] = useState(AVATARS[Math.floor(Math.random() * AVATARS.length)])
  const [roomIdInput, setRoomIdInput] = useState('')
  const [mode, setMode] = useState(null)

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
    <div className="w-full h-full bg-surface flex items-center justify-center px-5">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="glass rounded-3xl w-full max-w-[400px] md:max-w-[440px] p-8 md:p-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-txt tracking-tight">抚州32张</h1>
          <p className="text-txt-muted text-sm mt-1.5">在线博弈扑克</p>
        </div>

        {/* Connection */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`w-1.5 h-1.5 rounded-full ${
            connected ? 'bg-accent' :
            connectionState === 'reconnecting' ? 'bg-warn animate-pulse' :
            'bg-danger'
          }`} />
          <span className="text-txt-muted text-xs">
            {connected ? '已连接' :
             connectionState === 'reconnecting' ? '重连中...' :
             connectionState === 'connecting' ? '连接中...' : '未连接'}
          </span>
        </div>

        {/* Error */}
        {roomState.error && (
          <div className="bg-danger/10 border border-danger/20 text-danger text-sm px-4 py-3 rounded-xl mb-5 text-center">
            {roomState.error}
          </div>
        )}

        {/* Name */}
        <div className="mb-5">
          <label className="text-txt-secondary text-xs font-medium mb-2 block">昵称</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="输入你的昵称"
            maxLength={8}
            className="input"
          />
        </div>

        {/* Avatar */}
        <div className="mb-8">
          <label className="text-txt-secondary text-xs font-medium mb-3 block">头像</label>
          <div className="grid grid-cols-8 gap-1.5">
            {AVATARS.map((a) => (
              <button
                key={a}
                onClick={() => setAvatar(a)}
                className={`aspect-square rounded-xl text-lg flex items-center justify-center transition-all duration-200 ${
                  avatar === a
                    ? 'bg-accent/20 ring-2 ring-accent scale-105'
                    : 'bg-surface-overlay hover:bg-surface-card'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        {!mode && (
          <div className="flex gap-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setMode('create')}
              disabled={!connected}
              className="btn-primary flex-1"
            >
              创建房间
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setMode('join')}
              disabled={!connected}
              className="btn flex-1 bg-surface-card text-txt px-6 py-3 hover:bg-white/10"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            >
              加入房间
            </motion.button>
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleCreate}
              disabled={!connected || !name.trim()}
              className="btn-primary w-full"
            >
              创建新房间
            </motion.button>
            <button
              onClick={() => setMode(null)}
              className="w-full py-2.5 text-txt-muted hover:text-txt-secondary text-sm transition-colors"
            >
              返回
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-4">
            <div>
              <label className="text-txt-secondary text-xs font-medium mb-2 block">房间号</label>
              <input
                type="text"
                value={roomIdInput}
                onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                placeholder="输入4位房间号"
                maxLength={4}
                className="input text-center text-xl tracking-[0.4em] font-mono uppercase"
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleJoin}
              disabled={!connected || !name.trim() || roomIdInput.length < 4}
              className="btn-primary w-full"
            >
              加入房间
            </motion.button>
            <button
              onClick={() => setMode(null)}
              className="w-full py-2.5 text-txt-muted hover:text-txt-secondary text-sm transition-colors"
            >
              返回
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
