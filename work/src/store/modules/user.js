import {
  loginAPI,
  logoutAPI
} from '@/api/login'
import {
  userListAPI,
  depListAPI,
  adminUserQueryOrgInfoAPI,
  adminIndexAuthListAPI
} from '@/api/common'

import {
  resetRouter
} from '@/router'

import {
  adminUsersReadAPI
} from '@/api/user/personCenter'

import {
  addAuth,
  removeAuth
} from '@/utils/auth'
import { getCookiesDomain } from '@/utils'
import cache from '@/utils/cache'
import Lockr from 'lockr'
import { debounce } from 'throttle-debounce'
import Cookies from 'js-cookie'
import {
  RSAencrypt,
  objDeepCopy
} from '@/utils'

function loopUserDeptMap(list, map, userList, deptList) {
  list.forEach(item => {
    map[`dept-${item.deptId}`] = item
    deptList.push(item) // 添加部门搜索数据源

    if (item.userList) {
      item.userList.forEach(user => {
        map[`user-${user.userId}`] = user
        userList.push(user)// 添加员工搜索数据源
      })
    }
    if (item.children) {
      loopUserDeptMap(item.children, map, userList, deptList)
    }
  })
}

const user = {
  state: {
    userInfo: null, // 用户信息
    // 权限信息
    allAuth: null, // 总权限信息 默认空 调整动态路由
    userDeptObj: {
      disableUserList: [],
      userMap: {},
      deptList: []
    }, // 查询完整组织架构信息
    userDeptMap: {}, // 根据user + id 和 dept + id 形成的对象
    searchUserDept: {
      userList: [],
      deptList: [],
      disableUserList: []
    }, // 用于搜索  一维数组
    userList: [], // 管理后台员工和部门
    deptList: [],
    crm: {}, // 客户管理
    bi: {}, // 商业智能
    manage: {}, // 管理后台
    oa: {}, // 办公
    call: false // 呼叫中心是否开启
  },

  mutations: {
    SET_USERINFO: (state, userInfo) => {
      state.userInfo = userInfo
      localStorage.setItem('loginUserInfo', JSON.stringify(userInfo))
    },
    SET_ALLAUTH: (state, allAuth) => {
      state.allAuth = allAuth
    },
    SET_CRM: (state, crm) => {
      state.crm = crm
    },
    SET_BI: (state, bi) => {
      state.bi = bi
    },
    SET_MANAGE: (state, manage) => {
      state.manage = manage
    },
    SET_OA: (state, oa) => {
      state.oa = oa
    },
    SET_CALL: (state, call) => {
      state.call = call
    },
    SET_AUTH: (state, data) => {
      const token = data.adminToken
      Lockr.set('Admin-Token', token)
      const domain = getCookiesDomain()
      Cookies.set('AdminToken', token, { domain: domain, expires: 365 })
      addAuth(token)
    },
    SET_USERLIST: (state, data) => {
      state.userList = data
    },
    SET_DEPTLIST: (state, data) => {
      state.deptList = data
    },
    SET_USERDEPTOBJ: (state, data) => {
      state.userDeptObj = data
    },
    SET_USERDEPTMAP: (state, data) => {
      const tempMap = {
        // 'dept-0': {
        //   deptId: 0,
        //   name: '全公司'
        // }
      }
      const userList = []
      const deptList = []
      loopUserDeptMap(data.deptList, tempMap, userList, deptList)

      const disableUserList = []
      data.disableUserList.forEach(user => {
        tempMap[`user-${user.userId}`] = user
        disableUserList.push(user)
      })

      // 同时更新 搜索 和 map
      state.searchUserDept = {
        userList,
        deptList,
        disableUserList
      }
      state.userDeptMap = tempMap
    }
  },

  actions: {
    // 登录
    Login({
      commit,
      dispatch
    }, userInfo) {
      const password = userInfo.password ? RSAencrypt(userInfo.password + Date.now().toString()) : ''
      const params = objDeepCopy(userInfo)
      if (password) {
        
        params.password = password
      }

      return new Promise((resolve, reject) => {
        loginAPI(userInfo).then(res => {
          const data = res.data || {}
          if (!data.hasOwnProperty('companyList')) {
            commit('SET_AUTH', data)
            dispatch('GetUserInfo')
          }
          resolve(res)
        }).catch(error => {
          reject(error)
        })
      })
    },

    // 获取权限
    async getAuth({
      commit,
      dispatch
    }) {
      let data = {}
      try {
        const authData = await adminIndexAuthListAPI()
        data = authData.data
      } catch (error) {
        return Promise.reject(error)
      }

      if (Object.keys(data.crm).length === 0) {
        delete data.crm
      }

      Lockr.set('authList', data)
      data.wkFirstModel = data.firstModel
      commit('SET_ALLAUTH', data)
      commit('SET_CRM', data.crm)
      commit('SET_BI', data.bi)
      commit('SET_MANAGE', data.manage)
      commit('SET_OA', data.oa)
      // 获取 管理后台 员工和部门信息
      dispatch('GetUserList')
      dispatch('GetDeptList')
      dispatch('GetUserDepMap')

      return Promise.resolve(data)
    },

    // 获取用户信息
    GetUserInfo({
      commit,
      dispatch
    }) {
      return new Promise((resolve, reject) => {
       
        adminUsersReadAPI().then(res => {
          // // 开启了小程序
          // if (response && response.hasOwnProperty('cardAuth')) {
          //   response.data.cardAuth = response.cardAuth
          // }
          const resData = res.data || {}
          const adminToken = resData.adminToken
          if (resData.initToken && adminToken) {
            cache.updateAxiosCache(adminToken)
          }
          // 邮件信息 走之前的逻辑
          commit('SET_USERINFO', resData)
          dispatch('SystemLogoAndName')
          resolve(res)
        }).catch(error => {
          reject(error)
        })
      })
    },

    // 登出
    LogOut({
      commit
    }) {
      return new Promise((resolve, reject) => {
        logoutAPI().then(() => {
          /** flush 清空localStorage .rm('authKey') 按照key清除 */
          removeAuth({
            clearCookies: true
          })
          resetRouter()
          resolve()
        }).catch(error => {
          removeAuth({
            clearCookies: true
          })
          resetRouter()
          reject(error)
        })
      })
    },

    debounceGetUserList: debounce(3000, ({ dispatch }) => {
      dispatch('GetUserList')
    }),

    // 管理后台员工列表
    GetUserList({
      commit
    }) {
      return new Promise((resolve, reject) => {
        userListAPI({
          pageType: 0
        }).then(res => {
          commit('SET_USERLIST', res.data.list || [])
          resolve()
        }).catch(error => {
          reject(error)
        })
      })
    },

    GetUserDepMap({
      commit
    }) {
      return new Promise((resolve, reject) => {
        adminUserQueryOrgInfoAPI().then(res => {
          const resData = res.data || {}
          commit('SET_USERDEPTOBJ', resData)
          commit('SET_USERDEPTMAP', resData)
          resolve(resData)
        }).catch(error => {
          reject(error)
        })
      })
    },

    debounceGetDeptList: debounce(3000, ({ dispatch }) => {
      dispatch('GetDeptList')
    }),

    // 管理后台部门列表
    GetDeptList({
      commit
    }) {
      return new Promise((resolve, reject) => {
        depListAPI({ type: 'tree' }).then(res => {
          commit('SET_DEPTLIST', res.data || [])
          resolve()
        }).catch(error => {
          reject(error)
        })
      })
    }
  },
  getters: {
    userInfo: state => state.userInfo,
    userList: state => state.userList,
    userDeptObj: state => state.userDeptObj,
    userDeptMap: state => state.userDeptMap,
    searchUserDept: state => state.searchUserDept,
    deptList: state => state.deptList,
    // 权限
    allAuth: state => state.allAuth,
    crm: state => state.crm,
    bi: state => state.bi,
    manage: state => state.manage,
    oa: state => state.oa,
    project: state => state.project,
    call: state => state.call // 模块权限
  }
}

export default user
