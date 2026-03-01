import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../game/GameContext.jsx'
import { AVATARS } from '../../shared/constants.js'

export default function Lobby() {
  const { connected, connectionState, roomState, actions } = useGame()
  const [name, setName] = useState('脚王')
  const [avatar, setAvatar] = useState(AVATARS[Math.floor(Math.random() * AVATARS.length)])
  const [roomIdInput, setRoomIdInput] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
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
    if (!name.trim() || !verifyCode.trim()) return
    actions.createRoom(name.trim(), avatar, verifyCode.trim())
  }

  const handleJoin = () => {
    if (!name.trim() || !roomIdInput.trim()) return
    actions.joinRoom(roomIdInput.trim().toUpperCase(), name.trim(), avatar)
  }

  return (
    <div className="w-full h-full bg-surface flex items-center justify-center px-5">
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="glass rounded-3xl w-full max-w-[400px] p-7 md:p-9"
      >
        {/* Header */}
        <div className="text-center mb-7">
          <h1 className="text-[22px] font-bold text-txt tracking-tight">抚州32张</h1>
          <p className="text-txt-muted text-[13px] mt-2 tracking-wide">在线博弈扑克</p>

          {/* Connection — inline with header */}
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <div className={`w-1.5 h-1.5 rounded-full ${
              connected ? 'bg-accent' :
              connectionState === 'reconnecting' ? 'bg-warn animate-pulse' :
              'bg-danger'
            }`} />
            <span className="text-txt-muted text-[11px]">
              {connected ? '已连接' :
               connectionState === 'reconnecting' ? '重连中...' :
               connectionState === 'connecting' ? '连接中...' : '未连接'}
            </span>
          </div>
        </div>

        {/* Error */}
        {roomState.error && (
          <div className="bg-danger/8 border border-danger/15 text-danger text-[13px] px-4 py-3 rounded-xl mb-5 text-center">
            {roomState.error}
          </div>
        )}

        {/* Name */}
        <div className="mb-5">
          <label className="text-txt-secondary text-[12px] font-medium mb-2 block">昵称</label>
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
        <div className="mb-7">
          <label className="text-txt-secondary text-[12px] font-medium mb-2.5 block">头像</label>
          <div className="grid grid-cols-8 gap-2">
            {AVATARS.map((a) => (
              <button
                key={a}
                onClick={() => setAvatar(a)}
                className={`aspect-square rounded-xl text-lg flex items-center justify-center transition-all duration-200 ${
                  avatar === a
                    ? 'bg-accent/15 ring-[1.5px] ring-accent ring-offset-1 ring-offset-surface'
                    : 'bg-white/[0.04] hover:bg-white/[0.08]'
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
              className="btn-secondary flex-1"
            >
              加入房间
            </motion.button>
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-4">
            <div>
              <label className="text-txt-secondary text-[12px] font-medium mb-2 block">验证码</label>
              <input
                type="text"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                placeholder="请输入验证码"
                maxLength={20}
                className="input"
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleCreate}
              disabled={!connected || !name.trim() || !verifyCode.trim()}
              className="btn-primary w-full"
            >
              创建新房间
            </motion.button>
            <button
              onClick={() => setMode(null)}
              className="w-full py-2.5 text-txt-muted hover:text-txt-secondary text-[13px] transition-colors rounded-xl hover:bg-white/[0.04]"
            >
              返回
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-4">
            <div>
              <label className="text-txt-secondary text-[12px] font-medium mb-2 block">房间号</label>
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
              className="w-full py-2.5 text-txt-muted hover:text-txt-secondary text-[13px] transition-colors rounded-xl hover:bg-white/[0.04]"
            >
              返回
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
