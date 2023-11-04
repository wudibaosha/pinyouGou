<template>
  <div class="main">
    <flexbox class="main-header" justify="space-between">
      <div class="main-header__left">
        <span class="title">跟进记录</span>
      </div>
    </flexbox>

    <flexbox class="main-header is-filter-header" justify="space-between">
      <div class="main-header__left">
        <el-input
          v-model="filterForm.search"
          placeholder="关键字搜索"
          class="search-input">
          <el-button
            slot="suffix"
            type="icon"
            icon="wk wk-sousuo"
            @click="refreshList" />
        </el-input>

        <span class="tabs">
          <span class="tabs-label">显示:</span>
          <el-button
            v-for="(item, index) in tabs"
            :key="index"
            :type="item.name === tabsSelectValue ? 'selected' : null"
            @click="tabsChange(item.name)">{{ item.label }}</el-button>
        </span>
      </div>
      <div class="main-header__right">
        <el-popover
          v-model="filterShow"
          popper-class="no-padding-popover"
          placement="bottom"
          width="300"
          trigger="click">

          <record-filter
            v-if="filterShow"
            :crm-type-options="options"
            :crm-type="filterForm.crmType"
            :time-select="timeSelect"
            :user-ids="filterForm.userIds"
            :type="filterForm.recordType"
            @close="filterShow = false"
            @save="filterSave"
          />

          <el-button
            slot="reference"
            v-model="filterShow"
            :type="filterShow ? 'selected' : 'subtle'"
            icon="wk wk-screening"
            @click="filterShow = true">筛选</el-button>
        </el-popover>

        <el-dropdown
          v-if="moreTypes.length > 0"
          style="margin-left: 8px;"
          trigger="click"
          @command="handleTypeDrop">
          <el-button icon="el-icon-more" class="dropdown-btn" />
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item
              v-for="(item, index) in moreTypes"
              :key="index"
              :icon="item.icon"
              :command="item.type">{{ item.name }}</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>
    </flexbox>

    <div
      :key="`${scrollKey}${tabsSelectValue}`"
      v-infinite-scroll="getList"
      infinite-scroll-distance="100"
      infinite-scroll-disabled="scrollDisabled"
      class="cell-section">
      <log-cell
        v-for="(item, itemIndex) in list"
        :key="itemIndex"
        :index="itemIndex"
        :item="item"
        :show-control="item.type === 1"
        class="log-cell"
        @delete="logCellDelete"
        @edit="logCellEdit"
        @crm-detail="checkRelationDetail">
        <activity-item
          v-if="isObject(item.content) && item.type != 4"
          slot="content"
          :item-data="item"
          @detail="checkRelationDetail" />

        <div
          class="relate-cell"
          @click="checkRelationDetail(item.activityType, item.activityTypeId, true)">
          <i
            :class="getActivityIcon(item.activityType)"
            class="relate-cell-icon" />
          <span class="relate-cell-type">{{ getActivityTypeName(item.activityType) }}-</span>
          <span class="relate-cell-name">{{ item.activityTypeName }}</span>
        </div>
      </log-cell>
      <p
        v-if="loading"
        class="scroll-bottom-tips">加载中...</p>
      <p
        v-if="noMore"
        class="scroll-bottom-tips">没有更多了</p>
    </div>

    <c-r-m-full-screen-detail
      :id="relationID"
      :visible.sync="showFullDetail"
      :crm-type="relationCrmType"
      @handle="detailHandle" />

    <!-- 跟进记录编辑 -->
    <log-edit-dialog
      :visible.sync="logEditDialogVisible"
      :data="logEditData"
      @save="logEditSave"
    />
  </div>
</template>

<script>
import {
  crmActivityExportRecordListAPI,
  crmActivityImportRecordListAPI,
  crmActivityDownloadRecordExcelAPI
} from '@/api/crm/workbench'
import { crmActivityListAPI } from '@/api/crm/common'
import {
  userErrorExcelDownAPI
} from '@/api/admin/employeeDep'

import LogCell from '@/views/crm/components/Activity/LogCell'
import ActivityItem from '@/views/crm/components/Activity/ActivityItem'
import LogEditDialog from '@/views/crm/components/Activity/LogEditDialog'
import RecordFilter from './components/RecordFilter'

import XrSystemIconMixin from '@/mixins/XrSystemIcon'
import ActivityTypeMixin from '@/views/crm/components/Activity/ActivityType'
import crmTypeModel from '@/views/crm/model/crmTypeModel'
import { downloadExcelWithResData } from '@/utils'
import { mapGetters } from 'vuex'
import { isObject } from '@/utils/types'

export default {
  // 跟进记录
  name: 'FollowIndex',
  components: {
    LogCell,
    ActivityItem,
    LogEditDialog,
    RecordFilter,
    CRMFullScreenDetail: () =>
      import('@/components/CRMFullScreenDetail')
  },
  mixins: [XrSystemIconMixin, ActivityTypeMixin],
  props: {},
  data() {
    return {
      tabsSelectValue: 'all',
      tabs: [
        {
          label: '全部',
          name: 'all'
        },
        {
          label: '我创建的',
          name: '0'
        },
        {
          label: '我下属创建的',
          name: '1'
        }
      ],

      options: [
        { label: '全部', value: '' },
        { label: '线索', value: 1 },
        { label: '客户', value: 2 },
        { label: '联系人', value: 3 },
        { label: '商机', value: 5 },
        { label: '合同', value: 6 }
      ],

      // 总数量
      // count: 0,

      // 默认全部  subUser  0 我的  1 我下属的
      filterForm: {
        crmType: '',
        isUser: 1,
        userIds: [],
        subUser: '',
        recordType: '' // 0 全部 1 跟进记录 4 外勤签到
      },
      filterShow: false,

      timeSelect: {
        type: 'default',
        value: 'month'
      },

      list: [],
      loading: false,
      noMore: false,
      page: 1,
      scrollKey: Date.now(),

      showFullDetail: false, // 查看相关客户管理详情
      relationID: '', // 相关ID参数
      relationCrmType: '', // 相关类型

      // 跟进记录编辑
      logEditData: null,
      logEditPosition: {
        seciton: 0,
        index: 0
      },
      logEditDialogVisible: false,
      requestParams: {}
    }
  },
  computed: {
    ...mapGetters(['crm', 'userInfo']),

    moreTypes() {
      const temps = []
      if (this.$auth('crm.followRecord.excelimport')) {
        temps.push({ type: 'enter', name: '导入', icon: 'wk wk-import' })
      }
      if (this.$auth('crm.followRecord.excelexport')) {
        temps.push({ type: 'out', name: '导出', icon: 'wk wk-export' })
      }
      return temps
    },

    // 无线滚动控制
    scrollDisabled() {
      return this.loading || this.noMore
    },

    userSelectShow() {
      return this.filterForm.subUser !== '0' // 0 是我的
    }
  },
  watch: {
    filterForm: {
      handler() {
        this.refreshList()
      },
      deep: true
    }
  },
  mounted() {},
  created() {
    // 监听导入
    this.$bus.on('import-crm-done-bus', (type) => {
      console.log(type)
      if (type === 'crmFollowLog') {
        this.refreshList()
      }
    })
  },
  beforeDestroy() {
    this.$bus.off('import-crm-done-bus')
  },
  methods: {
    isObject(data) {
      return isObject(data)
    },

    /**
     * 中间tabs改变
     */
    tabsChange(type) {
      this.tabsSelectValue = type
      this.filterForm.subUser = type === 'all' ? '' : type
    },

    /**
     * 筛选保存
     */
    filterSave(crmType, timeSelect, recordType, userIds) {
      const { type, startTime, endTime } = timeSelect
      if (type === 'custom') {
        const days = this.$moment(endTime.replace(/\./g, '-')).diff(this.$moment(startTime.replace(/\./g, '-')), 'days', true)
        if (days > 90) {
          this.$message.error('筛选天数不能大于90天')
          return
        }
      }

      this.filterShow = false // 关闭筛选框
      this.filterForm.crmType = crmType
      this.timeSelect = timeSelect
      this.filterForm.recordType = recordType
      this.filterForm.userIds = userIds
    },

    /**
     * 刷新列表
     */
    refreshList() {
      this.page = 1
      this.list = []
      this.noMore = false
      this.scrollKey = Date.now()
    },

    /**
     * 获取筛选请求参数
     * @return {*}
     */
    getFilterParams() {
      // recordType 1 跟进记录 2 创建记录 3 阶段变更 4 外勤签到
      // queryType 1 跟进记录、外勤签到 2 活动记录
      const params = {
        page: this.page,
        limit: 15,
        isOa: true,
        content: this.filterForm.search,
        subUser: this.filterForm.subUser,
        queryType: 1,
        recordType: this.filterForm.recordType,
        userList: this.filterForm.userIds,
        activityType: this.filterForm.crmType
      }

      // 全部不上传该字段
      if (params.recordType == 0) {
        delete params.recordType
      }

      if (this.timeSelect.type) {
        if (this.timeSelect.type === 'custom') {
          params.dateFilter = 'custom'
          params.startDate = this.timeSelect.startTime.replace(/\./g, '-')
          params.endDate = this.timeSelect.endTime.replace(/\./g, '-')
        } else {
          params.dateFilter = this.timeSelect.value || ''
        }
      }

      if (params.subUser) {
        params.dataType = {
          0: 1, // 我创建的
          1: 2 // 我下属创建的
        }[params.subUser]
      }

      Object.keys(params).forEach(key => {
        if (!params[key] && params[key] !== 0) {
          delete params[key]
        }
      })

      console.log('query: ', params)
      return params
    },

    /**
     * 获取数据列表
     */
    getList() {
      this.loading = true
      this.requestParams = this.getFilterParams()
      crmActivityListAPI(this.requestParams)
        .then(res => {
          this.loading = false
          if (!this.noMore) {
            this.page++
            this.list = this.list.concat(res.data.list || [])
          }
          this.noMore = res.data.lastPage
        })
        .catch(() => {
          this.noMore = true
          this.loading = false
        })
    },

    /**
     * 查看相关客户管理详情
     */
    checkRelationDetail(type, id, convert = false) {
      this.relationID = id
      this.relationCrmType = convert ? crmTypeModel.convertTypeToKey(type) : type
      this.showFullDetail = true
    },

    getActivityIcon(activityType) {
      // 1 线索 2 客户 3 联系人 4 产品 5 商机 6 合同 7 回款 8 日志 9 审批 10 日程 11 任务 12 发邮件
      return this.getXrIcon(this.getActivityType(activityType))
    },

    getActivityTypeColor(activityType) {
      // 1 线索 2 客户 3 联系人 4 产品 5 商机 6 合同 7 回款 8 日志 9 审批 10 日程 11 任务 12 发邮件
      return this.getXrIconColor(this.getActivityType(activityType))
    },

    /**
     * 详情操作
     */
    detailHandle(data) {
      if (data.type == 'delete') {
        this.refreshList()
      }
    },

    /**
     * 跟进日志删除
     */
    logCellDelete(data, index, seciton) {
      this.list.splice(index, 1)
      this.scrollKey = Date.now()
    },

    /**
     * 跟进日志编辑
     */
    logCellEdit(data, index, seciton) {
      this.logEditData = data
      this.logEditPosition = {
        seciton,
        index
      }
      this.logEditDialogVisible = true
    },

    logEditSave(data) {
      if (!data) {
        this.refreshList()
      } else if (this.logEditPosition.index >= 0) {
        this.list.splice(this.logEditPosition.index, 1, data)
      }
    },

    handleTypeDrop(command) {
      if (!this.requestParams.activityType) {
        this.$message.error('请先选择一个模块导入/导出')
        return
      }
      if (command == 'out') {
        crmActivityExportRecordListAPI(this.requestParams)
          .then(res => {
            downloadExcelWithResData(res)
          })
          .catch(() => {})
      } else if (command == 'enter') {
        const labelObj = this.options.find(item => item.value === this.requestParams.activityType)

        this.$wkImport.import('crmFollowLog', {
          typeName: `${labelObj.label}跟进记录`,
          ownerSelectShow: false,
          repeatHandleShow: false,
          historyShow: false,
          noImportProcess: true,
          importRequest: crmActivityImportRecordListAPI, // 导入请求
          importParams: { crmType: this.requestParams.activityType },
          templateRequest: crmActivityDownloadRecordExcelAPI, // 模板请求
          templateParams: { crmType: this.requestParams.activityType },
          downloadErrFuc: this.getImportError,
          userInfo: this.userInfo
        })
      }
    },

    /**
     * 导入错误下载
     */
    getImportError(result) {
      return new Promise((resolve, reject) => {
        userErrorExcelDownAPI({
          token: result.token
        })
          .then(res => {
            resolve(res)
          })
          .catch(() => {
            reject()
          })
      })
    }

  }
}
</script>

<style lang="scss" scoped>
@import "./style/follow.scss";

.filter {
  &__header {
    padding: 16px;
    padding-bottom: 8px;
  }

  &__title {
    font-size: 18px;
    font-weight: 600;
    line-height: 24px;
  }

  &__body {
    padding: 0 16px;
    word-break: break-all;

    .el-date-editor {
      width: 100%;
    }

    .el-form-item {
      margin-bottom: $--interval-base;
    }
  }
}

.cell-section {
  height: calc(100% - 140px);
}

.log-cell {
  position: relative;
  padding-bottom: 50px !important;
  margin-bottom: 15px;
}

.relate-cell {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 13px 55px;
  background-color: #f5f7fa;
  border-radius: 4px;

  &-icon {
    display: inline-block;
    margin-right: 5px;
    font-size: 14px;
    color: $--color-text-regular;
  }

  &-name {
    color: $--color-primary;
    cursor: pointer;
  }

  &-name:hover {
    text-decoration: underline;
  }
}
</style>
