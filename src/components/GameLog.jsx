import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../game/GameContext.jsx'

export default function GameLog() {
  const { gameState } = useGame()
  const logs = gameState?.logs || []
  const [open, setOpen] = useState(false)

  return (
    <div className="absolute top-2 right-2 md:top-3 md:right-3 z-20">
      {/* Toggle */}
      <button
        onClick={() => setOpen(v => !v)}
        className="glass-dark rounded-full px-3 py-1.5 flex items-center gap-2 hover:bg-white/[0.04] transition-colors"
      >
        <span className="text-txt-secondary text-[11px] font-medium">日志</span>
        {logs.length > 0 && (
          <span className="text-txt-muted text-[10px] tabular-nums bg-white/[0.06] rounded-full px-1.5 py-px">{logs.length}</span>
        )}
        <span className="text-txt-muted text-[9px]">{open ? '▲' : '▼'}</span>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-1.5 w-56 max-h-[50vh] glass rounded-xl overflow-hidden flex flex-col"
          >
            <div className="overflow-y-auto flex-1 p-2.5">
              <AnimatePresence initial={false}>
                {logs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: 12, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    className="py-1.5 border-b border-white/[0.04] last:border-0"
                  >
                    <div className="text-[11px] text-txt-secondary leading-relaxed">{log.message}</div>
                    <div className="text-txt-muted text-[9px] mt-0.5">{log.timestamp}</div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {logs.length === 0 && (
                <div className="text-txt-muted text-[11px] text-center py-8">暂无日志</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
