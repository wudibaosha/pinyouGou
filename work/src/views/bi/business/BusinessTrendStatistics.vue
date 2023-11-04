<template>
  <div
    v-loading="loading"
    class="main-container">
    <filtrate-handle-view
      title="新增商机"
      class="filtrate-bar"
      module-type="business"
      @load="loading=true"
      @change="searchClick" />
    <div class="content">
      <div class="axis-content">
        <div id="axismain" />
      </div>
      <div class="table-content">
        <el-table
          :data="list"
          :class="WKConfig.tableStyle.class"
          :stripe="WKConfig.tableStyle.stripe"
          :cell-class-name="cellClassName"
          height="150"
          highlight-current-row
          @row-click="handleRowClick">
          <el-table-column
            v-for="(item, index) in fieldList"
            :key="index"
            :prop="item.field"
            :label="item.name"
            align="center"
            header-align="center"
            show-overflow-tooltip />
        </el-table>
      </div>
    </div>

    <!-- 销售简报列表 -->
    <report-list
      :show.sync="reportListShow"
      :title="reportData.title"
      crm-type="business"
      :placeholder="reportData.placeholder"
      :request="reportData.request"
      :params="reportData.params"
      :field-list="fieldReportList" />

  </div>
</template>

<script>
import {
  biBusinessTrendAPI,
  biBusinessDetailListAPI
  // biBusinessTrendListAPI
} from '@/api/bi/business'

import ReportList from '@/views/crm/workbench/components/ReportList'

import BaseMixin from '../mixins/Base'
import * as echarts from 'echarts'
import { getDate } from '@/views/bi/data'

export default {
  /** 新增商机数与金额趋势分析 */
  name: 'BusinessTrendStatistics',
  components: {
    ReportList
  },
  mixins: [BaseMixin],
  data() {
    return {
      loading: false,
      axisOption: null,

      list: [],

      postParams: {}, // 筛选参数
      axisList: [],
      fieldList: [],

      reportListShow: false,
      fieldReportList: null,
      reportData: {
        title: '',
        placeholder: '',
        request: null,
        params: null
      }

    }
  },
  computed: {},
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
    },
    /**
     * 图表数据
     */
    getDataList() {
      this.loading = true
      biBusinessTrendAPI(this.postParams)
        .then(res => {
          this.loading = false
          this.axisList = res.data || []

          // 循环表头
          const fieldList = [{
            name: '日期',
            field: 'name'
          }]

          const moneyCounts = []
          const numCounts = []
          const xAxis = []

          // 转化率table展示数据
          const listData = {
            name: '数量'
          }
          for (let index = 0; index < this.axisList.length; index++) {
            const element = this.axisList[index]
            moneyCounts.push(element.businessMoney)
            numCounts.push(element.businessNum)
            xAxis.push(element.type)

            fieldList.push({
              name: `${element.type}`,
              field: `type${index}`
            })
            listData[`type${index}`] = element.businessNum
          }

          this.fieldList = fieldList
          this.list = [listData]

          this.axisOption.xAxis[0].data = xAxis
          this.axisOption.series[0].data = moneyCounts
          this.axisOption.series[1].data = numCounts
          this.chartObj.setOption(this.axisOption, true)
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 通过回调控制class
     */
    cellClassName({ row, column, rowIndex, columnIndex }) {
      if (columnIndex) {
        return 'can-visit--underline'
      }
      return ''
    },

    /**
     * 列表点击
     */
    handleRowClick(row, column, event) {
      if (column.property !== 'name') {
        this.reportData.title = `${column.label}详情`
        this.reportData.request = biBusinessDetailListAPI

        const values = getDate(column.label, this.postParams.dateFilter)

        this.postParams.searchList = [
          {
            formType: 'datetime',
            name: 'createTime',
            type: 14,
            values: values
          }
        ]

        const params = { ...this.postParams, dataType: this.postParams.dataType }
        params.type = 5
        this.reportData.params = params
        this.reportListShow = true
      }
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
          data: ['新增商机金额', '新增商机数量'],
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
            name: '新增商机金额',
            ...this.getChartYAxisStyle({
              axisLabel: {
                formatter: '{value}元'
              }
            })
          },
          {
            type: 'value',
            name: '新增商机数量',
            ...this.getChartYAxisStyle({
              axisLabel: {
                formatter: '{value}个'
              },
              splitLine: {
                show: true
              }
            })
          }
        ],
        series: [
          {
            ...this.chartDefaultOptions.seriesLine,
            name: '新增商机金额',
            type: 'line',
            yAxisIndex: 0,
            data: []
          },
          {
            ...this.chartDefaultOptions.seriesLine,
            name: '新增商机数量',
            type: 'line',
            yAxisIndex: 1,
            data: []
          }
        ]
      }

      chartObj.setOption(option, true)
      chartObj.on('click', params => {
        // seriesIndex	1：新增商机金额 2:新增商机数量  dataIndex 具体的哪条数据
        // this.getRecordList(params.dataIndex)
      })
      this.axisOption = option
      this.chartObj = chartObj
    }
  }
}
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
@import "../styles/detail.scss";
</style>
