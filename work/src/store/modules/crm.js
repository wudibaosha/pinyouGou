import {
  crmMessagNumAPI
} from '@/api/crm/message'

/**
 * 消息记录
 */
const app = {
  state: {
    // 待办事项消息
    messageNum: {},
    showRing: true,
    showTimer: false,
    showCallOut: false,
    isCall: false, // 呼叫中心权限
    callinTime: '00:00:00'
  },

  mutations: {
    /**
     * 更改待办事项
     */
    SET_MESSAGENUM: (state, messageNum) => {
      let totalNum = 0
      for (var key in messageNum) {
        if (key != 'totalNum') {
          totalNum += (messageNum[key] || 0)
        }
      }
      messageNum.totalNum = totalNum
      state.messageNum = messageNum
    },
    /**
     * 通话计时
     */
    CALL_STATUS: (state, callinTime) => {
      state.callinTime = callinTime
    },
    /**
     * 振铃中
     */
    SHOW_RING: (state, showRing) => {
      state.showRing = showRing
    },
    /**
     * 是否展示通话
     */
    SHOW_TIMER: (state, showTimer) => {
      state.showTimer = showTimer
    },
    /**
     * 展示来电弹框
     */
    SHOW_CALL_OUT: (state, showCallOut) => {
      state.showCallOut = showCallOut
    },
    /**
     * 呼叫中心权限
     */
    GET_IS_CALL: (state, isCall) => {
      state.isCall = isCall
    }
  },

  actions: {
    // 登录
    GetMessageNum({
      state,
      commit
    }) {
      return new Promise((resolve, reject) => {
        crmMessagNumAPI()
          .then(response => {
            commit('SET_MESSAGENUM', response.data)
            // 待办事项 增加数量提示， 因合并入系统消息，暂时去掉
            // commit('SET_CRMROUTERSNUM', state.messageNum.totalNum)
            resolve(response)
          })
          .catch(error => {
            reject(error)
          })
      })
    }

  },

  getters: {
    // 权限
    isCall: state => state.isCall, // 当前人权限
    // 客户管理信息
    messageNum: state => state.messageNum
  }
}

export default app
