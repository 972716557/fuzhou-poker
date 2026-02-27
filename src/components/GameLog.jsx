import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../game/GameContext.jsx'

export default function GameLog() {
  const { gameState } = useGame()
  const logs = gameState?.logs || []
  const [open, setOpen] = useState(false)

  return (
    <div className="absolute top-2 right-2 z-20 w-44">
      {/* 折叠标题栏 */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 bg-black/70 backdrop-blur px-3 py-1.5 rounded-xl border border-gray-700/50 w-full"
      >
        <span className="text-gray-300 text-xs font-bold">游戏日志</span>
        <span className="text-gray-500 text-xs">{logs.length} 条</span>
        <span className="text-gray-400 text-xs ml-auto">{open ? '▲' : '▼'}</span>
      </button>

      {/* 展开内容 - 浮层，不占位 */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="absolute top-full right-0 mt-1 w-56 max-h-[50vh] bg-black/90 backdrop-blur rounded-xl border border-gray-700/50 overflow-hidden flex flex-col"
          >
            <div className="overflow-y-auto flex-1 px-2 py-1">
              <AnimatePresence initial={false}>
                {logs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: 20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="py-1 border-b border-gray-800/50 last:border-0"
                  >
                    <div className="text-xs text-gray-300 leading-relaxed">{log.message}</div>
                    <div className="text-gray-600" style={{ fontSize: 9 }}>{log.timestamp}</div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {logs.length === 0 && (
                <div className="text-gray-600 text-xs text-center py-4">暂无日志</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
