import axios from 'axios'
import Lockr from 'lockr'
import moment from 'moment'
import { Message } from 'element-ui'
import { debounce } from 'throttle-debounce'

/**
 * 软乎 cmd
 * 2001：拨打电话
 * 2002：挂断电话
 * 2003：接通电话
 * 2004：通话结束
 * 2005：拨打或者挂断 成功
 * 2006：拨打或者 挂断失败
 */
class MyWs {
  webSokets
  callinTime
  timer
  callState
  devicename
  callInfo // 呼叫状态用于限制判断
  currentCCID // 当前使用的电话卡
  open(f, error_func) {
    const callData = Lockr.get('wkCallData')
    // hisUse 0 是默认硬呼单卡 1 是软乎 2是硬呼多卡
    if (callData && callData.hisUse == 1) {
      const token = axios.defaults.headers['Admin-Token']
      this.hisUse = 1
      const socketUrl = process.env.VUE_APP_CALL_SOCKET
      this.webSokets = new WebSocket(socketUrl + token) // ws://192.168.1.116:22150?token=
    } else if (callData && callData.hisUse == 2) {
      this.hisUse = 2
      this.webSokets = new WebSocket('ws://127.0.0.1:8555/api')
    } else {
      this.hisUse = 0
      this.webSokets = new WebSocket('ws://127.0.0.1:9501')
    }
    this.callinTime = '00:00:00'
    var that = this
    this.webSokets.onopen = () => {
      f()
      that.startTimePiece()
    }
    this.webSokets.onerror = (e) => {
      error_func(e)
    }
    this.webSokets.onclose = () => {
      that.close()
      clearInterval(this.timer) // 清除心跳包
    }
  }

  // hisUse 0 是默认硬呼 1 是软乎
  getHisUse() {
    const callData = Lockr.get('wkCallData')
    return callData ? callData.hisUse : 0
  }

  close() {
    this.webSokets.close()
    clearInterval(this.timer)
  }

  message(f) {
    this.webSokets.onmessage = (e) => {
      const data = JSON.parse(e.data)
      const callData = Lockr.get('wkCallData')
      // hisUse 0 是默认单卡硬呼 1 是软乎 2是多卡硬呼
      if (callData && callData.hisUse == 1) {
        if (data.cmd === 2004 || data.cmd === 2006) {
          this.callState = 1
        } else if (data.cmd === 2011 && data.status === 'IDLE') {
          this.callState = 1
        } else {
          this.callState = 2
        }
      } else if (callData && callData.hisUse == 2) {
        if (data.type == 'RealTimeState') {
          if (data.dynamicdata.realtimestate === 'hangup' || data.dynamicdata.realtimestate === 'idle') {
            this.callState = 1
          } else if (data.dynamicdata.realtimestate === 'outgoing' ||
            data.dynamicdata.realtimestate === 'ringback' ||
            data.dynamicdata.realtimestate === 'incoming' ||
            data.dynamicdata.realtimestate === 'outconnected' ||
            data.dynamicdata.realtimestate === 'inconnected'
          ) {
            this.callState = 2
          }
        } else if (data.type == 'CallRecord') {
          this.callState = 1
        } else if (data.type == 'DeviceConnectedState') {
          this.callState = 2
        } else if (data.type == 'CommandResponse' && data.dynamicdata && data.dynamicdata.state === 'CALL_STATE_IDLE') {
          this.callState = 1
        }
      } else {
        if (data.event === 'CallState') {
          this.callState = data.data.callState
        } else if (data.event === 'OutGoing' ||
        data.event === 'RingBack' ||
        data.event === 'InComing' ||
        data.event === 'Answer') {
          this.callState = 2
        } else if (data.event === 'HangUp' ||
        data.event === 'Idle') {
          this.callState = 1
        }
      }

      if (callData && callData.hisUse == 2) {
        if (data.type == 'InstructionTrace') {
          f(data)
        } else if (data.type == 'RealTimeState') {
          f(data)
          const limitRealtimestate = data.dynamicdata.realtimestate
          this.callInfo = this.callInfo || {}
          if (limitRealtimestate === 'outgoing') { // 设备呼出
            this.callInfo = {
              isOut: true,
              connected: false,
              isHangup: false
            }
          } else if (limitRealtimestate === 'incoming') { // 来电呼入
            this.callInfo = {
              isOut: false,
              connected: false,
              isHangup: false
            }
          } else if (limitRealtimestate === 'outconnected' ||
          limitRealtimestate === 'inconnected') { // 呼出接通 呼入接通
            this.callInfo.connected = true
          } else if (limitRealtimestate === 'hangup') { // 挂断电话
            this.callInfo.isHangup = true
          }

          // 限制逻辑 呼出 接通了 并且 挂断时 执行
          if (this.callInfo.isOut && this.callInfo.connected && this.callInfo.isHangup) {
            setTimeout(() => {
              this.OnHandleLimit()
            }, 2000)
          }
        } else {
          if (data.data != null && data.data.invoke_command) {
            if (data.data.invoke_command.toLowerCase() == 'getconnectedstate_multi') { // 获取已连接设备
              // 解析已连接设备序列号
              const devicelist = data.dynamicdata.devicelist
              if (devicelist != '') {
                this.devicename = devicelist.split(',')[0]
                this.GetCallState()
                this.OnGetCCID() // 获得电话卡标识
              }
            } else if (data.data.invoke_command.toLowerCase() == 'getccid_multi') { // 获取ccid电话卡标识
              this.currentCCID = data.dynamicdata.ccid
            }
          }

          // 处理换卡结果
          if (data.type === 'CommandResponse') {
            const dataResult = data.data || {}
            if (dataResult.invoke_command && dataResult.invoke_command.toLowerCase() == 'cbswitchnext_multi') {
              if (dataResult.state) {
                Message({
                  message: '换卡成功',
                  type: 'success'
                })
              } else {
                Message({
                  message: '换卡失败',
                  type: 'error'
                })
              }
            }
          }
          f(data)
        }
      } else {
        f(data)
      }
    }
  }

  send(data) {
    this.webSokets.send(JSON.stringify(data))
  }

  // 清除计时器
  clearWebSoketsInterval() {
    clearInterval(this.timer)
  }
  // 重启计时器,保持连接
  // 计数器
  startTimePiece() {
    this.timer = setInterval(() => {
      const callData = Lockr.get('wkCallData')
      // hisUse 0 是默认硬呼单卡 1 是软乎 2是硬呼多卡
      if (callData && callData.hisUse == 1) {
        this.send({
          cmd: 1000
        })
      } else if (callData && callData.hisUse == 2) {
        this.send('HeartBeatData')
      } else {
        this.send({
          event: 'HeartBeat'
        })
      }
    }, 10000)
  }
  addFix(num, length) {
    return ('' + num).length < length ? ((new Array(length + 1)).join('0') + num).slice(-length) : '' + num
  }
  // 拨号
  OnDailout(phoneNumber) {
    if (this.callState === 1) {
      const callData = Lockr.get('wkCallData')
      // hisUse 0 是默认硬呼单卡 1 是软乎 2是硬呼多卡
      if (callData && callData.hisUse == 1) {
        this.send({
          cmd: 2001, // 2001：拨打电话
          phone: String(phoneNumber)
        })
      } else if (callData && callData.hisUse == 2) {
        this.send({
          command: 'Dial_Multi',
          arguments: { 'phone': String(phoneNumber), 'devicename': this.devicename }
        })
      } else {
        this.send({
          event: 'Dial',
          number: String(phoneNumber)
        })
        return true
      }
    } else {
      return false
    }
  }
  // 判断话机状态是否能拨打
  CheckCallState() {
    const result = this.callState === 1
    if (!result) {
      Message({
        message: '请先挂断电话/查看电话宝是否连接正常',
        duration: 1500,
        type: 'error'
      })
    }
    return result
  }
  // 接听
  OnAnswer() {
    const callData = Lockr.get('wkCallData')
    // hisUse 0 是默认硬呼单卡 1 是软乎 2是硬呼多卡
    if (callData && callData.hisUse == 1) {
      // 暂无主动接通，只能通过软乎接通
    } else if (callData && callData.hisUse == 2) {
      this.send({
        command: 'Answer_Multi',
        arguments: { 'devicename': this.devicename }
      })
    } else {
      this.send({
        event: 'Answer'
      })
    }
  }
  // 挂断
  OnHungUp() {
    const callData = Lockr.get('wkCallData')
    // hisUse 0 是默认硬呼单卡 1 是软乎 2是硬呼多卡
    if (callData && callData.hisUse == 1) {
      this.send({
        cmd: 2002 // 2002：挂断电话
      })
    } else if (callData && callData.hisUse == 2) {
      this.send({
        command: 'HangUp_Multi',
        arguments: { 'devicename': this.devicename }
      })
    } else {
      this.send({
        event: 'HangUp'
      })
    }
  }
  // 获取通话状态
  OnGetCallState() {
    const callData = Lockr.get('wkCallData')
    // hisUse 0 是默认单卡硬呼 1 是软乎 2是多卡硬呼
    if (callData && callData.hisUse == 1) {
      this.send({
        cmd: 2010 // 主动获取话机状态：2010
      })
    } else if (callData && callData.hisUse == 2) {
      this.send({
        command: 'OpenDevice_Multi'
      })
      setTimeout(this.OnGetConnectedState(), 3000)
    } else {
      this.send({
        event: 'GetCallState'
      })
    }
  }
  // 获取通话状态
  GetCallState() {
    this.send({
      command: 'GetCallState_Multi',
      arguments: { 'devicename': this.devicename }
    })
  }
  // 上传
  OnUploadFile(url, session_id) {
    const callData = Lockr.get('wkCallData')
    // hisUse 0 是默认单卡硬呼 1 是软乎 2是多卡硬呼
    if (callData && callData.hisUse == 2) {
      this.send({
        command: 'UploadFile',
        arguments: { 'url': url, 'file': session_id }
      })
    } else {
      this.send({
        event: 'UploadRecord',
        url,
        session_id
      })
    }
  }

  /**
 * 多卡逻辑
  *
 */
  // 获取设备连接状态
  OnGetConnectedState() {
    this.send({
      command: 'GetConnectedState_Multi'
    })
    // 隐藏客户端客户端菜单，设置空则不隐藏   //主页0，号码1，常规设置2，设备管理3，系统设置4，AI设置5，联系人6，短信管理7通话详情8，报表9，自助修复10，帮助11
    this.send({ 'command': 'hidemenu', 'arguments': { 'content': '' }})
  }

  // 获取ccid
  OnGetCCID() {
    this.send({
      command: 'GetCCID_Multi',
      arguments: { 'devicename': this.devicename }})
  }

  // 换下张卡
  OnSwitchNext() {
    this.send({
      command: 'CBSwitchNext_Multi',
      arguments: { 'devicename': this.devicename }})
  }

  // 执行限制换卡逻辑
  OnHandleLimit = debounce(2000, false, () => {
    const limitSet = Lockr.get('wkCallLimitSet')
    if (limitSet && limitSet.open && this.currentCCID) {
      const limitNum = limitSet.num
      const timeKey = moment().format('YYYY-MM-DD')
      let limitData = Lockr.get('wkCallLimitData')

      const defalutCCIDData = {}
      defalutCCIDData[this.currentCCID] = 1

      if (limitData) {
        const todyData = limitData[timeKey]
        if (todyData && todyData.hasOwnProperty(this.currentCCID)) {
          todyData[this.currentCCID]++
        } else {
          limitData = {}
          limitData[timeKey] = defalutCCIDData
        }
      } else {
        limitData = {}
        limitData[timeKey] = defalutCCIDData
      }

      console.log('wkCallLimitData---', limitData)
      Lockr.set('wkCallLimitData', limitData)

      // 单卡数量大于等于设置 进行切换操作
      if (limitData) {
        const currentNum = limitData[timeKey][this.currentCCID]
        if (currentNum >= limitNum) {
          this.OnSwitchNext()
        }
      }
    }
  })

  // 开始录音
  OnStartRecord() {
    this.send({
      command: 'StartRecord_Multi',
      arguments: { 'devicename': this.devicename }})
  }
  // 结束录音
  OnStopRecord() {
    this.send({
      command: 'StopRecord_Multi',
      arguments: { 'devicename': this.devicename, 'isconverttomp3': 'true' }})
  }
}

export default new MyWs()
