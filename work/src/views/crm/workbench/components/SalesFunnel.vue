<template>
  <statistics-card
    v-loading="loading"
    icon="wk wk-funnel-solid"
    @unfold-change="handleUpdateUnfold">
    <template slot="title-left">销售漏斗<i class="wk wk-icon-fill-help wk-help-tips" data-type="4" data-id="20" /></template>

    <template slot="filter-left">
      <el-select
        v-model="flowId"
        mode="no-border"
        @change="handleCommand">
        <el-option
          v-for="item in flowList"
          :key="item.flowId"
          :label="item.flowName"
          :value="item.flowId" />
      </el-select>
    </template>

    <wk-toggle-button
      slot="title-right"
      v-model="dataType"
      @change="dataTypeChange">
      <wk-toggle-item
        v-for="item in dataOptions"
        :key="item.value"
        :label="item.name"
        :value="item.value" />
    </wk-toggle-button>
    <div id="sales-funnel" />
  </statistics-card>
</template>

<script>
import { crmIndexFunnelAPI } from '@/api/crm/workbench'
import { crmBusinessStatusListAPI } from '@/api/crm/business'

import { WkToggleButton, WkToggleItem } from '@/components/NewCom/WkToggleButton/index'

import * as echarts from 'echarts'
import ChartMixin from './ChartMixin'
import xrTheme from '@/styles/xr-theme.scss'

export default {
  name: 'SalesFunnel',
  components: {
    WkToggleButton,
    WkToggleItem
  },
  mixins: [ChartMixin],
  data() {
    return {
      chartOption: {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            // 坐标轴指示器，坐标轴触发有效 默认为直线，可选为：'line' | 'shadow'
            type: 'shadow'
          },
          formatter: function(datas) {
            const data = datas[0] || {}
            const info = data.data || {}
            return `${data.name}<br/> 商机个数：<span style="font-weight: 500;">${info.count}</span><br/> 商机金额：<span style="font-weight: 500;">${info.money} 元</span>`
          }
        },
        color: ['#0052CC '],
        legend: {
          data: [],
          // 图例文本格式化
          formatter: function(name) {
            return name.split('(')[0]
          },
          textStyle: {
            color: xrTheme.colorBlack,
            fontWeight: xrTheme.axisLabelFontWeight
          }
        },
        grid: {
          top: '20px',
          left: '10px',
          right: '30px',
          bottom: '20px',
          containLabel: true
        },
        xAxis: {
          max: 'dataMax'
        },
        yAxis: {
          type: 'category',
          axisTick: {
            show: false
          },
          axisLine: {
            show: true
            // lineStyle: { color: xrTheme.axisLineColor }
          },
          axisLabel: {
            // color: xrTheme.colorBlack,
            fontWeight: xrTheme.axisLabelFontWeight
          },
          splitLine: {
            lineStyle: {
              // color: xrTheme.axisLineColor
            }
          },
          data: []
        },
        series: [
          {
            type: 'bar',
            label: {
              color: xrTheme.colorBlack,
              fontWeight: xrTheme.axisLabelFontWeight
            },
            barMaxWidth: 20,
            data: []
          }
        ]
      },
      chartObj: null,
      loading: false,
      dataList: [],
      flowList: [],
      flowId: null,
      flowName: '',
      moneyList: [], // 金额数组
      countList: [], // 数量数组
      dataType: 1,
      dataOptions: [
        { name: '金额', value: 1 },
        { name: '数量', value: 2 }
      ]
    }
  },
  computed: {
    // 图标展示数据
    echartList() {
      return this.dataType === 1 ? this.moneyList : this.countList
    }
  },
  mounted() {
    this.initChart()
    this.getBusinessStatusList()
  },
  methods: {
    initChart() {
      this.chartObj = echarts.init(document.getElementById('sales-funnel'))
      this.chartObj.setOption(this.chartOption, true)
      this.chartObj.on('click', params => {
        const data = this.dataList[params.dataIndex] || {}
        data.flowId = this.flowId
        data.flowName = this.flowName
        this.$emit('chart-click', params, data)
      })
    },

    /**
     * 切换展开/闭合状态
     */
    handleUpdateUnfold(isUnfold) {
      if (isUnfold) {
        this.$nextTick(() => {
          this.initChart()
        })
      }
    },

    /**
     * 数据类型change
     */
    dataTypeChange() {
      this.chartOption.series[0].data = this.echartList
      this.chartObj.setOption(this.chartOption, true)
    },

    /**
     * 获取统计数据
     */
    getData() {
      if (!this.flowId) return
      this.loading = true
      crmIndexFunnelAPI({
        ...this.getBaseParams(),
        typeId: this.flowId
      }).then(res => {
        this.loading = false

        this.dataList = (res.data || []).reverse() // 翻转数据保证上下顺序展示正确
        const yAxis = []
        // 数量 金额 数据
        const moneyList = []
        const countList = []
        for (let index = 0; index < this.dataList.length; index++) {
          const element = this.dataList[index]
          yAxis.push(element.settingName)
          moneyList.push({
            name: element.settingName,
            value: element.businessMoney || 0,
            money: element.businessMoney || 0,
            count: element.businessNum || 0
          })
          countList.push({
            name: element.settingName,
            value: element.businessNum || 0,
            money: element.businessMoney || 0,
            count: element.businessNum || 0
          })
        }

        this.moneyList = moneyList
        this.countList = countList

        this.chartOption.series[0].data = this.echartList
        this.chartOption.yAxis.data = yAxis
        this.chartOption.legend.data = yAxis
        this.chartObj.setOption(this.chartOption, true)
      }).catch(() => {
        this.loading = false
      })
    },

    /**
     * 获取商机状态组
     */
    getBusinessStatusList() {
      this.loading = true
      crmBusinessStatusListAPI().then(res => {
        const list = res.data || []
        this.flowList = list
        if (this.flowList.length > 0) {
          this.flowId = this.flowList[0].flowId
          this.flowName = this.flowList[0].flowName
          this.handleCommand()
        } else {
          this.loading = false
        }
      }).catch(() => {
        this.loading = false
      })
    },

    /**
     * 下拉菜单选项选择
     * @param index 选项序号
     */
    handleCommand() {
      if (this.flowId) {
        this.flowList.map(item => {
          if (item.flowId == this.flowId) {
            this.flowName = item.flowName
          }
        })
        this.getData()
      }
    }
  }
}
</script>

<style scoped lang="scss">
  @import "style";

  #sales-funnel {
    width: 100%;
    height: 320px;
    margin-top: 10px;
  }

  .sales-funnel {
    position: relative;

    .card-title-left .icon {
      color: $--color-g300;
    }

    .el-dropdown-selfdefine {
      display: inline-block;
      cursor: pointer;
    }
  }
</style>
