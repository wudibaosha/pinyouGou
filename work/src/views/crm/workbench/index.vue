<template>
  <div ref="workbench" class="crm-workbench">
    <flexbox class="crm-workbench__hd">
      <div class="title">CRM仪表盘<i class="wk wk-icon-fill-help wk-help-tips" data-type="4" data-id="7" /></div>
      <el-button
        class="dropdown-btn"
        icon="el-icon-more"
        @click="setSortShow = true" />
    </flexbox>
    <div class="head">
      <flexbox class="head__body">
        <xr-radio-menu
          v-model="filterDataType"
          :options="rangeOptions"
          :is-default.sync="dataTypeDefault"
          :user-checked-data="filterValue.users"
          :dep-checked-data="filterValue.strucs"
          :width="250"
          @select="radioMenuSelect">
          <el-input
            slot="reference"
            v-model="avatarData.realname"
            class="el-input--no-bg"
            :readonly="true">
            <i
              slot="suffix"
              class="el-icon-arrow-up" />
          </el-input>
        </xr-radio-menu>

        <wk-time-type-Select
          ref="timeTypeSelect"
          mode="no-border"
          :width="200"
          :is-default.sync="timeDefault"
          :default-type="filterTime"
          style="margin-left: 8px;"
          @change="timeTypeChange" />
      </flexbox>
    </div>
    <div class="crm-workbench__body">
      <div
        v-loading="loading"
        class="brief-box">
        <div class="brief-title">
          <span class="icon wk wk-icon-briefing" />
          <span class="text">销售简报<i class="wk wk-icon-fill-help wk-help-tips" data-type="4" data-id="8" /></span>
        </div>
        <div class="brief">
          <brief-item
            v-for="(item, index) in briefList"
            :key="index"
            :is-hover="index === 0"
            :class="{ 'is-current': index === 0 }"
            :data="item"
            :rate-text="rateText"
            @click.native="reportClick(item)" />
        </div>
      </div>

      <flexbox
        class="section"
        align="stretch">
        <draggable
          v-model="sortLeft"
          class="left"
          :group="{ name: 'sort'}"
          :options="{ forceFallback: false, handle: '.filter-handle' }"
          @end="dragEnd">
          <template v-for="(item, index) in sortLeft">
            <div v-if="item.isHidden === 1" :key="index" style="display: none;" />
            <component
              :is="item.component"
              v-else
              :key="index"
              :filter-value="filterValue"
              class="left-content component-item"
              @chart-click="chartClick"
            />
          </template>
        </draggable>
        <draggable
          v-model="sortRight"
          :group="{ name: 'sort'}"
          :options="{ forceFallback: false, handle: '.filter-handle' }"
          class="right"
          @end="dragEnd">
          <template v-for="(item, index) in sortRight">
            <div v-if="item.isHidden === 1" :key="index" style="display: none;" />
            <component
              :is="item.component"
              v-else
              :key="index"
              :filter-value="filterValue"
              class="right-content component-item"
              @chart-click="chartClick"
            />
          </template>
        </draggable>
      </flexbox>
    </div>

    <!-- 销售简报列表 -->
    <report-list
      :show.sync="reportListShow"
      :title="reportData.title"
      :placeholder="reportData.placeholder"
      :crm-type="reportData.crmType"
      :request="reportData.request"
      :record-request="reportData.recordRequest"
      :params="reportData.params"
      :field-list="fieldReportList"
      :paging="reportData.paging"
      :sortable="reportData.sortable" />

    <!-- 排序 -->
    <set-sort
      v-if="setSortShow"
      :visible.sync="setSortShow"
      @save="getModelSort" />
  </div>
</template>

<script>
import {
  crmQueryBulletinAPI,
  crmIndexIndexListAPI,
  crmQueryRecordConuntAPI,
  crmIndexGetRecordListAPI,
  crmIndexSortAPI,
  crmIndexSetSortAPI,
  crmDefaultQueryByTypeAPI,
  crmDefaultSaveAPI
} from '@/api/crm/workbench'
import {
  biBusinessWinOrFailDetailListAPI,
  biBusinessDetailListAPI
} from '@/api/bi/business'

import BriefItem from './components/BriefItem'
import SaleStatistics from './components/SaleStatistics'
import DataStatistics from './components/DataStatistics'
import SalesFunnel from './components/SalesFunnel'
import PerformanceChart from './components/PerformanceChart'
import RankingStatistics from './components/RankingStatistics'
import ForgetRemind from './components/ForgetRemind'
import WkTimeTypeSelect from '@/components/WkTimeTypeSelect'
import ReportList from './components/ReportList'
import SetSort from './components/SetSort'
import XrRadioMenu from '@/components/Menu/XrRadioMenu'
import draggable from 'vuedraggable'

import { mapGetters } from 'vuex'
import { separator } from '@/filters/vueNumeralFilter/filters'
import NP from 'number-precision'

/**
 * TODO 2、员工部门筛选选择，
 *      3、员工部门筛选后刷新销售简报数据
 */

export default {
  name: 'Workbench',
  components: {
    BriefItem,
    SaleStatistics, // 1 合同金额目标及完成情况
    DataStatistics, // 2 数据汇总
    SalesFunnel, // 5 销售漏斗
    PerformanceChart, // 4 业绩指标完成率 (回款金额)
    RankingStatistics, // 7 排行榜
    ForgetRemind, // 6 遗忘提醒
    WkTimeTypeSelect,
    ReportList,
    XrRadioMenu,
    SetSort,
    draggable
  },
  data() {
    return {
      briefList: [
        { label: '新增客户', unit: '人', title: '新增客户', type: 'customer', labelValue: 2, field: 'customerCount', icon: 'wk-customer', num: '', rate: '', status: '', color: '#2362FB' },
        { label: '新增联系人', unit: '人', title: '新增联系人', type: 'contacts', labelValue: 3, field: 'contactsCount', icon: 'wk-contacts', num: '', rate: '', status: '', color: '#27BA4A' },
        { label: '新增商机', unit: '个', title: '新增商机', type: 'business', labelValue: 5, field: 'businessCount', icon: 'wk-business', num: '', rate: '', status: '', color: '#FB9323' },
        { label: '新增合同', unit: '个', title: '新增合同', type: 'contract', labelValue: 6, field: 'contractCount', icon: 'wk-contract', num: '', rate: '', status: '', color: '#4A5BFD', helpType: '4', helpId: '9' },
        { label: '合同金额', unit: '元', title: '合同金额', type: 'contract', labelValue: 6, field: 'contractMoney', icon: 'wk-receivables', num: '', rate: '', status: '', color: '#19B5F6', helpType: '4', helpId: '10' },
        { label: '商机金额', unit: '元', title: '商机金额', type: 'business', labelValue: 5, field: 'businessMoney', icon: 'wk-icon-opportunities', num: '', rate: '', status: '', color: '#AD5CFF', helpType: '4', helpId: '11' },
        { label: '回款金额', unit: '元', title: '回款金额', type: 'receivables', labelValue: 7, field: 'receivablesMoney', icon: 'wk-receivables', num: '', rate: '', status: '', color: '#FFB940', helpType: '4', helpId: '12' },
        { label: '新增跟进记录', unit: '条', title: '新增跟进记录', type: 'record', labelValue: '', field: 'recordCount', icon: 'wk-record', num: '', rate: '', status: '', color: '#4A5BFD', helpType: '4', helpId: '13' }
      ],
      rangeOptions: [
        { label: '仅本人', command: 1 },
        { label: '本人及下属', command: 2 },
        { label: '仅本部门', command: 3 },
        { label: '本部门及下属部门', command: 4 },
        { label: '自定义', command: 'custom' }
      ],
      filterDataType: 2,
      filterTime: 'month',
      filterValue: {
        dataType: 2,
        users: [],
        strucs: [],
        timeLine: {
          type: 'default',
          value: 'month'
        }
      },
      loading: false,

      reportListShow: false,
      fieldReportList: null,
      reportData: {
        title: '',
        placeholder: '',
        crmType: '',
        request: null,
        recordRequest: crmIndexGetRecordListAPI,
        params: null,
        paging: true,
        sortable: false
      },

      // 排序
      sortLeft: [],
      sortRight: [],
      setSortShow: false,

      dataTypeDefault: 0, // 是否权限筛选默认
      timeDefault: 0, // 是否时间筛选默认
      defaultValue: {} // 默认值
    }
  },
  computed: {
    ...mapGetters([
      'userInfo',
      'collapse'
    ]),
    // 如果只筛选一个人则头像显示当前被筛选人的头像，否则显示默认错误头像
    avatarData() {
      if (this.filterValue.dataType === 'custom') {
        const userNames = (this.filterValue.users || [])
          .map(o => o.realname)
        const strucNames = (this.filterValue.strucs || [])
          .map(o => o.name)
        return {
          realname: userNames.concat(strucNames).join(','),
          img: ''
        }
      }

      if (this.filterValue.dataType == 1) {
        return this.userInfo
      }

      return {
        showIcon: true,
        realname: {
          1: '仅本人',
          2: '本人及下属',
          3: '仅本部门',
          4: '本部门及下属部门'
        }[this.filterValue.dataType]
      }
    },
    // 销售简报百分比提示语
    rateText() {
      if (this.filterValue.timeLine.type === 'custom') return ''
      const type = this.filterValue.timeLine.value || 'month'
      return {
        today: '较昨天',
        yesterday: '较前天',
        week: '较上周',
        lastWeek: '较前周',
        month: '较上月',
        lastMonth: '较前月',
        quarter: '较上季度',
        lastQuarter: '较上上季度',
        year: '较去年',
        lastYear: '较前年'
      }[type] || ''
    }
  },

  provide() {
    return {
      'workbench': this
    }
  },

  watch: {
    collapse() {
      setTimeout(() => {
        this.$bus.emit('window-resize')
      }, 300)
    },
    filterValue: {
      handler() {
        this.getBriefData()
      },
      deep: true
    }
  },
  async created() {
    await this.getDataTypeDefault()
    await this.getTimeDefault()
    // this.getBriefData() // 默认值获取 会触发 filterValue watch
    this.getModelSort()
  },
  mounted() {
    this.$nextTick(() => {
      window.addEventListener('resize', this.resizeFn)
    })
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.resizeFn)
    this.$bus.off('window-resize')
  },
  methods: {
    /**
     * 窗口尺寸发生改变实时调整 EChart 尺寸
     */
    resizeFn() {
      if (this.timer) return
      this.timer = setTimeout(() => {
        clearTimeout(this.timer)
        this.timer = null
      }, 30)
      this.$bus.emit('window-resize')
    },

    timeTypeChange(data) {
      this.filterValue.timeLine = data
      this.savefilter('time')
    },

    radioMenuSelect(val, data) {
      this.filterValue.dataType = this.filterDataType
      if (this.filterDataType != 'custom') {
        this.filterValue.users = []
        this.filterValue.strucs = []
        this.savefilter('dataType')
      } else {
        this.filterValue.users = data.users
        this.filterValue.strucs = data.strucs
        this.savefilter('dataType')
      }
    },

    /**
     * 获取数据权限筛选默认值
     */
    getDataTypeDefault(type) {
      return new Promise((resolve, reject) => {
        const params = {
          defaultType: 1
        }
        crmDefaultQueryByTypeAPI(params)
          .then(res => {
            if (res.data && res.data.defaultValue) {
              const data = JSON.parse(res.data.defaultValue)
              this.dataTypeDefault = 1
              this.filterDataType = data.dataType
              this.defaultValue = data
            } else {
              this.dataTypeDefault = 0
              this.filterDataType = 2
              this.defaultValue = {
                dataType: 2,
                users: [],
                strucs: [],
                timeLine: {
                  type: 'default',
                  value: 'month'
                }
              }
            }
            resolve()
          })
          .catch(() => {
            reject()
          })
      })
    },
    /**
     * 获取时间筛选默认值
     */
    getTimeDefault(type) {
      return new Promise((resolve, reject) => {
        const params = {
          defaultType: 2
        }
        crmDefaultQueryByTypeAPI(params)
          .then(res => {
            if (res.data && res.data.defaultValue) {
              const data = JSON.parse(res.data.defaultValue)
              this.timeDefault = 1
              this.filterTime = data
              this.defaultValue.timeLine = data
            } else {
              this.timeDefault = 0
              this.filterTime = 'month'
              this.defaultValue.timeLine = {
                type: 'default',
                value: 'month'
              }
            }
            this.filterValue = this.defaultValue
            resolve()
          })
          .catch(() => {
            reject()
          })
      })
    },
    /**
     * 保存筛选默认值
     * @param  type  dataType:人员类型 time: 时间类型
     */
    savefilter(type) {
      const params = {
        defaultType: type === 'dataType' ? '1' : '2'
      }
      if (type === 'dataType') {
        params.defaultValue = this.dataTypeDefault ? JSON.stringify(this.filterValue) : ''
      } else {
        params.defaultValue = this.timeDefault ? JSON.stringify(this.filterValue.timeLine) : ''
      }
      crmDefaultSaveAPI(params)
        .then(res => {

        })
        .catch(() => {

        })
    },

    /**
     * 获取请求参数
     */
    getBaseParams() {
      const params = {}
      if (this.filterDataType != 'custom') {
        params.dataType = this.filterDataType
      } else {
        params.deptList = (this.filterValue.strucs || [])
          .map(item => item.deptId)

        params.userList = (this.filterValue.users || [])
          .map(item => item.userId)
      }

      if (this.filterValue.timeLine.type) {
        if (this.filterValue.timeLine.type === 'custom') {
          params.dateFilter = 'custom'
          params.startDate = this.filterValue.timeLine.startTime.replace(/\./g, '-')
          params.endDate = this.filterValue.timeLine.endTime.replace(/\./g, '-')
        } else {
          params.dateFilter = this.filterValue.timeLine.value || ''
        }
      }
      return params
    },
    /**
     * 获取销售简报数据
     */
    getBriefData() {
      this.loading = true
      crmQueryBulletinAPI(this.getBaseParams()).then(res => {
        this.loading = false

        const resData = res.data || []
        // 6 展示数据  5 与其比较数据  1~6 图标展示数据
        const data = resData.length === 7 ? resData[6] : null
        if (data) {
          const preData = resData[5]
          this.briefList.forEach(item => {
            // 1~6 作为数据源
            const chartData = []
            for (let index = 1; index <= 6; index++) {
              const element = resData[index]
              chartData.push(element[item.field] || 0)
            }
            this.$set(item, 'chartData', chartData)

            const value = data[item.field] || 0
            if (item.field == 'contractMoney' ||
            item.field == 'businessMoney' ||
            item.field == 'receivablesMoney') {
              item.num = separator(value || 0)
            } else {
              item.num = value // 数量
            }

            const preValue = preData[item.field] || 0
            const diffValue = value - preValue
            if (diffValue !== 0) {
              // status状态   top 增长  bottom 下降 '' 持平 上升调整为 红色 下降调整为绿色
              item.status = diffValue > 0 ? 'top' : 'bottom'
              if (value === 0 || diffValue === 0) {
                item.rate = 0
              } else {
                item.rate = NP.times(NP.divide(diffValue, value), 100).toFixed(2) // 增长比例/下降比例
              }
            } else {
              item.status = ''
              item.rate = 0
            }
          })
        }
      }).catch(() => {
        this.loading = false
      })
    },

    /**
     * 销售简报查看
     */
    reportClick(item) {
      if (item.type) {
        this.reportData.title = `销售简报-${item.title}`
        this.reportData.placeholder = {
          customer: '客户联系人/手机/电话',
          contacts: '联系人姓名/手机/电话',
          business: '商机名称',
          business_status: '商机名称',
          contract: '合同名称',
          receivables: '回款编号',
          record: ''
        }[item.type]

        this.reportData.crmType = item.type
        this.reportData.params = this.getBaseParams()

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
          this.reportData.request = crmQueryRecordConuntAPI
          this.reportData.paging = false
          this.reportData.sortable = false
        } else {
          this.fieldReportList = null
          this.reportData.request = crmIndexIndexListAPI
          this.reportData.paging = true
          this.reportData.sortable = 'custom'

          // 合同金额回款金额 通过的
          if (item.field === 'receivablesMoney' || item.field === 'contractMoney' || item.field === 'contractCount') {
            this.reportData.params.checkStatus = 1

            // 合同金额 回款金额 新增合同 加入 moneyType 1合同 2回款
            this.reportData.params.moneyType = {
              contractMoney: 1,
              contractCount: 1,
              receivablesMoney: 2
            }[item.field]
          }
        }

        this.reportData.params.label = item.labelValue
        this.reportListShow = true
      }
    },

    /**
     * 排序
     */
    getModelSort() {
      /**
       * 1 合同金额目标及完成情况
       * 2 数据汇总
       * 3 回款金额目标及完成情况
       * 4 业绩指标完成率 (回款金额)
       * 5 销售漏斗
       * 6 遗忘提醒
       * 7 排行榜
       */

      crmIndexSortAPI().then(res => {
        const left = res.data.left || []
        const right = res.data.right || []

        // 2 回款和合同合并，展示保留其位置
        const components = ['SaleStatistics', 'DataStatistics', '', 'PerformanceChart', 'SalesFunnel', 'ForgetRemind', 'RankingStatistics']

        this.sortLeft = left.map(item => {
          item.component = components[item.modelId - 1]
          return item
        })

        this.sortRight = right.map(item => {
          item.component = components[item.modelId - 1]
          return item
        })
      }).catch()
    },

    /**
     * 图标点击 目前仅商机漏斗
     */
    chartClick(chartData, data) {
      // console.log('data: ', data)
      this.reportData.title = `销售漏斗-${data.settingName}`
      this.reportData.placeholder = '商机名称'
      this.reportData.crmType = 'business'
      this.reportData.params = this.getBaseParams()
      if (data.isEnd) {
        this.reportData.params.categoryId = data.flowId
        this.reportData.params.type = data.isEnd
        this.reportData.request = biBusinessWinOrFailDetailListAPI
      } else {
        const { dateFilter, endDate, startDate } = this.reportData.params
        this.reportData.params.searchList = [
          {
            formType: 'datetime',
            name: 'createTime',
            type: 14,
            values: dateFilter == 'custom' ? [startDate, endDate] : [dateFilter]
          }, {
            formType: 'business_cause',
            group: true,
            name: 'typeId',
            type: 1,
            values: [data.flowId]
          }, {
            formType: 'business_cause',
            name: 'statusId',
            stage: true,
            type: 1,
            values: [data.settingId]
          }
        ]

        this.reportData.request = biBusinessDetailListAPI
        this.reportData.params.type = 5
      }
      // this.reportData.params.entity = {
      //   formType: 'business_type',
      //   name: 'statusId',
      //   type: 1,
      //   values: (data.isEnd == 1 || data.isEnd == 2) ? [data.flowId, 0, data.isEnd] : [data.flowId, data.settingId]
      // }
      this.fieldReportList = null
      // this.reportData.request = crmInstrumentSellFunnelBusinessListAPI
      this.reportData.paging = true
      this.reportData.sortable = 'custom'
      this.reportData.params.label = 5
      this.reportListShow = true
      console.log(chartData, data)
    },

    /**
     * 拖动结束
     */
    dragEnd() {
      this.handleDragSave()
    },

    /**
     * 拖拽记录保存
     */
    handleDragSave() {
      const params = {}
      params.left = this.sortLeft.map(item => {
        return {
          isHidden: item.isHidden,
          modelId: item.modelId
        }
      })
      params.right = this.sortRight.map(item => {
        return {
          isHidden: item.isHidden,
          modelId: item.modelId
        }
      })

      crmIndexSetSortAPI(params)
        .then(() => {
        })
        .catch(() => {
        })
    }
  }
}
</script>

<style scoped lang="scss">
  .crm-workbench {
    position: relative;
    width: 100%;
    min-width: 1200px;
    height: 100%;
    padding: 24px 40px 0;

    &__hd {
      > .title {
        flex: 1;
        font-size: 24px;
      }

      .dropdown-btn {
        padding: 8px;
      }
    }

    &__body {
      padding: #{$--interval-base * 2} 0 0;
    }

    .el-icon-arrow-up {
      position: absolute;
      top: 9px;
      right: 5px;
      font-size: $--input-font-size;
      font-weight: bold;
      color: $--color-black;
      cursor: pointer;
      transition: transform 0.3s;
      transform: rotate(180deg);
    }

    .xr-radio-menu-wrap {
      /deep/ .el-input--no-bg {
        .el-input__inner {
          background: $--button-default-background-color;
          border: none;
        }
      }

      &.is-show {
        /deep/ .el-input--no-bg {
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
    }

    .head {
      position: relative;
      margin-top: #{$--interval-base * 3};

      .sort-btn {
        position: absolute;
        top: 0;
        right: 0;
      }
    }

    .brief-box {
      position: relative;
      width: 100%;
      background-color: white;
      border: 1px solid $--border-color-base;
      border-radius: $--border-radius-base;

      &::before {
        position: absolute;
        top: 0;
        right: 0;
        left: 0;
        height: 4px;
        content: " ";
        background-color: $--color-primary;
        border-radius: 2px;
      }

      .brief-title {
        padding: 16px 16px 0;

        .icon {
          padding: 3px;
          margin-right: $--interval-base;
          font-size: 12px;
          color: white;
          background-color: $--color-primary;
          border-radius: $--border-radius-base;
        }

        .text {
          font-size: 16px;
          font-weight: bold;
        }
      }

      .brief {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: flex-start;
        width: 100%;
        padding: $--interval-base $--interval-base #{$--interval-base * 2} $--interval-base;
      }
    }

    .section {
      padding-bottom: 40px;
      margin-top: 18px;

      .left {
        width: calc(50% - 10px);
        margin-right: 20px;

        &-content {
          height: 440px;
        }
      }

      .right {
        width: calc(50% - 10px);

        &-content {
          height: 440px;
        }
      }

      .left-content + .left-content,
      .right-content + .right-content {
        margin-top: 18px;
      }
    }

    /* 拖拽 */
    .component-item.sortable-ghost {
      margin-bottom: 18px;
      background-color: $--color-b50;
    }

    .component-item + .sortable-ghost {
      margin-top: 18px;
    }
  }
</style>
