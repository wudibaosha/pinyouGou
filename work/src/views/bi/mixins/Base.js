import FiltrateHandleView from '../components/FiltrateHandleView'

import { debounce } from 'throttle-debounce'
import { downloadExcelWithResData } from '@/utils/index'
import xrTheme from '@/styles/xr-theme.scss'
import { objDeepCopy } from '@/utils'

export default {
  data() {
    return {
      chartObj: null,
      chartOtherObj: null,
      chartColors: [
        '#FF5630',
        '#FFAB00',
        '#36B37E',
        '#00B8D9',
        '#6554C0',
        '#172B4D',
        '#006644',
        '#008DA6'
      ],
      // 折线图柱状图等
      echartLineBarColors: ['#505F79', '#0065FF'],
      // 基础因数
      chartDefaultBase: {
        label: {
          color: xrTheme.colorBlack,
          fontWeight: xrTheme.axisLabelFontWeight
        },
        textColor: xrTheme.colorBlack,
        fontWeight: xrTheme.axisLabelFontWeight
      },
      // 默认基础配置
      chartDefaultOptions: {
        tooltip: {
          textStyle: {
            color: xrTheme.colorBlack,
            fontWeight: xrTheme.axisLabelFontWeight
          }
        },
        legend: {
          bottom: '0px',
          itemWidth: 14,
          textStyle: {
            color: xrTheme.colorBlack,
            fontWeight: xrTheme.axisLabelFontWeight
          }
        },
        grid: {
          top: '40px',
          left: '30px',
          right: '60px',
          bottom: '40px',
          containLabel: true,
          borderColor: '#fff'
        },
        // 折线图默认样式
        seriesLine: {
          symbol: 'circle',
          symbolSize: 8,
          smooth: true,
          label: {
            color: xrTheme.colorBlack,
            fontWeight: xrTheme.axisLabelFontWeight
          }
        }
      },
      chartXAxisStyle: {
        axisTick: {
          alignWithLabel: true,
          lineStyle: { width: 0 }
        },
        axisLabel: {
          color: xrTheme.colorBlack,
          fontWeight: xrTheme.axisLabelFontWeight
        },
        axisLine: {
          lineStyle: { color: xrTheme.axisLineColor }
        },
        splitLine: {
          show: false
        }
      },
      chartYAxisStyle: {
        // 标轴刻度相关设置
        minInterval: 1,
        axisTick: {
          show: false
        },
        // 坐标轴轴线相关设置
        axisLabel: {
          color: xrTheme.colorBlack,
          fontWeight: xrTheme.axisLabelFontWeight
        },
        // 坐标轴轴线相关设置
        axisLine: {
          show: false
        },
        // 坐标轴在 grid 区域中的分隔线
        splitLine: {
          lineStyle: {
            color: xrTheme.axisLineColor
          }
        }
      },
      currentPage: 1,
      pageSizes: [15, 30, 45, 60],
      pageSize: 0,
      total: 0,

      // echart 操作项
      toolbox: {
        showTitle: false,
        feature: {
          saveAsImage: {
            show: true,
            pixelRatio: 2
          }
        }
      }
    }
  },

  components: {
    FiltrateHandleView
  },

  props: {},

  computed: {},

  watch: {},

  mounted() {
    this.debouncedResize = debounce(300, this.resizeFn)

    this.$nextTick(() => {
      window.addEventListener('resize', this.debouncedResize)
    })
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.debouncedResize)
  },

  methods: {
    /**
     * 窗口尺寸发生改变实时调整 EChart 尺寸
     */
    resizeFn() {
      if (this.chartObj) {
        this.chartObj.resize()
      }

      if (this.chartOtherObj) {
        this.chartOtherObj.resize()
      }
    },

    // 页面展示条数
    handleSizeChange(val) {
      this.pageData.limit = val
      this.pageData.talkTime = this.talkTime
      this.pageData.talkTimeCondition = this.talkTimeCondition
      this.getList(this.pageData)
    },

    // 分页切换
    handleCurrentChange(val) {
      this.pageData.page = val
      this.pageData.talkTime = this.talkTime
      this.pageData.talkTimeCondition = this.talkTimeCondition
      this.getList(this.pageData)
    },

    /**
     * 审批导出
     */
    requestExportInfo(request, params) {
      return new Promise((resolve, reject) => {
        request(params)
          .then(res => {
            downloadExcelWithResData(res)
            resolve && resolve(res)
          })
          .catch(err => {
            reject && reject(err)
          })
      })
    },

    /**
     * 获取Y轴配置
     */
    getChartYAxisStyle(otherObj) {
      const yDefaultObj = objDeepCopy(this.chartYAxisStyle)
      if (!otherObj) {
        return yDefaultObj
      }
      // eslint-disable-next-line no-unused-vars
      for (const key in otherObj) {
        const defaultValue = yDefaultObj[key]
        const newValue = otherObj[key]
        if (defaultValue) {
          yDefaultObj[key] = { ...defaultValue, ...newValue }
        } else {
          yDefaultObj[key] = newValue
        }
      }
      return yDefaultObj
    }
  },

  deactivated: function() {}

}
