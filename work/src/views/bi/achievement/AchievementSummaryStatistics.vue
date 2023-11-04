<template>
  <div
    v-loading="loading"
    class="main-container">
    <filtrate-handle-view
      :show-year-select="true"
      title="合同汇总表"
      class="filtrate-bar"
      module-type="contract"
      @load="loading=true"
      @change="getDataList">
      <el-button
        class="export-button"
        type="primary"
        @click.native="exportClick">导出</el-button>
    </filtrate-handle-view>
    <div class="content">
      <div class="content-title">
        签约合同数：{{ data.totalCount }}个；签约合同金额：<span class="special">{{ data.totalContractMoney }}</span>元；回款金额：<span class="special">{{ data.totalReceivablesMoney }}</span>元；未收款金额：<span class="special">{{ data.totalUnreceivedMoney }}</span>元</div>
      <div class="table-content">
        <el-table
          v-if="showTable"
          :data="list"
          :class="WKConfig.tableStyle.class"
          :stripe="WKConfig.tableStyle.stripe"
          :height="tableHeight"
          highlight-current-row
          :cell-class-name="cellClassName"
          @sort-change="({ prop, order }) => mixinSortFn(list, prop, order)"
          @row-click="handleRowClick">
          <el-table-column
            v-for="(item, index) in fieldList"
            :key="index"
            :prop="item.field"
            :label="item.name"
            sortable="custom"
            align="center"
            header-align="center"
            show-overflow-tooltip />
        </el-table>
      </div>
    </div>

    <report-list
      :show.sync="reportListShow"
      :title="reportData.title"
      :placeholder="reportData.placeholder"
      :crm-type="reportData.crmType"
      :request="reportData.request"
      :params="reportData.params"
      :record-request="reportData.recordRequest"
      :paging="reportData.paging"
      :sortable="reportData.sortable" />

  </div>
</template>

<script>
import SortMixin from '../mixins/Sort'
import BaseMixin from '../mixins/Base'
import DetailMixin from '../mixins/Detail'

import { biAchievementSummaryAPI, biAchievementSummaryExportAPI } from '@/api/bi/achievement'
import {
  biContractDetailListAPI
} from '@/api/bi/bi'
import {
  biReceivablesDetailListAPI
} from '@/api/bi/achievement'

import FiltrateHandleView from '../components/FiltrateHandleView'
import NP from 'number-precision'

export default {
  /** 合同汇总表 */
  name: 'AchievementSummaryStatistics',
  components: {
    FiltrateHandleView
  },
  mixins: [BaseMixin, SortMixin, DetailMixin],
  data() {
    return {
      loading: false,
      tableHeight: document.documentElement.clientHeight - 210,

      postParams: {}, // 筛选参数

      list: [],
      data: {
        totalReceivablesMoney: 0,
        totalCount: 0,
        totalContractMoney: 0,
        totalUnreceivedMoney: 0
      },
      fieldList: [
        { field: 'type', name: '日期' },
        { field: 'contractNum', name: '签约合同数（个）' },
        { field: 'contractMoney', name: '签约合同金额（元）' },
        { field: 'receivablesMoney', name: '回款金额（元）' }
      ],

      // 可以点击的数据
      detailFields: [
        {
          name: 'contractNum',
          padDate: true,
          crmType: 'contract',
          timeName: 'orderDate',
          list: [{
            formType: 'checkStatus',
            name: 'checkStatus',
            type: 1,
            values: [1, 10]
          }],
          request: biContractDetailListAPI
        },
        {
          name: 'contractMoney',
          padDate: true,
          crmType: 'contract',
          timeName: 'orderDate',
          list: [{
            formType: 'checkStatus',
            name: 'checkStatus',
            type: 1,
            values: [1, 10]
          }],
          request: biContractDetailListAPI
        },
        {
          name: 'receivablesMoney',
          padDate: true,
          crmType: 'receivables',
          timeName: 'returnTime',
          list: [{
            formType: 'checkStatus',
            name: 'checkStatus',
            type: 1,
            values: [1, 10]
          }],
          request: biReceivablesDetailListAPI
        }
      ]
    }
  },
  computed: {},
  mounted() {
    /** 控制table的高度 */
    window.onresize = () => {
      this.tableHeight = document.documentElement.clientHeight - 210
    }
  },
  methods: {
    getDataList(params) {
      this.postParams = params
      this.loading = true
      biAchievementSummaryAPI(params)
        .then(res => {
          this.list = res.data || []

          let totalCount = 0
          let totalContractMoney = 0
          let totalReceivablesMoney = 0
          this.list.forEach(item => {
            totalCount = NP.plus(totalCount, Number(item.contractNum) || 0)
            totalContractMoney = NP.plus(totalContractMoney, Number(item.contractMoney) || 0)
            totalReceivablesMoney = NP.plus(totalReceivablesMoney, Number(item.receivablesMoney) || 0)
          })
          this.data = {
            totalCount,
            totalContractMoney,
            totalReceivablesMoney,
            totalUnreceivedMoney: NP.minus(totalContractMoney, totalReceivablesMoney)
          }
          this.loading = false
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 导出点击
     */
    exportClick() {
      this.requestExportInfo(biAchievementSummaryExportAPI, this.postParams)
    },

    handleRowClick(row, column) {
      if (this.getDetailFieldList(column)) {
        const result = ['contractNum', 'contractMoney'].includes(column.property)
        const { values } = this.getValues(row, column)
        const searchList = [
          {
            formType: 'date',
            name: result ? 'orderDate' : 'returnTime',
            type: 14,
            values
          },
          {
            formType: 'checkStatus',
            name: 'checkStatus',
            type: 1,
            values: [1, 10]
          }
        ]

        const params = {
          dataType: this.postParams.dataType,
          searchList,
          limit: 15,
          page: 1,
          search: '',
          type: result ? 6 : 7
        }

        const field = this.getCurrentClickField(column)
        this.reportData = {
          ...this.reportData,
          ...field,
          title: column.label,
          params
        }

        this.reportListShow = true
      }
    }
  }
}
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
@import "../styles/detail.scss";

.content-title {
  padding-bottom: 15px;

  .special {
    margin-right: 3px;
    font-weight: bold;
  }
}
</style>
