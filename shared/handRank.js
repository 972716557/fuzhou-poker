/**
 * 抚州32张 - 牌型评估算法
 *
 * 牌型等级:
 *   Level 3 - 至尊: 大王 + 小王
 *   Level 2 - 对子: 两张相同点数的牌（按天地人和排序）
 *   Level 1 - 天九王: Q + 任何9点牌
 *   Level 0 - 点数: (card1.points + card2.points) % 10, 9最大, 0(瘪十)最小
 */

import { CARD_TYPE, PAIR_NAMES } from './deck.js'

/**
 * 判断是否为至尊（大王+小王）
 */
function isZhiZun(card1, card2) {
  return (
    (card1.type === CARD_TYPE.JOKER_BIG && card2.type === CARD_TYPE.JOKER_SMALL) ||
    (card1.type === CARD_TYPE.JOKER_SMALL && card2.type === CARD_TYPE.JOKER_BIG)
  )
}

/**
 * 判断是否为对子（两张牌面值相同）
 */
function isPair(card1, card2) {
  if (card1.type !== CARD_TYPE.NORMAL || card2.type !== CARD_TYPE.NORMAL) return false
  return card1.pairGroup && card2.pairGroup && card1.pairGroup === card2.pairGroup
}

/**
 * 判断是否为天九王（Q + 9点牌）
 * Q的points=0, 9的points=9
 * 天九王: Q配上任何使总点数为9的牌
 */
function isTianJiuWang(card1, card2) {
  if (card1.type !== CARD_TYPE.NORMAL || card2.type !== CARD_TYPE.NORMAL) return false
  return (
    (card1.value === 'Q' && card2.points === 9) ||
    (card2.value === 'Q' && card1.points === 9)
  )
}

/**
 * 计算点数 (Level 0)
 * 两张牌点数之和对10取模
 * 9点最大，0点（瘪十）最小
 */
function calculatePoints(card1, card2) {
  return (card1.points + card2.points) % 10
}

/**
 * 核心评估函数
 * @param {Object} card1 - 第一张牌
 * @param {Object} card2 - 第二张牌
 * @returns {{ level: number, rank: number, name: string, points: number }}
 *   level: 牌型等级 (3=至尊, 2=对子, 1=天九王, 0=点数)
 *   rank: 同等级内的排名（用于比较）
 *   name: 牌型中文名
 *   points: 点数（仅Level 0有意义）
 */
export function getHandRank(card1, card2) {
  // Level 3: 至尊
  if (isZhiZun(card1, card2)) {
    return {
      level: 3,
      rank: 100,
      name: '至尊宝',
      points: -1,
    }
  }

  // Level 2: 对子
  if (isPair(card1, card2)) {
    return {
      level: 2,
      rank: card1.pairRank,
      name: `对子·${PAIR_NAMES[card1.pairGroup] || card1.value}`,
      points: -1,
    }
  }

  // Level 1: 天九王
  if (isTianJiuWang(card1, card2)) {
    return {
      level: 1,
      rank: 50,
      name: '天九王',
      points: 9,
    }
  }

  // Level 0: 点数
  const pts = calculatePoints(card1, card2)
  const pointNames = ['瘪十', '1点', '2点', '3点', '4点', '5点', '6点', '7点', '8点', '9点']
  return {
    level: 0,
    rank: pts,
    name: pointNames[pts],
    points: pts,
  }
}

/**
 * 比较两手牌的大小
 * @returns {number} 正数=hand1大, 负数=hand2大, 0=平局
 */
export function compareHands(hand1Card1, hand1Card2, hand2Card1, hand2Card2) {
  const rank1 = getHandRank(hand1Card1, hand1Card2)
  const rank2 = getHandRank(hand2Card1, hand2Card2)

  // 先比等级
  if (rank1.level !== rank2.level) {
    return rank1.level - rank2.level
  }

  // 同等级比排名
  return rank1.rank - rank2.rank
}

/**
 * 获取牌型的显示颜色
 */
export function getHandColor(handRank) {
  switch (handRank.level) {
    case 3: return '#ff4444' // 至尊 - 红色
    case 2: return '#ffaa00' // 对子 - 金色
    case 1: return '#44aaff' // 天九王 - 蓝色
    default:
      if (handRank.points >= 7) return '#44ff44' // 高点 - 绿色
      if (handRank.points >= 4) return '#ffffff' // 中点 - 白色
      return '#888888' // 低点 - 灰色
  }
}
