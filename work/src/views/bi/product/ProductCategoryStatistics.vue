<template>
  <div
    v-loading="loading"
    class="main-container">
    <filtrate-handle-view
      :show-product-selct="true"
      title="产品分类销量分析"
      class="filtrate-bar"
      module-type="product"
      @load="loading=true"
      @change="getDataList" />
    <div class="content">
      <div class="axis-content">
        <div id="axismain" />
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
import BaseMixin from '../mixins/Base'
import * as echarts from 'echarts'
import { biProductCategoryAPI, biProductCategoryListAPI } from '@/api/bi/product'

import ReportList from '@/views/crm/workbench/components/ReportList'

export default {
  /** 产品分类销量分析 */
  name: 'ProductCategoryStatistics',
  components: {
    ReportList
  },
  mixins: [BaseMixin],
  data() {
    return {
      loading: false,
      axisOption: null,
      postParams: {},
      // 弹窗数据
      fieldReportList: null,
      reportListShow: false,
      reportData: {
        title: '',
        placeholder: '',
        crmType: 'product',
        request: biProductCategoryListAPI,
        params: null,
        paging: true,
        sortable: false
      },
      search: ''
    }
  },
  computed: {},
  mounted() {
    this.initAxis()

    this.chartObj.on('click', ({ data }) => {
      this.enterDetail(data)
    })
  },
  methods: {
    enterDetail(data) {
      this.reportData.title = data.name

      this.reportData = {
        ...this.reportData,
        params: {
          ...this.postParams,
          type: 4,
          categoryId: data.categoryId
        }
      }

      this.reportListShow = true
    },
    getDataList(params) {
      this.postParams = params
      this.loading = true
      biProductCategoryAPI(params)
        .then(res => {
          this.loading = false

          const numCounts = []
          const legendData = []
          for (let index = 0; index < res.data.length; index++) {
            const element = res.data[index]
            numCounts.push({ name: element.categoryName, value: element.num, categoryId: element.categoryId })
            legendData.push(element.categoryName)
          }
          this.axisOption.legend.data = legendData
          this.axisOption.series[0].data = numCounts
          this.chartObj.setOption(this.axisOption, true)
        })
        .catch(() => {
          this.loading = false
        })
    },
    /** 柱状图 */
    initAxis() {
      var chartObj = echarts.init(document.getElementById('axismain'))

      var option = {
        title: {
          text: '产品分类销售',
          x: 'center',
          bottom: '10'
        },
        color: this.chartColors,
        toolbox: this.toolbox,
        tooltip: {
          trigger: 'item',
          formatter: '{b} : {c}'
        },
        legend: {
          textStyle: this.chartDefaultOptions.label,
          orient: 'vertical',
          type: 'scroll',
          x: 'left',
          data: []
        },
        series: [
          {
            label: this.chartDefaultOptions.label,
            name: '',
            type: 'pie',
            radius: ['50%', '70%'],
            data: []
          }
        ]
      }

      chartObj.setOption(option, true)
      this.axisOption = option
      this.chartObj = chartObj
    }
  }
}
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
@import "../styles/detail.scss";
</style>
