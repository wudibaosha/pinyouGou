
<template>
  <div
    v-loading="loading"
    class="main-container">
    <filtrate-handle-view
      title="客户总量分析"
      class="filtrate-bar"
      module-type="customer"
      @load="loading=true"
      @change="searchClick" />
    <div class="content">
      <div class="axis-content">
        <div id="axismain" />
      </div>
      <div class="table-content">
        <div class="handle-bar">
          <el-button
            class="export-btn"
            @click="exportClick">导出</el-button>
        </div>
        <el-table
          v-if="showTable"
          :data="list"
          :cell-class-name="cellClassName"
          :class="WKConfig.tableStyle.class"
          :stripe="WKConfig.tableStyle.stripe"
          :summary-method="getSummaries"
          height="400"
          show-summary
          highlight-current-row
          @row-click="handleRowClick"
          @sort-change="({ prop, order }) => mixinSortFn(list, prop, order)">
          <el-table-column
            v-for="(item, index) in fieldList"
            :key="index"
            :prop="item.field"
            :label="item.name"
            min-width="130"
            sortable="custom"
            align="center"
            header-align="center"
            show-overflow-tooltip />
        </el-table>
      </div>
    </div>

    <!-- 汇报列表 (详情)-->
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
import BaseMixin from '../mixins/Base'
import SortMixin from '../mixins/Sort'
import DetailMixin from '@/views/bi/mixins/Detail'
import SummaryMixin from '../mixins/Summary'
import * as echarts from 'echarts'

import {
  biCustomerTotalListAPI,
  biCustomerTotalAPI,
  biCustomerTotalListExportAPI,
  biCustomerDetailListAPI
} from '@/api/bi/customer'
import {
  biContractDetailListAPI
} from '@/api/bi/bi'
import {
  biReceivablesDetailListAPI
} from '@/api/bi/achievement'

export default {
  /** 客户总量分析 */
  name: 'CustomerTotalStatistics',
  mixins: [BaseMixin, SortMixin, SummaryMixin, DetailMixin],
  data() {
    return {
      loading: false,

      axisOption: null,

      postParams: {}, // 筛选参数
      dataIndex: null,

      list: [],
      axisList: [],
      fieldList: [
        { field: 'realname', name: '员工姓名', sortable: true },
        { field: 'customerNum', name: '新增客户数', sortable: true },
        { field: 'dealCustomerNum', name: '成交客户数', sortable: true },
        { field: 'dealCustomerRate', name: '客户成交率(%)', sortable: true },
        { field: 'contractMoney', name: '合同总金额', sortable: true },
        { field: 'receivablesMoney', name: '回款金额', sortable: true }
      ],
      // 可以点击的数据
      detailFields: [
        {
          name: 'customerNum',
          crmType: 'customer',
          request: biCustomerDetailListAPI,
          params: null
        },
        {
          name: 'dealCustomerNum',
          crmType: 'customer',
          request: biCustomerDetailListAPI,
          params: null
        },
        {
          name: 'dealCustomerRate',
          crmType: 'customer',
          request: biCustomerDetailListAPI,
          params: null
        },
        {
          name: 'contractMoney',
          crmType: 'contract',
          timeName: 'orderDate',
          request: biContractDetailListAPI,
          params: null
        },
        {
          name: 'receivablesMoney',
          crmType: 'receivables',
          timeName: 'returnTime',
          request: biReceivablesDetailListAPI,
          params: null
        }
      ]
    }
  },
  mounted() {
    this.initAxis()
  },
  methods: {
    /**
     * 搜索点击
     */
    searchClick(params) {
      this.postParams = params
      this.getDataList()
      this.getRecordList()
    },
    /**
     * 图表数据
     */
    getDataList() {
      this.loading = true
      biCustomerTotalAPI(this.postParams)
        .then(res => {
          this.loading = false
          const list = res.data || []
          this.axisList = list
          const dealData = []
          const numData = []
          const legendData = []
          for (let index = 0; index < list.length; index++) {
            const element = list[index]
            dealData.push(element.dealCustomerNum)
            numData.push(element.customerNum)
            legendData.push(element.type)
          }

          this.axisOption.xAxis[0].data = legendData
          this.axisOption.series[0].data = dealData
          this.axisOption.series[1].data = numData

          this.chartObj.setOption(this.axisOption, true)
        })
        .catch(() => {
          this.loading = false
        })
    },
    /**
     * 获取相关列表
     */
    getRecordList(dataIndex) {
      this.dataIndex = dataIndex
      this.list = []
      this.loading = true
      biCustomerTotalListAPI(this.postParams)
        .then(res => {
          this.loading = false
          this.list = res.data || []
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 表尾合计行
     * @param params
     * @return {*[]}
     */
    getSummaries(params) {
      const { columns, data } = params
      const sums = []
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = '合计'
          return
        }
        if (index === 3) {
          sums[index] = ''
          return
        }
        const values = data.map(item => Number(item[column.property]))
        if (!values.every(value => isNaN(value))) {
          sums[index] = values.reduce((prev, curr) => {
            const value = Number(curr)
            if (!isNaN(value)) {
              return prev + curr
            } else {
              return prev
            }
          }, 0)
        } else {
          sums[index] = ''
        }
      })

      return sums
    },

    /** 柱状图 */
    initAxis() {
      this.chartObj = echarts.init(document.getElementById('axismain'))
      this.chartObj.on('click', params => {
        // seriesIndex	1：跟进客户数 2:跟进次数  dataIndex 具体的哪条数据
        this.getRecordList(params.dataIndex)
      })

      this.axisOption = {
        color: this.echartLineBarColors,
        toolbox: this.toolbox,
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            // 坐标轴指示器，坐标轴触发有效
            type: 'shadow' // 默认为直线，可选为：'line' | 'shadow'
          }
        },
        legend: {
          data: ['成交客户数', '新增客户数'],
          ...this.chartDefaultOptions.legend
        },
        grid: this.chartDefaultOptions.grid,
        xAxis: [
          {
            type: 'category',
            data: [],
            ...this.chartXAxisStyle
          }
        ],
        yAxis: [
          {
            type: 'value',
            name: '新增客户数',
            ...this.getChartYAxisStyle({
              axisLabel: {
                formatter: '{value}个'
              }
            })
          }
        ],
        series: [
          {
            name: '成交客户数',
            type: 'bar',
            yAxisIndex: 0,
            barMaxWidth: 15,
            data: []
          },
          {
            name: '新增客户数',
            type: 'bar',
            yAxisIndex: 0,
            barMaxWidth: 15,
            data: []
          }
        ]
      }
    },

    /**
     * 导出点击
     */
    exportClick() {
      this.requestExportInfo(biCustomerTotalListExportAPI, this.postParams)
    },

    handleRowClick(row, column) {
      if (this.getDetailFieldList(column)) {
        const { values } = this.getValues(row, column)
        const searchList = [

          {
            formType: 'user',
            name: 'ownerUserId',
            type: 3,
            values: [row.userId]
          }
        ]

        if (column.property == 'customerNum') {
          searchList.push({
            formType: 'datetime',
            name: 'createTime',
            type: 14,
            values
          })
        } else if (['dealCustomerRate', 'dealCustomerNum'].includes(column.property)) {
          const list = [
            {
              formType: 'datetime',
              name: 'createTime',
              type: 14,
              values
            },
            {
              formType: 'dealStatus',
              name: 'dealStatus',
              type: 1,
              values: [1]
            }
          ]
          searchList.push(...list)
        } else if (column.property == 'contractMoney') {
          const list = [
            {
              formType: 'date',
              name: 'orderDate',
              type: 14,
              values
            }, {
              formType: 'checkStatus',
              name: 'checkStatus',
              type: 1,
              values: [1, 10]
            }
          ]
          searchList.push(...list)
        } else if (column.property == 'receivablesMoney') {
          const list = [
            {
              formType: 'date',
              name: 'returnTime',
              type: 14,
              values
            }, {
              formType: 'checkStatus',
              name: 'checkStatus',
              type: 1,
              values: [1, 10]
            }
          ]
          searchList.push(...list)
        }

        const params = {
          dataType: this.postParams.dataType,
          searchList,
          limit: 15,
          page: 1,
          search: '',
          type: 2
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
</style>

