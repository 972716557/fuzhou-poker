/**
 * 抚州32张 - 牌型评估（委托 fuzhouPaiGow 规则，兼容现有调用）
 * 比牌规则见 shared/fuzhouPaiGow.js
 */

import { getHandResult, getHandResultColor, compareHands as compareHandsPaiGow, LEVEL } from './fuzhouPaiGow.js'

export { LEVEL }

/**
 * 两手牌型（兼容旧 API：level, rank, name, points）
 */
export function getHandRank(card1, card2) {
  const result = getHandResult([card1, card2])
  const rank =
    result.level === LEVEL.POINTS || result.level === LEVEL.SPECIAL_GANG || result.level === LEVEL.TIAN_JIU_FAN_WANG
      ? (result.points ?? 0)
      : result.level === LEVEL.TOP_PAIRS
        ? (result.subRank != null ? 8 - result.subRank : 0)
        : result.level
  return {
    level: result.level,
    rank,
    name: result.name,
    points: result.points ?? -1,
  }
}

/**
 * 比较两手牌的大小（支持先叫牌者胜）
 * @param {Object} hand1Card1 - 第一手第一张
 * @param {Object} hand1Card2 - 第一手第二张
 * @param {Object} hand2Card1 - 第二手第一张
 * @param {Object} hand2Card2 - 第二手第二张
 * @param {boolean} [isHand1Initiator] - 是否第一手为先叫牌者（摊牌时按位置：位置优者视为先叫）
 * @returns {number} 正数=hand1 大，负数=hand2 大
 */
export function compareHands(hand1Card1, hand1Card2, hand2Card1, hand2Card2, isHand1Initiator = false) {
  const res = compareHandsPaiGow(
    { cards: [hand1Card1, hand1Card2], isInitiator: isHand1Initiator },
    { cards: [hand2Card1, hand2Card2], isInitiator: !isHand1Initiator },
  )
  return res.winner === 1 ? 1 : -1
}

/**
 * 获取牌型展示颜色（前端特效）
 */
export function getHandColor(handRank) {
  if (!handRank) return '#fff'
  return getHandResultColor({
    level: handRank.level,
    points: handRank.points,
  })
}
