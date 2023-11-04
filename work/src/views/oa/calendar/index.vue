<template>
  <div class="main">
    <flexbox class="main-header" justify="space-between">
      <div class="main-header__left">
        <span class="title">日历</span>
      </div>
      <div class="main-header__right">
        <el-button
          type="primary"
          @click="createEvents">新建日程</el-button>
      </div>
    </flexbox>
    <div class="search-bar">
      <wk-user-select
        v-if="showUser"
        ref="wkUserSelect"
        :value="checkedUser && checkedUser.length > 0 ? checkedUser[0].userId : ''"
        :request="subUserListIndex"
        :radio="true"
        :props="{isList: true}"
        v-bind="$attrs"
        class="left-user"
        style="height: auto !important;"
        @change="selectUser">
        <el-input
          slot="reference"
          v-model="filterName"
          :readonly="true"
          style="width: 180px;"
          :class="['type-select--no-border', { 'is-show': $refs.wkUserSelect && $refs.wkUserSelect.visible }]"
          class="type-select">
          <i
            slot="suffix"
            class="el-icon-arrow-up" />
        </el-input>
      </wk-user-select>
      <span v-else class="username">日历</span>
    </div>
    <flexbox v-loading="loading" :style="{height: contentHeight + 'px'}" class="calendar-box">
      <div class="box-left">
        <el-checkbox-group v-model="checkCusList" class="left-scroll">
          <schedule
            ref="schedule"
            v-loading="scheduleLoading"
            :list-data-type="listDataType"
            :active-time="activeTime"
            :calendar-arr="calendarArr"
            @choseDay="gotoPast"
            @changeMonth="changeMonth" />
          <div class="left-main">
            <div class="main-title" @click="showSys = !showSys">
              <i v-if="showSys" class="el-icon-arrow-down" style="margin-right: 0;" />
              <i v-else class="el-icon-arrow-right" style="margin-right: 0;" />
              <span class="main-text">系统类型</span>
            </div>
            <el-collapse-transition>
              <div v-show="showGroup && showSys">
                <el-checkbox
                  v-for="item in sysTypeList"
                  :key="item.typeId"
                  :class="item.class"
                  :label="item.typeId">
                  {{ item.typeName }}
                </el-checkbox>
              </div>
            </el-collapse-transition>
          </div>
          <div class="left-bottom">
            <div class="bottom-title" @click="showCustom = !showCustom">
              <i v-if="showCustom" class="el-icon-arrow-down" style="margin-right: 0;" />
              <i v-else class="el-icon-arrow-right" style="margin-right: 0;" />
              <span class="main-text">自定义类型</span>
            </div>
            <div v-show="showGroup && showCustom">
              <el-checkbox
                v-for="item in customTypeList"
                :key="item.typeId"
                :class="item.class"
                :label="item.typeId">{{ item.typeName }}</el-checkbox>
            </div>
          </div>
        </el-checkbox-group>
        <div class="left-bottom-text">
          <!-- <i class="el-icon-warning" /> -->
          <span class="text-span">自定义类型可在后台配置</span>
        </div>
      </div>
      <div class="box-right">
        <FullCalendar
          ref="fullCalendar"
          :button-text="buttonText"
          :header="{
            left: '',
            center: 'prevYear,prev, title, next,nextYear',
            right: 'today, listDay, timeGridWeek, dayGridMonth'
          }"
          :plugins="calendarPlugins"
          :weekends="calendarWeekends"
          :first-day="firstDay"
          :event-time-format="evnetTime"
          :all-day-slot="true"
          :event-limit="true"
          :events="calendarEvents"
          :event-limit-text="eventLimiTtext"
          :now-indicator="true"
          :display-event-end="false"
          :slot-label-format="{ // 周，日视图时，左侧的显示的时间格式，以下为：00:00，00:30...5:30
            hour: 'numeric',
            minute: '2-digit',
            omitZeroMinute: false,
            meridiem: 'short',
            hour12: false
          }"
          :column-format="{day: 'dddd M/d'}"
          :list-day-format="listDayFormat"
          all-day-text="全天"
          :no-events-message="noEventsMessage"
          locale="zh-cn"
          class="calendar-main"
          week-number-calculation="ISO"
          default-view="dayGridMonth"
          @eventClick="eventClick"
          @datesRender="datesRender"
          @dateClick="handleDateClick"
        />
      </div>
      <create-event
        :show-create="showCreate"
        :select-div="selectDiv"
        :color-list="colorList"
        :cus-check="cusCheck"
        @createSuccess="createSuccess"
        @close="showCreate = false" />
      <!-- 今日需..的详情 -->
      <today-list-detail
        v-if="showTodayDetail"
        :id="eventId"
        :show-today-detail="showTodayDetail"
        :cus-check="cusCheck"
        :today-detail-data="todayDetailData"
        @deleteSuccess="handleSuccess"
        @createSuccess="handleSuccess"
        @close="showTodayDetail = false" />

      <c-r-m-full-screen-detail
        :id="relationID"
        :visible.sync="showFullDetail"
        :crm-type="relationCrmType" />
    </flexbox>

  </div>
</template>

<script>
import FullCalendar from '@fullcalendar/vue'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import timelinePlugin from '@fullcalendar/timeline'
import listPlugin from '@fullcalendar/list'
import Schedule from './Schedule'
import TodayListDetail from './components/TodayListDetail'
import calendarColor from '@/views/admin/other/components/calendarColor.js'
import WkUserSelect from '@/components/NewCom/WkUserSelect'
import {
  canlendarQueryListAPI,
  canlendarQueryTypeListAPI,
  canlendarEventCrmAPI,
  canlendarEventTaskAPI,
  canlendarUpdateTypeAPI
} from '@/api/oa/calendar'
import { systemUserQueryAuthUserList } from '@/api/oa/calendar'
import moment from 'moment'
// import { getMaxIndex } from '@/utils'
import CreateEvent from './components/CreateEvent'
// must manually include stylesheets for each plugin
import '@fullcalendar/core/main.css'
import '@fullcalendar/daygrid/main.css'
import '@fullcalendar/timegrid/main.css'
import '@fullcalendar/list/main.css'
import { convertHexByOpacity } from '@/utils'

export default {
  name: 'Calender',
  components: {
    FullCalendar, // make the <FullCalendar> tag available
    Schedule,
    CreateEvent,
    TodayListDetail,
    WkUserSelect,
    CRMFullScreenDetail: () =>
      import('@/components/CRMFullScreenDetail')
  },
  data() {
    return {
      loading: false,
      eventId: '',
      contentHeight: document.documentElement.clientHeight - 210,
      // 你需要用到的插件
      calendarPlugins: [
        // plugins must be defined in the JS
        dayGridPlugin,
        timeGridPlugin,
        timelinePlugin,
        listPlugin,
        interactionPlugin // needed for dateClick
      ],
      // 是否展示周六周日
      calendarWeekends: true,
      // 默认选中当天
      calendarEvents: [],
      // 存储所有事件，方便筛选
      calendarList: [],
      colorList: calendarColor.colorList,
      // 按钮文字
      buttonText: {
        month: '月',
        week: '周',
        day: '日',
        today: '今天'
      },
      evnetTime: {
        hour: 'numeric',
        minute: '2-digit',
        hour12: false
      },
      noEventsMessage: '暂无日程', // 日历没有数据的提示
      firstDay: 1, // 把每周设置为从周一开始
      scheduleLoading: false,
      calendarArr: [],
      // 首次选中不进行跳转日列表操作
      isFirstToDay: true,
      // 视图当前所展示的时间： 保证月，年切换时，视图更新引起的报错
      currentTime: '',
      // 储存当前活动的时间，保证月份切换时，小日历跟随切换
      currentActiveTime: '',
      checkSysList: [
      ],
      sysCheck: [
        { label: '分配的任务' },
        { label: '需联系的客户' },
        { label: '即将到期的合同' },
        { label: '计划回款' }
      ],
      checkCusList: [],
      dayEventList: [],
      cusCheck: [],
      showGroup: false,
      showSys: true, // 控制展开闭合
      showCustom: true,
      showCreate: false,
      choseTitle: '',
      showTodayDetail: false,
      todayDetailData: {},
      selectDiv: null,
      // 储存显示日期的开始时间和结束时间
      activeTime: {},
      listDataType: '',
      // 今日显示的联系
      todaySchedule: [],
      // 相关的系统联系字段
      needData: {
        leadsTimeList: [],
        customerTimeList: [],
        endContractTimeList: [],
        receiveContractTimeList: [],
        businessTimeList: [],
        dealBusinessTimeList: []
      },
      checkedUser: [],
      // 用于勾选仅剩一个时，暂时保存勾选数据
      copyCheckCusList: [],
      showUser: true,
      showpover: false,
      taskList: [],
      showFullDetail: false,
      relationCrmType: 'task',
      relationID: '',
      selectSysList: [],
      sysTypeId: [],
      firstEnter: true
    }
  },
  computed: {
    subUserListIndex() {
      return systemUserQueryAuthUserList
    },
    showUserPover() {
      return this.$refs.wkUserSelect && this.$refs.wkUserSelect.visible
    },

    // 系统类型和自定义类型
    sysTypeList() {
      return this.cusCheck.filter(item => item.type === 1)
    },

    // 系统类型和自定义类型
    customTypeList() {
      return this.cusCheck.filter(item => item.type === 2)
    },

    // 筛选展示名称
    filterName() {
      return this.checkedUser.length > 0 ? this.checkedUser[0].realname + '的日程' : '我的日程'
    }
  },
  watch: {
    checkCusList: {
      handler(val) {
        if (val.length === 1) {
          this.copyCheckCusList = val
          this.customFifter(val)
        } else if (val.length === 0) {
          if (this.copyCheckCusList.length === 1) {
            this.checkCusList = this.copyCheckCusList
            this.$message.error('请至少选中一个类型')
          }
        } else {
          this.customFifter(val)
        }
      },
      deep: true,
      immediate: true
    }

  },
  mounted() {
    window.onresize = () => {
      this.contentHeight = document.documentElement.clientHeight - 210
    }
    this.showUserSelect()
    this.addBus()
  },

  destroyed() {
    this.$bus.off('handleSuccess')
  },

  /**
   *  路由更新
   */
  beforeRouteLeave(to, from, next) {
    // this.updateList()
    next()
  },

  methods: {

    /**
     * 添加监听事件
     */
    addBus() {
      this.$bus.on('handleSuccess', () => {
        this.getCusCheck()
      })
    },

    /**
     * 查询列表
     */
    getList() {
      this.loading = true
      this.activeTime.typeIds = null
      this.$refs.schedule.getDateList(this.activeTime)
      canlendarQueryListAPI(this.activeTime).then(res => {
        this.calendarEvents = []
        const resData = res.data || []
        resData.forEach(item => {
          item.startTime = moment(parseInt(item.startTime)).format('YYYY-MM-DD HH:mm:ss')
          item.endTime = moment(parseInt(item.endTime)).format('YYYY-MM-DD HH:mm:ss')
        })
        this.dayEventList = resData
        this.handleShowData()
        this.loading = false
      }).catch(() => {
        this.loading = false
      })
    },

    /**
     * 查询自定义日程类型
     */
    getCusCheck() {
      this.loading = true
      this.checkSysList = []
      this.calendarEvents = []
      this.showGroup = false
      this.sysTypeId = []

      const checkCusList = []
      const crmTypeObj = {
        '1': 'task',
        '2': 'customer',
        '3': 'contract',
        '4': 'receiveContract', // 计划回款
        '5': 'leads',
        '6': 'business',
        '7': 'dealBusiness' // 预计成交商机
      }
      canlendarQueryTypeListAPI({
        userId: this.activeTime.userId
      }).then(res => {
        const cusCheck = res.data || []
        this.todaySchedule = []
        cusCheck.forEach(item => {
          if (item.select) {
            checkCusList.push(item.typeId)
          }

          // type 1 为crmTypeObj包含的事件类型
          if (item.type === 1) {
            this.sysTypeId.push(
              { typeId: item.typeId, name: item.typeName, crmType: crmTypeObj[item.color] }
            )

            if (item.color === '1') {
              item.class = 'color_8'
            } else if (item.color === '2') {
              item.class = 'color_1'
            } else if (item.color === '3') {
              item.class = 'color_5'
            } else if (item.color === '4') {
              item.class = 'color_11'
            } else if (item.color === '5') {
              item.class = 'color_3'
            } else if (item.color === '6') {
              item.class = 'color_6'
            } else if (item.color === '7') {
              item.class = 'color_7'
            }
          } else {
            this.colorList.forEach((color, index) => {
              if (item.color === color) {
                item.class = `color_${index + 1}`
                item.color = color
              }
            })
          }
        })

        if (this.checkCusList.length === 0) {
          this.checkCusList = checkCusList
        }

        this.activeTime.typeIds = this.checkCusList
        this.cusCheck = cusCheck
        this.getTodayTypeList()
      }).catch(() => {
        this.loading = false
      })
    },

    /**
     * 编辑左侧多选框列表
     */
    updateList() {
      // 只用于记录，去除loading效果，保证前端无痕保存
      this.activeTime.typeIds = this.checkCusList
      if (this.checkCusList.length === 0) {
        return
      }
      canlendarUpdateTypeAPI({ typeIds: this.checkCusList, userId: this.activeTime.userId }).then(res => {
      }).catch(() => {
      })
    },

    /**
     * 格式化日列表左侧的时间
     */
    listDayFormat(data) {
      const timestamp = new Date(data.date.marker).getTime()
      const dateTime = moment(timestamp).format('ll')
      const week = moment(timestamp).format('dddd').replace('星期', '周')
      const dataValue = week + '  ' + dateTime
      return dataValue
    },

    /**
     * 周点击
     */
    toggleWeekends() {
      this.calendarWeekends = !this.calendarWeekends // update a property
    },

    /**
     * 跳转到某天
     */
    gotoPast(date, boolean) {
      // 获取日历对象
      if (this.isFirstToDay) {
        this.isFirstToDay = false
        return
      }
      const timestamp = new Date(date).getTime()
      const newDate = moment(timestamp).format('YYYY-MM-DD')
      this.selectDiv = newDate
      const calendarApi = this.$refs.fullCalendar.getApi() // from the ref="..."
      if (calendarApi) {
        if (!boolean) {
          calendarApi.changeView('listDay')
        }
        calendarApi.gotoDate(newDate)
      }
    },

    /**
     * 天点击
     */

    handleDateClick(arg) {
      if (this.selectDiv === arg.dateStr) {
        this.showCreate = true
      } else {
        this.selectDiv = arg.dateStr
        // 注开会生成提示文字
        // const div = document.createElement('div')
        // div.style.position = 'absolute'
        // div.style.left = arg.jsEvent.clientX + 20 + 'px'
        // div.style.top = arg.jsEvent.clientY - 20 + 'px'
        // div.style.border = '1px solid #999'
        // div.style.backgroundColor = '#999'
        // div.style.padding = '10px'
        // div.style.fontSize = '12px'
        // div.style.zIndex = getMaxIndex()
        // div.style.boxShadow = ''
        // div.innerHTML = '双击新建'
        // div.style.color = '#333'
        // div.className = 'create__event?'
        // if (document.getElementsByClassName('create__event?')[0]) {
        //   const oldDiv = document.getElementsByClassName('create__event?')[0]
        //   document.documentElement.removeChild(oldDiv)
        // }
        // document.documentElement.appendChild(div)
        // console.log(arg, 'arg')
      }
      const td = document.getElementsByClassName('select-day')
      if (td && td.length) {
        td[0].classList.remove('select-day')
      }
      arg.dayEl.classList.add('select-day')
      // if (arg.dateStr) {
      //   this.$refs.schedule.selectDay(arg.dateStr, true)
      // }
    },

    /**
     * 展示更多的文字
     */
    eventLimiTtext(data) {
      return `剩余${data}条`
    },

    /**
     *  日期渲染时，触发的事件，默认传入info,一个包含view和el的对象
     */
    datesRender(info) {
      // 只有单日列表无数据时，才创建img
      if (info.view.type === 'listDay') {
        if (info.el.textContent === this.noEventsMessage) {
          const img = document.createElement('img')
          // 写id保证只创建一次
          img.id = 'emityImg'
          img.src = require('@/assets/img/empty.png')
          // 保证一定是暂无日程而不是有些事件叫做暂无日程
          const div = document.getElementsByClassName('fc-list-empty-wrap1')[0]
          if (div) {
            div.insertBefore(img, div.children[0])
          }
        }
      } else if (info.view.type === 'dayGridMonth') {
        if (this.currentTime === info.view.title) {
          if (this.selectDiv && document.querySelector(`td[data-date="${this.selectDiv}"]`)) {
          // 保证切换模式时，关联的日期被选中
            document.querySelector(`td[data-date="${this.selectDiv}"]`).classList.add('select-day')
          }
        } else {
          // this.$refs.schedule.selectMouth(info.view.activeStart)
          this.currentTime = info.view.title
        }
        if (this.activeTime.startTime !== new Date(info.view.activeStart).getTime()) {
          this.activeTime.startTime = new Date(info.view.activeStart).getTime()
          this.activeTime.endTime = new Date(info.view.activeEnd).getTime()
          // 优化 只有月切换才会刷新列表
          const leadTime = this.activeTime.endTime - this.activeTime.startTime
          if (leadTime > 24 * 60 * 60 * 1000) {
            this.getCusCheck()
          }
        }
      } else if (info.view.type === 'timeGridWeek') {
        // 周逻辑处理
      }
      this.listDataType = info.view.type
    },

    /**
     * 点击事件
     */
    eventClick(data) {
      if (data.event.extendedProps && data.event.extendedProps.typeId == -2) {
        this.relationID = data.event.id
        this.relationCrmType = 'task'
        setTimeout(() => {
          this.showFullDetail = true
        }, 200)
        return
      }
      this.eventId = data.event.id
      this.todayDetailData = {
        startTime: data.event.start || '',
        endTime: data.event.end || data.event.start,
        id: data.event.id,
        title: data.event.title,
        userId: this.activeTime.userId,
        groupId: data.event.groupId,
        backgroundColor: data.event.textColor
      }
      // 不是组件自带的字段都会被插入到entendedProps里面
      if (data.event.extendedProps) {
        this.todayDetailData.name = data.event.extendedProps.name
        this.todayDetailData.createTime = data.event.extendedProps.createTime
        this.todayDetailData.headTitle = data.event.title
        this.todayDetailData.crmType = data.event.extendedProps.crmType
        this.todayDetailData.typeId = data.event.extendedProps.typeId || 3
      }
      this.showTodayDetail = true
    },

    /**
     * 选中某天
     */
    clickDay(data) {
      console.log(data)
    },

    /**
     * 选中某月
     */
    changeMonth(data, boolean) {
      this.gotoPast(data, true)
    },

    /**
     * 筛选
     */
    customFifter(data) {
      this.updateEvent(this.checkCusList)
    },

    /**
     * 筛选完成后处理的函数
     */
    updateEvent(data) {
      const list = []
      this.calendarList.forEach(item => {
        data.forEach(typeId => {
          if (typeId === item.groupId) {
            list.push(item)
          }
        })
      })
      this.updateList()
      this.calendarEvents = list
    },

    /**
     * 新建日程
     */
    createEvents() {
      this.selectDiv = ''
      this.showCreate = true
    },

    /**
     * 新建日程
     */
    handleSure(data, color) {
      //  https://fullcalendar.io/docs/v4/event-object evnet obj 说明
      this.calendarEvents.push({
        title: data.title,
        crmType: data.crmType,
        start: data.startTime,
        id: data.eventId,
        color: color,
        textColor: color,
        backgroundColor: convertHexByOpacity(color, 0.1),
        typeId: data.groupId,
        groupId: data.typeId,
        end: data.endTime
      })
    },

    /**
     * 新建或者编辑成功的回调
     */
    createSuccess() {
      this.showCreate = false
      this.getCusCheck()
    },

    /**
     * 删除/编辑成功的回调
     */
    handleSuccess() {
      this.showTodayDetail = false
      this.getCusCheck()
    },

    /**
     * 选择员工
     */
    selectUser(_, dataArray) {
      this.checkedUser = dataArray
      this.copyCheckCusList = []
      if (dataArray.length) {
        this.activeTime.userId = dataArray.map(item => item.userId).join(',')
      } else {
        this.activeTime.userId = ''
        return
      }
      this.getCusCheck()
    },

    /**
     * 展示员工选框
     */
    showUserSelect() {
      systemUserQueryAuthUserList().then(res => {
        if (res.data.length === 0) {
          this.showUser = false
        } else {
          this.showUser = true
        }
      }).catch(() => {})
    },

    /**
     * 获取今日需要展示的日程
     */
    getTodayTypeList() {
      this.loading = true
      const params = {
        startTime: this.activeTime.startTime,
        endTime: this.activeTime.endTime,
        userId: this.activeTime.userId
      }
      canlendarEventCrmAPI(params).then(res => {
        const resData = res.data || {}
        this.needData = {
          leadsTimeList: resData.leadsTimeList || [],
          customerTimeList: resData.customerTimeList || [],
          endContractTimeList: resData.endContractTimeList || [],
          receiveContractTimeList: resData.receiveContractTimeList || [],
          businessTimeList: resData.businessTimeList || [],
          dealBusinessTimeList: resData.dealBusinessTimeList || []
        }
        this.todaySchedule = this.handleData(this.cusCheck)
        if (this.selectSysList.includes('1')) {
          this.getTask()
        } else {
          this.taskList = []
          this.getList()
        }
      }).catch(() => {})
    },

    /**
     * 获取分配给我的任务
     */
    getTask() {
      this.taskList = []
      const params = {
        startTime: this.activeTime.startTime,
        endTime: this.activeTime.endTime,
        userId: this.activeTime.userId
      }
      canlendarEventTaskAPI(params).then(res => {
        const resData = res.data || []
        const color = '#0052CC'
        // 任务开始和结束没有时分秒，所以结束时间 需增加 23:59:59
        this.taskList = resData.map(item => {
          return {
            title: item.name,
            startTime: `${moment(parseInt(item.startTime)).format('YYYY-MM-DD')} 00:00:00`,
            id: item.taskId,
            eventId: item.taskId,
            color: color,
            textColor: color,
            backgroundColor: convertHexByOpacity(color, 0.1),
            groupId: -2,
            typeId: this.sysTypeId[0].typeId,
            endTime: `${moment(parseInt(item.endTime)).format('YYYY-MM-DD')} 23:59:59`
          }
        })
        this.getList()
      }).catch(() => {})
    },

    /**
     * 将需要展示的日程拼接入日程展示的数组
     * color 1 分配给我的任务 2 需联系的客户 3 即将到期的合同 4 需要回款的合同
     */
    handleData(list) {
      this.selectSysList = []
      const dataList = []
      list.forEach(item => {
        if (item.type === 1) {
          this.selectSysList.push(item.color)
        }
      })

      const leadsObj = this.sysTypeId.find(item => item.crmType === 'leads') || {}
      const leadsColor = '#DE350B'
      //
      this.needData.leadsTimeList.forEach(date => {
        dataList.push({
          title: '需联系的线索',
          startTime: `${date} 00:00:00`,
          eventId: -1,
          color: leadsColor,
          textColor: leadsColor,
          backgroundColor: convertHexByOpacity(leadsColor, 0.1),
          crmType: leadsObj.crmType,
          typeId: leadsObj.typeId,
          groupId: leadsObj.typeId,
          endTime: `${date} 23:59:59`
        })
      })

      const customerObj = this.sysTypeId.find(item => item.crmType === 'customer') || {}
      const customerColor = '#0052CC'
      this.needData.customerTimeList.forEach(date => {
        dataList.push({
          title: '需联系的客户',
          startTime: `${date} 00:00:00`,
          eventId: -1,
          color: customerColor,
          textColor: customerColor,
          backgroundColor: convertHexByOpacity(customerColor, 0.1),
          crmType: customerObj.crmType,
          typeId: customerObj.typeId,
          groupId: customerObj.typeId,
          endTime: `${date} 23:59:59`
        })
      })

      const businessObj = this.sysTypeId.find(item => item.crmType === 'business') || {}
      const businessColor = '#FF991F'
      this.needData.businessTimeList.forEach(date => {
        dataList.push({
          title: '需联系的商机',
          startTime: `${date} 00:00:00`,
          eventId: -1,
          color: businessColor,
          textColor: businessColor,
          backgroundColor: convertHexByOpacity(businessColor, 0.1),
          crmType: businessObj.crmType,
          typeId: businessObj.typeId,
          groupId: businessObj.typeId,
          endTime: `${date} 23:59:59`
        })
      })

      const dealBusinessObj = this.sysTypeId.find(item => item.crmType === 'dealBusiness') || {}
      const dealBusinessColor = '#091E42'
      this.needData.dealBusinessTimeList.forEach(date => {
        dataList.push({
          title: '预计成交的商机',
          startTime: `${date} 00:00:00`,
          eventId: -1,
          color: dealBusinessColor,
          textColor: dealBusinessColor,
          backgroundColor: convertHexByOpacity(dealBusinessColor, 0.1),
          crmType: dealBusinessObj.crmType,
          typeId: dealBusinessObj.typeId,
          groupId: dealBusinessObj.typeId,
          endTime: `${date} 23:59:59`
        })
      })

      const endContractObj = this.sysTypeId.find(item => item.crmType === 'contract') || {}
      const endContractColor = '#00875A'
      this.needData.endContractTimeList.forEach(date => {
        dataList.push({
          title: '即将到期的合同',
          startTime: `${date} 00:00:00`,
          eventId: -1,
          color: endContractColor,
          textColor: endContractColor,
          backgroundColor: convertHexByOpacity(endContractColor, 0.1),
          crmType: endContractObj.crmType,
          typeId: endContractObj.typeId,
          groupId: endContractObj.typeId,
          endTime: `${date} 23:59:59`
        })
      })

      const receiveContractObj = this.sysTypeId.find(item => item.crmType === 'receiveContract') || {}
      const receiveContractColor = '#5243AA'
      this.needData.receiveContractTimeList.forEach(date => {
        dataList.push({
          title: '计划回款',
          startTime: `${date} 00:00:00`,
          eventId: -1,
          color: receiveContractColor,
          textColor: receiveContractColor,
          backgroundColor: convertHexByOpacity(receiveContractColor, 0.1),
          crmType: receiveContractObj.crmType,
          typeId: receiveContractObj.typeId,
          groupId: receiveContractObj.typeId,
          endTime: `${date} 23:59:59`
        })
      })

      return dataList
    },

    /**
     * 拼接展示数据
     */
    handleShowData() {
      const list = [
        ...(this.dayEventList || []), ...(this.todaySchedule || []), ...(this.taskList || [])
      ]

      list.forEach(item => {
        this.handleSure(item, item.color)
      })

      this.calendarList = this.calendarEvents
      this.showGroup = true
      this.customFifter(this.checkCusList)
    }

  }
}
</script>

<style lang="scss" scoped>
@import "./style/color.scss";
@import "./style/fullCalendar.scss";

.main {
  position: relative;
  padding: 0 40px;

  &-header {
    .title {
      font-size: $--font-size-xxlarge;
      font-weight: $--font-weight-primary;
      color: $--color-text-primary;
    }
  }
}

.calendar-box {
  position: relative;
  min-width: 1200px;
  margin-top: 16px;
  overflow-x: auto;
  overflow-y: hidden;
  font-size: 14px;
}

.search-bar {
  margin-top: 30px;

  .wk-user-select {
    width: 180px;
  }

  /deep/ .el-input {
    .el-input__suffix {
      top: 8px;
    }
  }
}

.box-left {
  flex-shrink: 0;
  width: 280px;
  height: 100%;
  margin-right: 20px;
  background-color: #fff;
  border: $--border-base;
  border-radius: $--border-radius-base;

  .left-scroll {
    height: calc(100% - 50px);
    overflow-y: auto;
  }

  .left-bottom-text {
    width: 240px;
    height: 20px;
    margin-top: 20px;
    font-size: 12px;
    color: $--color-n50;
    text-align: center;

    // .text-span{
    //   display: inline-block;
    // }
    // i{
    //   display: inline-block;
    //   vertical-align: top;
    //   margin-left: 10px;
    // }
  }

  .left-main {
    width: 100%;
    padding: 0;
    color: $--color-text-regular;

    // border-bottom: 1px solid rgb(239,239,239);
    // border-top: 1px solid rgb(239,239,239);

    .main-title {
      width: 100%;
      padding: $--interval-base;
      margin-top: $--interval-base;
      font-size: 14px;
      color: $--color-text-secondary;
      cursor: pointer;

      .el-icon-arrow-down {
        margin-right: $--interval-base;
        color: $--color-black;
      }
    }
  }

  .schedule-calendar {
    padding: $--interval-base $--interval-base 0;
  }

  .left-bottom {
    width: 100%;
    padding: 0;

    .bottom-title {
      padding: $--interval-base;
      font-size: 14px;
      color: $--color-text-secondary;
      cursor: pointer;

      .el-icon-arrow-down {
        margin-right: $--interval-base;
        color: $--color-black;
      }
    }
  }

  /deep/.el-checkbox {
    display: block;
    height: 40px;
    padding-left: 15px;
    line-height: 40px;

    .el-checkbox__label {
      padding-left: 15px;
    }
  }

  /deep/.el-checkbox:hover {
    width: 100%;
    background-color: #f6f8fa;
  }
}

.box-right {
  width: 100%;
  height: 100%;
  padding: 10px 0 0;
  overflow: hidden;
  background-color: #fff;
  border: $--border-base;
  border-bottom: none;
  border-radius: $--border-radius-base;
}

.user-box {
  display: flex;
  width: unset;
  height: 36px;
  margin-right: 10px;
  cursor: pointer;
  background-color: white;

  .user-icon {
    width: 28px;
    height: 28px;
    line-height: 28px;
    color: white;
    text-align: center;
    background: $--color-primary;
    border-radius: 50%;
  }

  .username {
    display: inline-block;
    margin-right: 3px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

/deep/.select-day {
  background-color: #4983ef !important;
  opacity: 0.04 !important;
}

.el-icon-arrow-up {
  margin-right: 10px;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.3s;
  transform: rotate(180deg);
}

.el-icon-arrow-up.is-reverse {
  transform: rotate(0deg);
}

/deep/ .type-select {
  .el-input__inner {
    font-weight: $--font-weight-primary;
  }
}

/deep/ .type-select--no-border {
  .el-input__inner {
    background: $--button-default-background-color;
    border: none;
  }

  &.is-show {
    .el-input__inner {
      color: $--color-white;
      background-color: $--button-default-selected-bg-color !important;
      border-color: $--button-default-selected-bg-color;

      &::placeholder {
        color: $--color-white;
      }
    }

    .el-icon-arrow-up {
      color: $--color-white;
    }
  }
}
</style>
