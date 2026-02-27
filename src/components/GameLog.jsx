import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../game/GameContext.jsx'

export default function GameLog() {
  const { gameState } = useGame()
  const logs = gameState?.logs || []

  return (
    <div className="absolute top-2 right-2 w-56 max-h-[50vh] bg-black/70 backdrop-blur rounded-xl border border-gray-700/50 overflow-hidden flex flex-col">
      <div className="px-3 py-2 border-b border-gray-700/50 flex items-center justify-between">
        <span className="text-gray-300 text-xs font-bold">游戏日志</span>
        <span className="text-gray-500 text-xs">{logs.length} 条</span>
      </div>

      <div className="overflow-y-auto flex-1 px-2 py-1 scrollbar-thin">
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
    </div>
  )
}
