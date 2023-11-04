import BaseMixin from './Base'
import xrTheme from '@/styles/xr-theme.scss'

export default {
  data() {
    return {
      loading: false,
      axisOption: {
        color: ['#0065FF'],
        toolbox: {
          showTitle: false,
          feature: {
            saveAsImage: {
              pixelRatio: 2
            }
          }
        },
        tooltip: {
          textStyle: {
            color: xrTheme.colorBlack,
            fontWeight: xrTheme.axisLabelFontWeight
          },
          trigger: 'axis',
          formatter: '{b} : {c}元',
          axisPointer: {
            // 坐标轴指示器，坐标轴触发有效
            type: 'shadow' // 默认为直线，可选为：'line' | 'shadow'
          }
        }
      },

      postParams: {}, // 筛选参数

      list: [],
      fieldList: []
    }
  },

  mixins: [BaseMixin],

  components: {},

  props: {},

  computed: {},

  watch: {},

  mounted() {
    this.axisOption = {
      ...this.axisOption,
      grid: BaseMixin.data().chartDefaultOptions.grid,
      xAxis: [{
        ...BaseMixin.data().chartXAxisStyle,
        name: '（元）'
      }],
      yAxis: [{
        ...BaseMixin.data().chartYAxisStyle,
        axisLine: {
          show: true
        },
        type: 'category'
      }],
      series: [{
        type: 'bar',
        label: BaseMixin.data().chartDefaultBase.label,
        barMaxWidth: 20,
        data: []
      }]
    }
  },

  methods: {},

  deactivated: function() {}

}
