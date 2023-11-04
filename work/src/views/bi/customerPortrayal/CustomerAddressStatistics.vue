<template>
  <div
    v-loading="loading"
    class="main-container">
    <filtrate-handle-view
      title="客户城市分布分析"
      class="filtrate-bar"
      module-type="customer"
      @load="loading=true"
      @change="getDataList" />
    <flexbox class="content">
      <flexbox-item>
        <div class="axis-content">
          <div
            id="allChart"
            class="axismain" />
        </div>
      </flexbox-item>
      <flexbox-item>
        <div class="axis-content">
          <div
            id="dealChart"
            class="axismain" />
        </div>
      </flexbox-item>
    </flexbox>

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
import chinaJson from '@/assets/map/json/china.json'
import { biAchievementAnalysisAPI } from '@/api/bi/customerPortrayal'
import { biCustomerDetailListAPI } from '@/api/bi/customer.js'

import ReportList from '@/views/crm/workbench/components/ReportList'

export default {
  /** 城市分布分析 */
  name: 'CustomerAddressStatistics',
  components: {
    ReportList
  },
  mixins: [BaseMixin],
  data() {
    return {
      loading: false,
      allOption: null,
      dealOption: null,
      chartObj: null,
      chartOtherObj: null,
      postParams: {},
      // 弹窗数据
      fieldReportList: null,
      reportListShow: false,
      reportData: {
        title: '',
        placeholder: '',
        crmType: 'customer',
        request: biCustomerDetailListAPI,
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

    this.chartObj.on('click', data => {
      this.enterDetail(data.name)
    })

    this.chartOtherObj.on('click', data => {
      this.enterDetail(data.name, true)
    })
  },
  methods: {
    enterDetail(city, deal = false) {
      this.reportData.title = deal ? `${city}（成交客户）` : `${city}（所有客户）`
      let lastDate = ''
      if (this.postParams.padDate) {
        const [one] = this.postParams.startDate.split('-')
        lastDate = `${Number(one) + 1}-01-01`
      }

      const values = this.postParams.dateFilter == 'custom'
        ? [`${this.postParams.startDate}`, this.postParams.endDate || lastDate]
        : [this.postParams.dateFilter]

      const searchList = [
        {
          formType: 'datetime',
          name: 'createTime',
          type: 14,
          values: values
        }, {
          formType: 'map_address',
          name: 'address',
          type: 3,
          values: [city]
        }
      ]

      if (deal) {
        searchList.push({
          formType: 'dealStatus',
          name: 'dealStatus',
          type: 1,
          values: [1]
        })
      }

      this.reportData = {
        ...this.reportData,
        params: {
          search: this.search,
          type: 2,
          dataType: this.postParams.dataType,
          searchList
        }
      }

      if (this.postParams.dataType == 0) {
        this.reportData.params.deptList = this.postParams.deptList
        this.reportData.params.userList = this.postParams.userList
      }
      this.reportListShow = true
    },
    random() {
      return Math.floor(Math.random() * 100)
    },
    getDataList(params) {
      this.postParams = params
      this.loading = true
      biAchievementAnalysisAPI(params)
        .then(res => {
          this.loading = false

          const allData = []
          const dealData = []
          const arr = [
            '省',
            '市',
            '自治区',
            '回族自治区',
            '特别行政区',
            '壮族自治区',
            '维吾尔自治区'
          ]
          const reg = new RegExp(`[${arr.join('|')}]`, 'g');
          (res.data || []).forEach(item => {
            const name = item.type.replace(reg, '')
            if (item.allCustomer) {
              allData.push({
                name,
                value: item.allCustomer
              })
            }

            if (item.dealCustomer) {
              dealData.push({
                name,
                value: item.dealCustomer
              })
            }
          })

          this.allOption.series[0].data = allData
          this.dealOption.series[0].data = dealData
          this.chartObj.setOption(this.allOption, true)
          this.chartOtherObj.setOption(this.dealOption, true)
        })
        .catch(() => {
          this.loading = false
        })
    },
    /** 柱状图 */
    initAxis() {
      echarts.registerMap('china', chinaJson)
      this.chartObj = echarts.init(document.getElementById('allChart'))
      this.chartOtherObj = echarts.init(document.getElementById('dealChart'))
      this.allOption = this.getChartOptione('全部客户')
      this.dealOption = this.getChartOptione('成交客户')
      this.chartObj.setOption(this.allOption, true)
      this.chartOtherObj.setOption(this.dealOption, true)
    },
    getChartOptione(title) {
      return {
        title: {
          text: title,
          left: 'center',
          bottom: 0
        },
        tooltip: {
          trigger: 'item',
          formatter: function(data) {
            if (data.value) {
              return data.name + '<br/>' + (data.value || '-') + '（个）'
            }
          }
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          data: ['客户数']
        },
        visualMap: {
          min: 0,
          max: 50,
          left: 'left',
          top: 'bottom',
          text: ['多', '少'], // 文本，默认为数值文本
          calculable: true,
          inRange: {
            color: ['lightskyblue', 'yellow', 'orangered']
          },
          textStyle: this.chartDefaultBase.label
        },
        toolbox: {
          show: true,
          orient: 'vertical',
          left: 'right',
          top: 'center',
          feature: {
            mark: { show: true },
            dataView: { show: true, readOnly: false, optionToContent: function(opt) {
              var data = opt.series[0].data
              var table = '<table style="width:100%;text-align:center"><tbody><tr>' +
                 '<td>城市</td>' +
                 '<td>客户数</td>' +
                 '</tr>'
              for (var i = 0, l = data.length; i < l; i++) {
                table += '<tr>' +
                 '<td>' + data[i].name + '</td>' +
                 '<td>' + data[i].value + '</td>' +
                 '</tr>'
              }
              table += '</tbody></table>'
              return table
            } },
            restore: { show: true },
            saveAsImage: { show: true }
          }
        },
        series: [
          {
            name: '',
            type: 'map',
            mapType: 'china',
            showLegendSymbol: false,
            itemStyle: {
              normal: { label: { show: true }, borderColor: '#ccc' },
              emphasis: { label: { show: true }}
            },
            data: []
          }
        ]
      }
    }
  }
}
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
@import "../styles/detail.scss";
</style>
