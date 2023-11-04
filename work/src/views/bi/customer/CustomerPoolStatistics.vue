<template>
  <div
    v-loading="loading"
    class="main-container">
    <filtrate-handle-view
      title="公海客户分析"
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
          :cell-class-name="cellClassName"
          :data="list"
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
import SummaryMixin from '../mixins/Summary'
import DetailMixin from '@/views/bi/mixins/Detail'

import * as echarts from 'echarts'
import {
  biCustomerPoolAPI,
  biCustomerPoolListAPI,
  biCustomerPoolListExportAPI,
  biCustomerDetailListAPI
} from '@/api/bi/customer'

export default {
  /** 公海客户分析 */
  name: 'CustomerPoolStatistics',
  mixins: [BaseMixin, SortMixin, SummaryMixin, DetailMixin],
  data() {
    return {
      loading: false,
      axisOption: null,

      list: [],

      postParams: {}, // 筛选参数
      dataIndex: null,

      axisList: [],
      fieldList: [
        { field: 'realname', name: '姓名' },
        { field: 'deptName', name: '部门' },
        { field: 'receiveNum', name: '公海池领取客户数' },
        { field: 'putInNum', name: '进入公海客户数' }
      ],
      isSeas: true,
      // 可以点击的数据
      detailFields: [
        {
          name: 'receiveNum',
          crmType: 'customer',
          request: biCustomerDetailListAPI,
          params: null
        }
        // {
        //   name: 'putInNum',
        //   list: [],
        //   request: biPoolDetailListAPI,
        //   params: null
        // }
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
      biCustomerPoolAPI(this.postParams)
        .then(res => {
          this.loading = false
          this.axisList = res.data || []

          const putCounts = []
          const receiveCounts = []
          const xAxis = []
          for (let index = 0; index < res.data.length; index++) {
            const element = res.data[index]
            putCounts.push(element.putInNum)
            receiveCounts.push(element.receiveNum)
            xAxis.push(element.type)
          }
          this.axisOption.xAxis[0].data = xAxis
          this.axisOption.series[0].data = putCounts
          this.axisOption.series[1].data = receiveCounts
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
      biCustomerPoolListAPI(this.postParams)
        .then(res => {
          this.loading = false
          this.list = res.data || []
        })
        .catch(() => {
          this.loading = false
        })
    },
    /** 柱状图 */
    initAxis() {
      var chartObj = echarts.init(document.getElementById('axismain'))

      var option = {
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
          data: ['进入公海客户数', '公海池领取客户数'],
          ...this.chartDefaultOptions.legend
        },
        grid: {
          ...this.chartDefaultOptions.grid,
          right: '40px'
        },
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
            name: '进入公海客户数',
            ...this.getChartYAxisStyle({
              axisLabel: {
                formatter: '{value}个'
              }
            })
          },
          {
            type: 'value',
            name: '公海池领取客户数',
            ...this.getChartYAxisStyle({
              axisLabel: {
                formatter: '{value}次'
              },
              splitLine: {
                show: true
              }
            })
          }
        ],
        series: [
          {
            name: '进入公海客户数',
            type: 'bar',
            yAxisIndex: 0,
            barMaxWidth: 15,
            data: []
          },
          {
            name: '公海池领取客户数',
            type: 'bar',
            yAxisIndex: 1,
            barMaxWidth: 15,
            data: []
          }
        ]
      }

      chartObj.setOption(option, true)
      chartObj.on('click', params => {
        // seriesIndex	1：进入公海客户数 2:公海池领取客户数  dataIndex 具体的哪条数据
        this.getRecordList(params.dataIndex)
      })
      this.axisOption = option
      this.chartObj = chartObj
    },

    /**
     * 导出点击
     */
    exportClick() {
      this.requestExportInfo(biCustomerPoolListExportAPI, this.postParams)
    },

    handleRowClick(row, column) {
      if (this.getDetailFieldList(column)) {
        const { values } = this.getValues(row, column)
        const searchList = [
          {
            formType: 'datetime',
            name: 'createTime',
            type: 14,
            values
          },
          {
            formType: 'text',
            name: 'isReceive',
            type: 1,
            values: [2]
          },
          {
            formType: 'user',
            name: 'ownerUserId',
            type: 3,
            values: [row.userId]
          }
        ]

        const params = {
          dataType: this.postParams.dataType,
          searchList,
          limit: 15,
          page: 1,
          search: '',
          type: 9
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
