import axios from 'axios'
import cache from './cache'
import Lockr from 'lockr'
import store from '@/store'

/** 移除授权信息 */
export function removeAuth(props = { clearCookies: false }) {
  return new Promise((resolve, reject) => {
    // if (props.clearCookies) {
    //   Cookies.remove('User', { path: '/', domain: '.72crm.com' })
    // }
    cache.rmAxiosCache()
    store.commit('SET_ALLAUTH', null)
    delete axios.defaults.headers['Admin-Token']
    resolve(true)
  })
}

/** 注入授权信息 */
export function addAuth(adminToken) {
  return new Promise((resolve, reject) => {
    axios.defaults.headers['Admin-Token'] = adminToken
    // store.dispatch('SystemLogoAndName')
    resolve(true)
  })
}

/** 获取授权信息 */
export function getAuth() {
  return new Promise((resolve, reject) => {
    if (axios.defaults.headers['Admin-Token']) {
      resolve()
    } else {
      const lockAdminToken = Lockr.get('Admin-Token')
      if (lockAdminToken) {
        cache.updateAxiosCache()
        store.dispatch('GetUserInfo').then(() => {
          // 不忽略Cookies
          window.sessionStorage.wkIgnoreCookies = false
          resolve()
        }).catch(() => {
          reject()
        })
      } else {
        reject()
      }
    }
  })
}
