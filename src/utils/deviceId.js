const STORAGE_KEY = 'fuzhou_device_id'

function randomId() {
  return 'd_' + Math.random().toString(36).slice(2, 12) + '_' + Date.now().toString(36)
}

/**
 * 获取本设备唯一 ID（持久化在 localStorage，同源下同设备同 ID）
 * 生产环境用于限制一设备一身份；本地联调时服务端不校验
 */
export function getDeviceId() {
  if (typeof localStorage === 'undefined') return null
  let id = localStorage.getItem(STORAGE_KEY)
  if (!id) {
    id = randomId()
    localStorage.setItem(STORAGE_KEY, id)
  }
  return id
}
