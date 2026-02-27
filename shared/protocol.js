/**
 * WebSocket 消息协议定义
 */

// Client → Server
export const C2S = {
  CREATE_ROOM:    'c2s:create_room',
  JOIN_ROOM:      'c2s:join_room',
  LEAVE_ROOM:     'c2s:leave_room',
  START_GAME:     'c2s:start_game',
  PLAYER_BET:     'c2s:bet',
  PLAYER_RAISE:   'c2s:raise',
  PLAYER_CALL_BET:'c2s:call_bet',
  PLAYER_FOLD:    'c2s:fold',
  PLAYER_COMPARE: 'c2s:compare',
  PLAYER_SHOWDOWN:'c2s:showdown',
  NEXT_ROUND:     'c2s:next_round',
  DEAL_ANIM_DONE: 'c2s:deal_anim_done',
  RECONNECT:      'c2s:reconnect',
  PING:           'c2s:ping',
}

// Server → Client
export const S2C = {
  ROOM_CREATED:        's2c:room_created',
  ROOM_JOINED:         's2c:room_joined',
  ROOM_ERROR:          's2c:room_error',
  PLAYER_LIST:         's2c:player_list',
  GAME_STATE:          's2c:game_state',
  DEAL_START:          's2c:deal_start',
  DEAL_COMPLETE:       's2c:deal_complete',
  PLAYER_JOINED:       's2c:player_joined',
  PLAYER_LEFT:         's2c:player_left',
  PLAYER_DISCONNECTED: 's2c:player_disconnected',
  PLAYER_RECONNECTED:  's2c:player_reconnected',
  LOG:                 's2c:log',
  PONG:                's2c:pong',
  ERROR:               's2c:error',
}
