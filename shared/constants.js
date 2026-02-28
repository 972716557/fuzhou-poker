/**
 * 游戏常量
 */

// 布局：底部操作栏高度，与桌面明确分离，不挡牌
export const ACTION_BAR_H = 132

// 游戏阶段
export const PHASE = {
  WAITING: 'WAITING',       // 等待开始
  DEALING: 'DEALING',       // 发牌中
  BETTING: 'BETTING',       // 下注阶段
  SHOWDOWN: 'SHOWDOWN',     // 摊牌
  SETTLEMENT: 'SETTLEMENT', // 结算
}

// 玩家动作
export const ACTION = {
  LOOK: 'LOOK',         // 看牌
  BET: 'BET',           // 跟注
  KICK: 'KICK',         // 踢一脚
  FOLD: 'FOLD',         // 弃牌
  COMPARE: 'COMPARE',   // 比牌
  ALL_IN: 'ALL_IN',     // 全押
}

// 默认配置
export const DEFAULT_CONFIG = {
  minPlayers: 2,
  maxPlayers: 16,
  initialChips: 1000,
  baseBlind: 10,          // 基础盲注
  maxRaise: 5,            // 最大加注倍数
  turnTimeout: 30,        // 回合超时（秒）
  minRoundsToCompare: 3,  // 最少轮数后才能比牌
}

// 玩家头像列表
export const AVATARS = [
  '👨', '👩', '🧑', '👴', '👵', '🧔', '👱', '👸',
  '🤴', '🧙', '🧛', '🧜', '🧝', '🧞', '🧟', '🤠',
]

// 玩家名称列表
export const PLAYER_NAMES = [
  '张三', '李四', '王五', '赵六', '孙七', '周八',
  '吴九', '郑十', '冯一', '陈二', '楚三', '魏四',
  '蒋五', '沈六', '韩七', '杨八',
]
