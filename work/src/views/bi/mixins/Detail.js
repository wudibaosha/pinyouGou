
import ReportList from '@/views/crm/workbench/components/ReportList'

import moment from 'moment'

export default {
  data() {
    return {
      // 弹窗数据
      fieldReportList: null,
      reportListShow: false,
      reportData: {
        title: '',
        placeholder: '',
        crmType: '',
        request: null,
        params: null,
        paging: true,
        sortable: false
      },
      search: '',
      isSeas: false
    }
  },
  components: {
    ReportList
  },
  methods: {
    /**
     * 点击字段配置信息
     * @param {*} column
     * @returns
     */
    getCurrentClickField(column) {
      const field = this.detailFields.find(field => field.name == column.property)
      return field
    },
    /**
     * 获取可以进详情字段列表
     */
    getDetailFieldList(column) {
      const list = this.detailFields.map((field) => field.name)
      return list.includes(column.property)
    },

    /**
     * 日期 values
     */
    getValues(row, column) {
      const field = this.getCurrentClickField(column)
      let lastDate = ''
      let values = null
      if (field.padDate) {
        const [y, m] = row.type.split('-')
        lastDate = moment(`${y}-${m}-01`).endOf('month').format('YYYY-MM-DD')
        values = [row.type, lastDate]
      } else {
        values = this.postParams.dateFilter == 'custom'
          ? [this.postParams.startDate, this.postParams.endDate || lastDate]
          : [this.postParams.dateFilter]
      }

      return { values }
    },

    /**
     * 通过回调控制class
     */
    cellClassName({ row, column, rowIndex, columnIndex }) {
      if (this.getDetailFieldList(column)) {
        return 'can-visit--underline'
      } else {
        return ''
      }
    }
  }
}
