<template>
  <div
    class="main">
    <div>
      <log-add
        v-if="!isSeas && canCreateFollowRecord"
        :id="id"
        ref="logAdd"
        v-loading="sendLoading"
        :show-business="showRelate"
        :show-contacts="showRelate"
        :contacts="contacts"
        :contacts-id="contactsId"
        :follow-types="followTypes"
        :crm-type="crmType"
        class="log-add"
        @send="sendLog" />

      <div :class="{'is-top':isSeas}" class="log">
        <flexbox class="log__filter">
          <flexbox class="filter-left">
            <span class="filter-text">显示：</span>
            <el-button
              v-if="showRecord"
              size="medium"
              :class="{ 'el-button--selected': filterValue.queryType === 1 }"
              @click="handleSelectClick(1)">跟进记录</el-button>
            <el-button
              size="medium"
              :class="{ 'el-button--selected': filterValue.queryType === 2 }"
              @click="handleSelectClick(2)">{{ typeName }}动态</el-button>
          </flexbox>
          <flexbox-item class="filter-right">
            <el-popover
              v-model="filterPopoverVisible"
              width="300"
              placement="bottom-end"
              trigger="click">
              <div class="filter-popover">
                <div class="filter-popover__body">
                  <div class="filter-item">
                    <el-input
                      ref="activitySearchInput"
                      v-model.trim="filterValue.search"
                      placeholder="关键字搜索"
                      prefix-icon="el-icon-search" />
                  </div>
                  <!-- 动态筛选 -->
                  <template v-if="filterValue.queryType === 2 && typeList && typeList.length > 1">
                    <div class="filter-item">
                      <div class="filter-item__label">动态筛选</div>
                      <el-select v-model="filterValue.activityType">
                        <el-option
                          v-for="(item, index) in typeList"
                          :key="index"
                          :label="item.label"
                          :value="item.command" />
                      </el-select>
                    </div>
                  </template>
                  <div class="filter-item">
                    <div class="filter-item__label">时间筛选</div>
                    <time-type-select
                      :options="timeOptions"
                      :default-type="filterValue.timeLine"
                      @change="timeTypeChange" />
                  </div>
                </div>
                <flexbox
                  align="center"
                  justify="flex-end"
                  class="filter-popover__footer">
                  <el-button type="primary" @click="filterSure">确定</el-button>
                  <el-button @click="filterPopoverVisible = false">取消</el-button>
                </flexbox>
              </div>
              <el-button
                slot="reference"
                :type="filterPopoverVisible ? 'selected' : 'subtle'"
                size="medium"
                icon="wk wk-screening">筛选</el-button>
            </el-popover>
          </flexbox-item>
        </flexbox>

        <div>
          <flexbox
            v-for="(children, index) in list"
            :key="children.time"
            align="stretch"
            class="log-group">
            <div class="log-group__title">
              <div class="time-day">{{ getSectionDay(children.time) }}</div>
              <div class="time-month">{{ getSectionMonth(children.time) }}</div>
            </div>

            <flexbox-item class="log-group__body">
              <log-cell
                v-for="(item, itemIndex) in children.list"
                :key="itemIndex"
                :section="index"
                :index="itemIndex"
                :item="item"
                :can-delete="!isSeas"
                :show-control="filterValue.queryType === 1"
                @delete="logCellDelete"
                @edit="logCellEdit"
                @crm-detail="checkCRMDetail">
                <activity-item
                  v-if="isObject(item.content) && item.type != 4"
                  slot="content"
                  :item-data="item"
                  @detail="checkCRMDetail" />
              </log-cell>
            </flexbox-item>
          </flexbox>
        </div>
        <p
          ref="scrollBottomTips"
          class="scroll-bottom-tips">{{ loading ? '加载中...' : noMore ? '没有更多了' : '加载更多...' }}</p>
      </div>
    </div>

    <!-- CRM详情 -->
    <c-r-m-full-screen-detail
      :id="relationID"
      :visible.sync="showFullDetail"
      :crm-type="relationCrmType" />

    <!-- 跟进记录编辑 -->
    <log-edit-dialog
      :visible.sync="logEditDialogVisible"
      :data="logEditData"
      @save="logEditSave"
    />
  </div>
</template>

<script>
import { crmCustomerQueryContactsAPI } from '@/api/crm/customer'
import { crmSettingRecordListAPI } from '@/api/admin/crm'
import {
  crmActivityListAPI,
  crmActivityAddAPI
} from '@/api/crm/common'

import LogAdd from './LogAdd'
import LogCell from './LogCell'
import LogEditDialog from './LogEditDialog'
import crmTypeModel from '@/views/crm/model/crmTypeModel'
import ActivityItem from './ActivityItem'

import XrSystemIconMixin from '@/mixins/XrSystemIcon'
import ActivityTypeMixin from './ActivityType'
import TimeTypeSelect from '@/components/TimeTypeSelect'
import { debounce } from 'throttle-debounce'
import { mapGetters } from 'vuex'
import moment from 'moment'
import { isEleVisible } from '@/utils'
import { isArray, isObject } from '@/utils/types'

export default {
  name: 'Activity', // 活动
  components: {
    LogAdd,
    LogCell,
    TimeTypeSelect,
    LogEditDialog,
    CRMFullScreenDetail: () =>
      import('@/components/CRMFullScreenDetail'),
    ActivityItem
  },
  mixins: [XrSystemIconMixin, ActivityTypeMixin],
  props: {
    // 模块ID
    id: [String, Number],
    // 首要联系人ID
    contactsId: [String, Number],
    // 没有值就是全部类型 有值就是当个类型
    crmType: {
      type: String,
      default: ''
    },
    // 是公海 默认是客户
    isSeas: {
      type: Boolean,
      default: false
    },
    // 筛选数据源
    typeList: {
      type: Array,
      default: () => {
        return []
      }
    },
    // 详情
    detail: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },
  data() {
    return {
      loading: false,
      // 筛选
      isSearchRequest: false,
      filterValue: {},
      filterPopoverForm: {},
      timeOptions: [
        { label: '全部', value: '' },
        { label: '最近7天', value: '7' },
        { label: '最近30天', value: '30' },
        { label: '最近60天', value: '60' }
      ],
      // 筛选 popover
      filterPopoverVisible: false,

      contacts: [],
      followTypes: [],
      // 活动列表
      list: [],
      noMore: false,
      page: 1,
      // CRM详情
      showFullDetail: false, // 查看相关客户管理详情
      relationID: '', // 相关ID参数
      relationCrmType: '', // 相关类型
      // scrollKey: Date.now(),
      // 跟进记录编辑
      sendLoading: false,
      logEditData: null,
      logEditPosition: {
        seciton: 0,
        index: 0
      },
      logEditDialogVisible: false
    }
  },
  computed: {
    ...mapGetters(['crm']),

    typeName() {
      return crmTypeModel.keyToNameData[this.crmType]
    },

    /**
     * 是否有跟进记录的权限
     */
    showRecord() {
      return this.crm && this.crm.followRecord && this.crm.followRecord.read
    },

    // 是否能新建跟进记录
    canCreateFollowRecord() {
      return this.crm && this.crm.followRecord && this.crm.followRecord.save
    },

    showRelate() {
      return this.crmType === 'customer'
    },

    scrollDisabled() {
      return this.loading || this.noMore
    }
  },
  inject: ['rootTabs'],
  watch: {
    id() {
      this.initInfo()
      this.refreshLogList()
    },

    'rootTabs.currentName'(val) {
      if (val === 'Activity') {
        this.getContactsList(false)
      }
    }
  },
  created() {
    this.debouncedRefreshLogList = debounce(300, this.refreshLogList)
    this.initInfo()
  },
  mounted() {
    this.refreshLogList()
  },
  methods: {
    isObject(data) {
      return isObject(data)
    },
    /**
     * 父容器滚动
     */
    scroll() {
      const scrollBottomTips = this.$refs.scrollBottomTips
      if (isEleVisible(scrollBottomTips) && !this.noMore) {
        this.getLogList()
      }
    },

    /**
     * 获取跟进类型详情
     */
    getLogTypeList() {
      crmSettingRecordListAPI()
        .then(res => {
          this.followTypes = res.data.map(item => {
            return {
              value: item,
              label: item
            }
          })
        })
        .catch(() => {})
    },

    /**
     * 获取联系人
     */
    getContactsList() {
      crmCustomerQueryContactsAPI({
        customerId: this.id,
        pageType: 0
      })
        .then(res => {
          this.contacts = res.data.list || []
          const hasContacts = this.contacts.find(item => item.contactsId === this.contactsId)
          if (!hasContacts) {
            this.$emit('update:contactsId', '')
          }
        })
        .catch(() => {})
    },

    /**
     * 发布日志
     */
    sendLog(data) {
      if (!data.content) {
        this.$message.error('请输入跟进内容')
        return
      }

      const params = {}
      params.activityType = crmTypeModel[this.crmType]
      params.activityTypeId = data.id
      params.content = data.content
      params.category = data.followType
      const businessIds = data.business.map(item => item.businessId)

      params.batchId = data.batchId
      params.businessIds = businessIds
      if (data.contactsId) {
        params.contactsIds = isArray(data.contactsId) ? data.contactsId : [data.contactsId]
      } else {
        params.contactsIds = []
      }

      params.nextTime = data.nextTime || ''
      params.timeType = data.timeType
      this.sendLoading = true
      crmActivityAddAPI(params)
        .then(res => {
          this.sendLoading = false
          this.$message.success('发布成功')
          // 重置页面
          if (this.$refs.logAdd) {
            this.$refs.logAdd.resetInfo()
          }
          this.refreshLogList()
        })
        .catch(() => {
          this.sendLoading = false
        })
    },

    /**
     * 初始化信息
     */
    initInfo() {
      this.$nextTick(() => {
        if (this.$refs.logAdd) {
          this.$refs.logAdd.resetInfo()
        }
      })
      // recordType 1 跟进记录 2 创建记录 3 阶段变更 4 外勤签到
      // queryType 1 跟进记录、外勤签到 2 活动记录
      this.filterValue = {
        search: '',
        queryType: this.showRecord ? 1 : 2,
        timeLine: {
          label: '全部',
          value: ''
        }
      }
      this.getLogTypeList()
      if (this.showRelate) {
        this.getContactsList()
      }
    },

    /**
     * 初始化日志
     */
    refreshLogList(isSearchRequest) {
      this.isSearchRequest = isSearchRequest || false
      this.page = 1
      this.noMore = false
      this.list = []
      this.filterPopoverVisible = false
      this.getLogList()
    },

    /**
     * 活动筛选
     */
    handleSelectClick(value) {
      this.filterValue.queryType = value
      this.refreshLogList()
    },

    /**
     * 时间筛选
     */
    timeTypeChange(data) {
      this.filterValue.timeLine = data
    },

    /**
     * 筛选确定
     */
    filterSure() {
      const { type, startTime, endTime } = this.filterValue.timeLine
      if (type === 'custom') {
        const days = moment(endTime.replace(/\./g, '-')).diff(moment(startTime.replace(/\./g, '-')), 'days', true)
        if (days > 90) {
          this.$message.error('筛选天数不能大于90天')
          return
        }
      }
      this.refreshLogList()
    },

    /**
     * 获取筛选请求参数
     * @return {*}
     */
    getFilterParams() {
      const params = {
        page: this.page,
        crmType: crmTypeModel[this.crmType], // 9是公海
        activityTypeId: this.id,
        activityType: this.filterValue.activityType
      }

      if (this.filterValue.queryType) {
        params.queryType = this.filterValue.queryType
      }

      if (this.filterValue.search) {
        params.content = this.filterValue.search
      }

      if (this.filterValue.timeLine.type) {
        if (this.filterValue.timeLine.type === 'custom') {
          params.dateFilter = 'custom'
          params.startDate = this.filterValue.timeLine.startTime.replace(/\./g, '-')
          params.endDate = this.filterValue.timeLine.endTime.replace(/\./g, '-')
        } else {
          const intervalDay = this.filterValue.timeLine.value
          params.dateFilter = {
            7: 'previous7day',
            30: 'previous30day',
            60: 'previous60day'
          }[intervalDay] || ''
        }
      }

      return params
    },

    /**
     * 活动日志
     */
    getLogList() {
      this.loading = true
      const params = this.getFilterParams()
      crmActivityListAPI(params)
        .then(res => {
          this.loading = false
          if (!this.noMore) {
            this.page++
            this.formatList(res.data.list)
          }
          this.noMore = res.data.lastPage

          // 如果还有更多
          if (!this.noMore) {
            this.$nextTick(() => {
              this.scroll()
            })
          }

          if (this.isSearchRequest) {
            this.$nextTick(() => {
              this.$refs.activitySearchInput.focus()
            })
          }
        })
        .catch(() => {
          this.noMore = true
          this.loading = false
        })
    },

    /**
     * 把获取到的列表数据按照时间分组
     * @param list
     */
    formatList(list) {
      let last = this.list[this.list.length - 1] || null
      list.forEach(item => {
        const createTime = moment(item.createTime).format('YYYY-MM-DD')
        if (last && last.time === createTime) {
          this.list[this.list.length - 1].list.push(item)
        } else {
          this.list.push({
            time: createTime,
            list: [item]
          })
          last = this.list[this.list.length - 1]
        }
      })
    },

    /**
     * 跟进日志查看详情
     */
    checkCRMDetail(type, id) {
      this.relationID = id
      this.relationCrmType = type
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
     * 跟进日志删除
     */
    logCellDelete(data, index, seciton) {
      this.list[seciton].list.splice(index, 1)
      if (this.list[seciton].list.length == 0) {
        this.list.splice(seciton, 1)
      }
      // this.scrollKey = Date.now()
      this.refreshLogList()
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
        this.refreshLogList()
      } else if (data && this.logEditPosition.seciton >= 0 && this.logEditPosition.index >= 0) {
        this.list[this.logEditPosition.seciton].list.splice(this.logEditPosition.index, 1, data)
      }
    },

    /**
     * 获取section 时间
     */
    getSectionDay(time) {
      return moment(time).format('DD')
    },

    getSectionMonth(time) {
      return moment(time).format('YYYY.MM')
    }
  }
}
</script>

<style scoped lang="scss">
.main {
  position: relative;
  height: 100%;
}

.log.is-top {
  margin-top: 0;
}

.log {
  position: relative;
  margin-top: #{$--interval-base * 5};

  &__filter {
    width: 100%;
    height: 40px;

    .filter-left {
      width: unset;
    }

    .filter-right {
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }
  }

  .log-group {
    margin-top: 15px;

    .log-group__title {
      width: 70px;
      padding-top: 15px;
      margin-right: 15px;
      text-align: center;

      .time-day {
        font-size: $--font-size-xxlarge;
      }

      .time-month {
        margin-top: 5px;
        font-size: $--font-size-base;
      }
    }

    .log-group__body {
      .user {}
    }
  }
}

.activity-cell {
  padding: #{$--interval-base / 2} #{$--interval-base * 2} #{$--interval-base * 2 + 1};

  &__label {
    color: $--color-text-secondary;
  }

  &__content {
    color: $--color-primary;
    cursor: pointer;
  }

  &__content:hover {
    text-decoration: underline;
  }

  &.is-paragraph {
    padding-top: 0;
    line-height: 1.5;
  }
}

.el-dropdown-link {
  cursor: pointer;

  .el-icon--right {
    font-weight: bold;
  }
}

.filter-popover {
  padding: 20px 15px;

  &__body {
    .filter-item {
      margin-bottom: 25px;

      .filter-item__label {
        margin-bottom: 5px;
      }

      .el-select {
        width: 100%;
      }
    }
  }
}

/deep/ .time-type-select {
  .type-select {
    width: 100% !important;
  }
}
</style>
