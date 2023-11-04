import BaseMixin from './Base'
import * as echarts from 'echarts'
import {
  biAchievementAnalysisAPI,
  biAchievementAnalysisExportAPI,
  biReceivablesDetailListAPI
} from '@/api/bi/achievement'
import {
  biContractDetailListAPI
} from '@/api/bi/bi'
import moment from 'moment'

export default {
  data() {
    return {
      axisOption: null,

      loading: false,

      postParams: {}, // 筛选参数

      list: [],
      fieldList: [],
      type: '',
      typeName: '',
      typeUnit: '',

      reportListShow: false,
      reportData: {
        title: '',
        placeholder: '',
        request: null,
        params: null
      }
    }
  },

  components: {},

  mixins: [BaseMixin],

  props: {},

  computed: {},

  watch: {},

  mounted() {
    if (this.type === 'back') {
      this.typeName = '回款金额'
      this.typeUnit = '(元)'
    } else if (this.type === 'count') {
      this.typeName = '合同数量'
      this.typeUnit = '（个）'
    } else if (this.type === 'money') {
      this.typeName = '合同金额'
      this.typeUnit = '(元)'
    }
    this.initAxis()
  },

  methods: {
    getDataList(params) {
      this.loading = true
      this.postParams = params
      biAchievementAnalysisAPI({
        ...this.postParams,
        tableType: this.type
      })
        .then(res => {
          this.loading = false

          const list = [
            { name: '当月' + this.typeName + this.typeUnit, dateType: 'days' },
            { name: '环比增长（%）', dateType: 'month' },
            { name: '同比增长（%）', dateType: 'year' }
          ]
          const fieldList = [{
            field: 'name',
            name: '日期'
          }]
          res.data.forEach((item, index) => {
            const fieldKey = `value${index}`
            fieldList.push({
              field: fieldKey,
              name: item.type
            })

            const keys = [
              'monthNum',
              'pervMonthNum',
              'prevYearNum'
            ]
            keys.forEach((key, keyIndex) => {
              list[keyIndex][fieldKey] = item[key]
            })
          })
          this.fieldList = fieldList
          this.list = list

          const monthData = [] // 当月
          const chainRatioData = [] // 环比上月
          const yearOnYearData = [] // 同比上月
          const xAxis = [] // x 轴
          for (let index = 0; index < res.data.length; index++) {
            const element = res.data[index]
            monthData.push(element.monthNum)
            chainRatioData.push(element.pervMonthNum)
            yearOnYearData.push(element.prevYearNum)
            xAxis.push(element.type)
          }
          this.axisOption.xAxis[0].data = xAxis
          this.axisOption.series[0].data = monthData
          this.axisOption.series[1].data = chainRatioData
          this.axisOption.series[2].data = yearOnYearData
          this.chartObj.setOption(this.axisOption, true)
        })
        .catch(() => {
          this.loading = false
        })
    },
    /** 柱状图 */
    initAxis() {
      this.chartObj = echarts.init(document.getElementById('axismain'))
      this.axisOption = {
        color: [
          '#0065FF',
          '#00B8D9',
          '#36B37E'
        ],
        toolbox: this.toolbox,
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            // 坐标轴指示器，坐标轴触发有效
            type: 'shadow' // 默认为直线，可选为：'line' | 'shadow'
          }
        },
        legend: {
          ...this.chartDefaultOptions.legend,
          data: [
            '当月' + this.typeName,
            // '上月' + this.typeName,
            // '去年当月' + this.typeName,
            '环比增长',
            '同比增长'
          ]
        },
        grid: {
          ...this.chartDefaultOptions.grid,
          top: '50px'
        },
        xAxis: [{
          ...this.chartXAxisStyle,
          type: 'category',
          data: []
        }],
        yAxis: [{
          ...this.getChartYAxisStyle({
            axisLabel: {
              formatter: '{value}'
            }
          }),
          type: 'value',
          name: this.typeUnit
        },
        {
          ...this.getChartYAxisStyle({
            axisLabel: {
              formatter: '{value}%'
            }
          }),
          type: 'value',
          name: ''
        }
        ],
        series: [{
          name: '当月' + this.typeName,
          type: 'bar',
          yAxisIndex: 0,
          barMaxWidth: 10,
          label: this.chartDefaultBase.label,
          markPoint: {
            data: [{
              type: 'max',
              name: '最大值'
            },
            {
              type: 'min',
              name: '最小值'
            }
            ]
          },
          data: []
        },
        // {
        //   name: '上月' + this.typeName,
        //   type: 'bar',
        //   yAxisIndex: 0,
        //   barMaxWidth: 10,
        //   markPoint: {
        //     data: [{
        //       type: 'max',
        //       name: '最大值'
        //     },
        //     {
        //       type: 'min',
        //       name: '最小值'
        //     }
        //     ]
        //   },
        //   data: []
        // },
        // {
        //   name: '去年当月' + this.typeName,
        //   type: 'bar',
        //   yAxisIndex: 0,
        //   barMaxWidth: 10,
        //   markPoint: {
        //     data: [{
        //       type: 'max',
        //       name: '最大值'
        //     },
        //     {
        //       type: 'min',
        //       name: '最小值'
        //     }
        //     ]
        //   },
        //   data: []
        // },
        {
          ...this.chartDefaultOptions.seriesLine,
          name: '环比增长',
          type: 'line',
          yAxisIndex: 1,
          markLine: {
            data: [{
              type: 'average',
              name: '平均值'
            }]
          },
          markPoint: {
            data: [{
              type: 'max',
              name: '最大值'
            },
            {
              type: 'min',
              name: '最小值'
            }
            ]
          },
          data: []
        },
        {
          ...this.chartDefaultOptions.seriesLine,
          name: '同比增长',
          type: 'line',
          yAxisIndex: 1,
          markLine: {
            data: [{
              type: 'average',
              name: '平均值'
            }]
          },
          markPoint: {
            data: [{
              type: 'max',
              name: '最大值'
            },
            {
              type: 'min',
              name: '最小值'
            }
            ]
          },
          data: []
        }
        ]
      }
      this.chartObj.setOption(this.axisOption, true)
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
        const [y, m] = column.label.split('-')

        let date = ''
        let values = []
        if (row.dateType === 'days') {
          const lastDate = moment(`${y}-${m}-01`).endOf('month').format('YYYY-MM-DD')
          values = [column.label, lastDate]
        } else {
          date = moment(column.label).subtract(1, row.dateType).format('YYYY-MM-DD')
          const [py, pm] = date.split('-')

          const lastDate = moment(`${py}-${pm}-01`).endOf('month').format('YYYY-MM-DD')

          values = [date, lastDate]

          this.reportData.title = `${py}-${pm}-01详情`
        }

        const params = {
          search: '',
          dataType: this.postParams.dataType
        }
        if (this.type === 'back') {
          this.reportData.crmType = 'receivables'
          params.type = 7
          this.reportData.request = biReceivablesDetailListAPI
        } else {
          params.type = 6
          this.reportData.request = biContractDetailListAPI
        }

        const timeType = ['money', 'count'].includes(this.type) ? 'orderDate' : 'returnTime'
        params.searchList = [
          {
            formType: 'date',
            name: timeType,
            type: 14,
            values: values
          },
          {
            formType: 'checkStatus',
            name: 'checkStatus',
            type: 1,
            values: [1, 10]
          }
        ]

        if (this.postParams.dataType == 0) {
          params.userList = this.postParams.userList
          params.deptList = this.postParams.deptList
        }

        this.reportData.params = params
        this.reportListShow = true
      }
    },

    /**
     * 导出点击
     */
    exportClick() {
      this.requestExportInfo(
        biAchievementAnalysisExportAPI,
        {
          ...this.postParams,
          tableType: this.type
        }
      )
    }
  },

  deactivated: function() {}

}
