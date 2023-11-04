<template>
  <div
    :key="scrollKey"
    v-infinite-scroll="getList"
    class="main"
    infinite-scroll-distance="100"
    infinite-scroll-disabled="scrollDisabled">
    <div>
      <div class="work-log">
        <flexbox class="main-header" justify="space-between">
          <div class="main-label">{{ logTypeLabel }}</div>
          <div>
            <el-button
              v-if="showAdd"
              style="margin-left: 8px;"
              type="primary"
              @click="addLogClick">新建日志</el-button>
          </div>
        </flexbox>
        <div class="card is-intro">
          <div>
            <flexbox class="hello-card">
              <xr-avatar
                :name="userInfo.realname"
                :size="50"
                :src="userInfo.img"
                class="user-img" />

              <div class="greeting">
                <div class="hello">
                  {{ headData.timeLabel }}，{{ nickName }}
                  <span class="status">
                    <span :class="userDoneStatus.icon" class="icon wk" />
                    <span>{{ userDoneStatus.label }}</span>
                  </span>
                </div>
                <div v-if="headData && headData.timeRemind" class="text">
                  {{ headData.timeRemind }}
                </div>
              </div>
            </flexbox>
            <report-menu
              :list="reportList"
              @select="reportSelect" />
          </div>

          <div class="done-info">
            <div class="count">{{ headData.allNum }}</div>
            <div class="label">本月已完成日志</div>
          </div>
        </div>

        <create-log
          v-if="(showAdd && logAddShow) || showNewDialog"
          ref="createLog"
          :form-data="formData"
          :img-file-list="imgFileList"
          :accessory-file-list="accessoryFileList"
          @close="addLogClose"
          @update="addLogSuccess"
          @completeSelect="completeSelect" />

        <flexbox class="filter-control card">
          <wk-user-dep-dialog-select
            v-if="showUserSelect"
            :user-value.sync="filterForm.createUserId"
            :dep-value.sync="filterForm.deptIds"
            collapse-tags
            placeholder="选择人员或部门"
            @change="userDepChange"
          />
          <time-type-select
            :width="190"
            :options="timeOptions"
            :default-type="timeSelect"
            @change="timeTypeChange" />
          <el-select
            v-model="filterForm.categoryId"
            placeholder="类型"
            @change="refreshList">
            <el-option
              v-for="(item, index) in options"
              :key="index"
              :label="item.label"
              :value="item.value" />
          </el-select>
          <el-input
            v-model="search"
            placeholder="请输入工作内容"
            prefix-icon="el-icon-search"
            type="text"
            @blur="refreshList"
            @keyup.enter.native="refreshList" />
          <div class="filter-right">
            <span class="total-count">已筛选出<span>{{ totalCount }}</span>项</span>
            <el-button
              class="export-btn"
              @click="logExportClick">导出</el-button>
          </div>
        </flexbox>
      </div>

      <div
        v-for="(item, index) in listData"
        :key="index"
        class="card list-content">
        <log-item
          :data="item"
          :index="index"
          :show-history-btn="showUserSelect"
          @read="handleRead(index)"
          @add-comment="handleAddComment"
          @delete="handleDelete"
          @edit="handleEdit"
          @report-detail="reportSelect"
          @check-history="checkUserHistory" />
      </div>
    </div>
    <p
      v-if="loading"
      class="scroll-bottom-tips">加载中...</p>
    <p
      v-if="noMore"
      class="scroll-bottom-tips">没有更多了</p>

    <!-- 销售简报列表 -->
    <report-list
      :show.sync="reportListShow"
      :title="reportData.title"
      :placeholder="reportData.placeholder"
      :crm-type="reportData.crmType"
      :request="reportData.request"
      :params="reportData.params"
      :record-request="reportData.recordRequest"
      :field-list="fieldReportList"
      :paging="reportData.paging"
      :sortable="reportData.sortable" />

    <log-com-detail :show.sync="logComDetailShow" :type="logComDetailType" />
  </div>
</template>

<script>
import {
  journalListAPI,
  journalQueryBulletinAPI,
  journalQueryRecordCountAPI,
  journalQueryBulletinByTypeAPI,
  journalGetLogWelcomeAPI,
  oaLogExportAPI } from '@/api/oa/journal'
import { crmQueryBulletinAPI } from '@/api/crm/workbench'

import ReportMenu from './components/ReportMenu'
import LogItem from './components/LogItem'
import CreateLog from './components/CreateLog'
import LogComDetail from './components/LogComDetail' // 日志完成 情况详情
import WkUserDepDialogSelect from '@/components/NewCom/WkUserDepDialogSelect'
import TimeTypeSelect from '@/components/TimeTypeSelect'
import ReportList from '@/views/crm/workbench/components/ReportList'

import { mapGetters } from 'vuex'
import moment from 'moment'
import { downloadExcelWithResData } from '@/utils/index'
import { getReportFieldList } from './utils'
import { separator } from '@/filters/vueNumeralFilter/filters'

export default {
  name: 'WorkLog',
  components: {
    ReportMenu,
    LogItem,
    CreateLog,
    LogComDetail,
    WkUserDepDialogSelect,
    TimeTypeSelect,
    ReportList
  },
  data() {
    return {
      logType: '', // all send 我发出的 received 我收到的
      // 头部信息
      headData: {
        nowNum: 0,
        allNum: 0,
        timeLabel: '',
        timeRemind: ''
      },

      // 简报信息
      reportList: [
        {
          type: 'customer',
          key: 'customerCount',
          info: '今日新增客户',
          iconClass: 'wk wk-customer-line',
          count: 0,
          name: '今日新增客户 0'
        },
        {
          type: 'business',
          key: 'businessCount',
          info: '今日新增商机',
          iconClass: 'wk wk-business-line',
          count: 0,
          name: '今日新增商机 0'
        },
        {
          type: 'contract',
          key: 'contractCount',
          info: '今日新增合同',
          iconClass: 'wk wk-contract-line',
          count: 0,
          name: '今日新增合同 0'
        },
        {
          type: 'receivables',
          key: 'receivablesMoney',
          info: '今日新增回款',
          iconClass: 'wk wk-receivables-line',
          count: 0,
          name: '今日新增回款 0'
        },
        {
          type: 'record',
          key: 'recordCount',
          info: '今日新增跟进记录',
          iconClass: 'wk wk-icon-message-line',
          count: 0,
          name: '今日新增跟进记录 0'
        }
      ],

      // 简报信息

      listData: [],
      loading: false, // loading
      noMore: false,
      page: 1,
      totalCount: 0,
      scrollKey: Date.now(),

      options: [
        { label: '全部', value: 0 },
        { label: '日报', value: 1 },
        { label: '周报', value: 2 },
        { label: '月报', value: 3 }
      ],

      filterForm: {
        categoryId: 0,
        createUserId: [],
        deptIds: []
      },

      timeOptions: [
        { label: '今天', value: 'today' },
        { label: '昨天', value: 'yesterday' },
        { label: '本周', value: 'week' },
        { label: '上周', value: 'lastWeek' },
        { label: '最近30天', value: 'recent30' },
        { label: '最近60天', value: 'recent60' },
        { label: '本月', value: 'month' },
        { label: '上月', value: 'lastMonth' },
        { label: '本季度', value: 'quarter' },
        { label: '上季度', value: 'lastQuarter' },
        { label: '本年', value: 'year' },
        { label: '去年', value: 'lastYear' }
      ],
      timeSelect: {
        type: 'default',
        value: 'recent30'
      },
      search: '',

      // 编辑
      showNewDialog: false,
      formData: {},
      imgFileList: [],
      accessoryFileList: [],

      // 简报预览
      reportListShow: false,
      fieldReportList: null,
      reportData: {
        title: '',
        placeholder: '',
        crmType: '',
        request: null,
        recordRequest: journalQueryBulletinByTypeAPI,
        params: null,
        paging: true,
        sortable: false
      },

      // 日志完成详情
      logComDetailType: '',
      logComDetailShow: false,

      // 日志添加
      logAddShow: false
    }
  },
  computed: {
    ...mapGetters([
      'userInfo'
    ]),

    logTypeLabel() {
      return {
        all: '全部',
        send: '我发出的',
        received: '我收到的'
      }[this.logType] || ''
    },

    showUserSelect() {
      return this.logType != 'send'
    },

    showAdd() {
      return this.logType != 'received'
    },

    userDoneStatus() {
      return {
        icon: this.headData.nowNum > 0 ? 'wk-success' : 'wk-close',
        label: this.headData.nowNum > 0 ? '今天日志已完成' : '今天日志还未完成'
      }
    },

    // 无线滚动控制
    scrollDisabled() {
      return this.loading || this.noMore
    },

    nickName() {
      if (!this.userInfo.realname) return this.userInfo.username
      const reg = /[a-zA-Z]+/
      if (reg.test(this.userInfo.realname) || !this.userInfo.sex) {
        return this.userInfo.realname
      }
      return this.userInfo.realname.slice(0, 1) + (this.userInfo.sex === 1 ? '先生' : '女士')
    }
  },
  watch: {
  },
  created() {
    this.logType = this.$route.params.type
    this.getLogRemind()
    this.getHeadDetail()
    this.getReportData()
  },

  beforeRouteUpdate(to, from, next) {
    this.logType = to.params.type
    this.totalCount = 0
    if (this.$refs.createLog) {
      this.$refs.createLog.showMore = false
    }
    this.search = ''
    this.filterForm = {
      categoryId: 0,
      createUserId: [],
      deptIds: []
    }

    this.timeSelect = {
      type: 'default',
      value: 'recent30'
    }
    this.refreshList()
    next()
  },
  methods: {
    /**
     * 获取概要
     */
    getHeadDetail() {
      journalQueryBulletinAPI().then(res => {
        this.headData.nowNum = res.data.nowNum
        this.headData.allNum = res.data.allNum
      }).catch(() => {

      })
    },

    /**
     * 简报信息
     */
    getReportData() {
      this.loading = true
      crmQueryBulletinAPI({
        dateFilter: 'today',
        dataType: 1
      }).then(res => {
        this.loading = false
        const list = res.data || []
        const current = list[list.length - 1]
        this.reportList = this.reportList.map(item => {
          if (item.key === 'receivablesMoney') {
            current.receivablesMoney = separator(current.receivablesMoney || 0)
          }
          item.count = current[item.key]
          item.name = `${item.info} ${item.count}`
          return item
        })
      }).catch(() => {
        this.loading = false
      })
    },

    getLogRemind() {
      this.getNetworkWelcome()
      const hour = moment().format('H')
      if (hour < 12) {
        // const num = Math.floor(Math.random() * 6)
        this.headData.timeLabel = '早上好'
        // this.headData.timeRemind = [
        //   '给自己一个微笑，告诉自己今天会更美好',
        //   '生命的意义在于和别人的不同之处',
        //   '美丽的早晨，灿烂的你，美好的一天在等你',
        //   '暖暖的阳光照，柔柔的轻风笑，绵绵的岁月长，真真的祝福到',
        //   '美好的一天开始了，每天给自己一个希望',
        //   '蓝天是宁静的，空气是清新的，阳光是明媚的'
        // ][num]
      } else if (hour < 18) {
        // const num = Math.floor(Math.random() * 6)
        this.headData.timeLabel = '下午好'
        // this.headData.timeRemind = [
        //   '认真对待工作，终有一天，你的每一份努力，都将绚烂成花',
        //   '通过辛勤的工作获得的财富才是人生的大快事',
        //   '生命之中总是有太多的感动，难忘的是你灿烂的笑容',
        //   '努力工作，永远不要向命运低头，不要向生活妥协',
        //   '生命，是一树花开，或安静或热烈',
        //   '人生，最快乐的莫过于奋斗'
        // ][num]
      } else {
        // const num = Math.floor(Math.random() * 5)
        this.headData.timeLabel = '晚上好'
        // this.headData.timeRemind = [
        //   '工作一天辛苦了，这世界不会辜负每一份努力和坚持',
        //   '无须缅怀昨天，不必奢望明天，只要认真过好每个今',
        //   '每一份坚持都是成功的累积，相信自己，总会遇到惊喜',
        //   '不要失去希望，你永远不知道明天会带来什么',
        //   '工作一天辛苦了，人生，最快乐的莫过于奋斗'
        // ][num]
      }
    },

    getNetworkWelcome() {
      journalGetLogWelcomeAPI().then(res => {
        this.headData.timeRemind = res.data
      }).catch(() => {
      })
    },

    /**
     * 员工部门筛选change
     */
    userDepChange(userIds, deptIds) {
      this.filterForm.createUserId = userIds
      this.filterForm.deptIds = deptIds
      this.refreshList()
    },

    /**
     * 刷新列表
     */
    refreshList() {
      this.page = 1
      this.listData = []
      this.noMore = false
      this.totalCount = 0
      this.scrollKey = Date.now()
    },

    /**
     * 获取日志列表
     */
    getList(action = null) {
      if (this.loading) return
      this.loading = true
      const params = this.getBaseParams()
      params.page = this.page
      params.limit = 5

      journalListAPI(params).then(res => {
        this.loading = false
        if (!this.noMore) {
          this.listData = this.listData.concat(res.data.list)
          this.page++
        }
        this.totalCount = res.data.totalRow
        this.noMore = res.data.lastPage
      }).catch(() => {
        this.noMore = true
        this.loading = false
      })
    },

    /**
     * 获取基础请求参数
     */
    getBaseParams() {
      const params = {
        search: this.search,
        categoryId: this.filterForm.categoryId,
        createUserId: this.filterForm.createUserId.join(','),
        deptIds: this.filterForm.deptIds
      }

      if (this.timeSelect.type) {
        if (this.timeSelect.type === 'custom') {
          params.startTime = this.timeSelect.startTime.replace(/\./g, '-')
          params.endTime = this.timeSelect.endTime.replace(/\./g, '-')
        } else {
          params.type = this.timeSelect.value || ''
        }
      }

      if (this.logType != 'all') {
        params.by = {
          send: 1,
          received: 2
        }[this.logType]
      }

      if (this.logType == 'send' && params.hasOwnProperty('createUserId')) {
        delete params.createUserId
      }

      if (params.hasOwnProperty('categoryId') && params.categoryId === 0) {
        delete params.categoryId
      }

      return params
    },

    /**
     * 添加回复
     */
    handleAddComment(data) {
      this.listData[data.index].replyList.push(data.data)
    },

    /**
     * 日志删除
     * @param index {number}
     */
    handleDelete(index) {
      this.listData.splice(index, 1)
      this.getHeadDetail()
      this.refreshList()
    },

    /**
     * 日志添加
     */
    addLogClick() {
      // 重置编辑数据
      this.formData = null
      this.imgFileList = null
      this.accessoryFileList = null
      this.logAddShow = true
    },

    /**
     * 日志添加成功
     */
    addLogSuccess() {
      this.refreshList()
      // 刷新数量
      this.getHeadDetail()
    },

    /**
     * 日志操作关闭
     */
    addLogClose() {
      if (this.formData) {
        this.showNewDialog = false
      } else {
        this.logAddShow = false
      }
    },

    /**
     * 日志编辑
     * @param index {number}
     */
    handleEdit(index, data) {
      if (data.sendDeptList) {
        data.sendDeptList.forEach(item => {
          item.deptId = item.id
        })
      }
      this.formData = data
      this.imgFileList = data.img
      // 附件
      this.accessoryFileList = data.file
      this.showNewDialog = true
    },

    /**
     * 日志已读
     * @param index
     */
    handleRead(index) {
      this.listData[index].isRead = 1
    },

    /**
     * 查看某人历史
     */
    checkUserHistory(user) {
      if (user) {
        this.filterForm.createUserId = [user.userId]
      } else {
        this.filterForm.createUserId = []
      }

      // 请求其他筛选条件
      this.filterForm.deptIds = []
      this.refreshList()
    },

    /**
     * 时间更改
     */
    timeTypeChange(data) {
      this.timeSelect = data
      this.refreshList()
    },

    /**
     * 简报预览
     */
    reportSelect(item, data) {
      if (item.type) {
        this.reportData.title = `销售简报-${item.info}`
        this.reportData.placeholder = {
          customer: '请输入客户联系人',
          business: '请输入商机名称',
          contract: '请输入合同名称',
          receivables: '请输入回款编号',
          record: ''
        }[item.type]

        this.reportData.crmType = item.type
        // data 存在 是已添加日志预览  不存在为页面顶部 销售简报预览
        this.reportData.params = data ? { logId: data.logId } : { today: 1 }

        // type   1 客户 2 商机 3 合同 4 回款 5 跟进记录
        this.reportData.params.type = {
          customer: 1,
          business: 2,
          contract: 3,
          receivables: 4,
          record: 5
        }[item.type]

        if (item.type == 'record') {
          this.fieldReportList = [
            {
              label: '模块',
              prop: 'crmType',
              width: 300
            },
            {
              label: '新增跟进记录数',
              prop: 'count'
            }
          ]
          this.reportData.request = journalQueryRecordCountAPI
          this.reportData.paging = false
          this.reportData.sortable = false
        } else {
          this.fieldReportList = getReportFieldList(item.type)
          this.reportData.request = journalQueryBulletinByTypeAPI
          this.reportData.paging = true
          this.reportData.sortable = 'custom'
        }

        this.reportListShow = true
      }
    },

    /**
     * 日志导出功能
     */
    logExportClick() {
      if (this.filterForm.categoryId == 0) {
        this.$message.error('请先选择”日报、周报、月报“中的一种类型导出')
        return
      }

      this.loading = true

      oaLogExportAPI(this.getBaseParams())
        .then(res => {
          downloadExcelWithResData(res)
          this.loading = false
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 查看完成信息
     */
    completeSelect(type) {
      this.logComDetailType = type
      this.logComDetailShow = true
    }
  }
}
</script>

<style scoped lang="scss">
  @import "./style/log.scss";
</style>
