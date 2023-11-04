<template>
  <div
    v-loading="loading"
    class="main-container">
    <filtrate-handle-view
      title="员工客户满意度分析"
      class="filtrate-bar"
      module-type="contract"
      @load="loading=true"
      @change="getDataList">
      <el-button
        class="export-button"
        type="primary"
        @click.native="exportClick">导出</el-button>
    </filtrate-handle-view>
    <div class="content">
      <div class="table-content">
        <el-table
          :data="list"
          :class="WKConfig.tableStyle.class"
          :stripe="WKConfig.tableStyle.stripe"
          :height="tableHeight"
          highlight-current-row
          :cell-class-name="cellClassName"
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
import SortMixin from '../mixins/Sort'
import BaseMixin from '../mixins/Base'
import DetailMixin from '@/views/bi/mixins/Detail'

import { biCustomerSatisfactionTableAPI, biCustomerSatisfactionTableExportAPI } from '@/api/bi/customer'
import { biContractSatisfactionTableAPI, biVisitContractDetailListAPI } from '@/api/bi/bi.js'
import FiltrateHandleView from '../components/FiltrateHandleView'

const LOGIC_OTHER = '其他'

export default {
  /** 员工客户满意度分析 */
  name: 'CustomerSatisfaction',
  components: {
    FiltrateHandleView
  },
  mixins: [BaseMixin, SortMixin, DetailMixin],
  data() {
    return {
      loading: false,
      tableHeight: document.documentElement.clientHeight - 160,

      postParams: {}, // 筛选参数

      list: [],
      fieldList: [],
      // 可以点击的数据
      reportData: {
        crmType: 'contract'
      },
      detailFields: [
        {
          name: 'visitContractNum',
          fieldType: 'popular',
          crmType: 'contract',
          request: biVisitContractDetailListAPI,
          params: {
            searchType: '',
            type: 2
          }
        }
      ]

    }
  },
  computed: {},
  mounted() {
    /** 控制table的高度 */
    window.onresize = () => {
      this.tableHeight = document.documentElement.clientHeight - 160
    }
  },
  methods: {
    getDataList(params) {
      this.postParams = params
      this.loading = true
      biCustomerSatisfactionTableAPI(params)
        .then(res => {
          const list = res.data || []
          if (this.fieldList.length === 0 && list.length > 0) {
            const firstItem = list[0]
            const baseFields = [
              { field: 'realname', name: '员工姓名' },
              { field: 'visitContractNum', name: '回访合同总数' }
            ]

            const otherFields = []
            const reg = /[^a-zA-Z]+/
            // eslint-disable-next-line no-unused-vars
            for (const key in firstItem) {
              if (key !== 'realname') {
                this.detailFields.push({
                  name: key,
                  crmType: 'contract',
                  fieldType: 'popular',
                  list: [],
                  params: {
                    searchType: key
                  },
                  request: biContractSatisfactionTableAPI
                })
              }

              if (reg.test(key)) {
                if (key !== LOGIC_OTHER) {
                  otherFields.push({ field: key, name: key })
                }
              }
            }
            this.fieldList = baseFields.concat(otherFields)
          }
          this.list = list
          this.loading = false
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 导出点击
     */
    exportClick() {
      this.requestExportInfo(biCustomerSatisfactionTableExportAPI, this.postParams)
    },

    handleRowClick(row, column) {
      if (this.getDetailFieldList(column)) {
        const params = {
          dataType: this.postParams.dataType,
          dateFilter: this.postParams.dateFilter,
          id: row.productId,
          limit: 15,
          page: 1,
          search: '',
          searchType: column.property == 'visitContractNum' ? null : column.label,
          type: 6
        }

        if (!this.postParams.dataType) {
          params.deptList = this.postParams.deptList
          params.userList = [row.ownerUserId]
        }

        if (this.postParams.dateFilter === 'custom') {
          params.startDate = this.postParams.startDate
          params.endDate = this.postParams.endDate
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

.content-title {
  padding-bottom: 15px;

  .special {
    margin-right: 3px;
    font-weight: bold;
  }
}
</style>
