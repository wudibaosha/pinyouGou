<!-- <template>
  <div v-loading="loading" class="b-cont">
    <div class="header">
      <div v-if="handelShow" class="header-select">
        状态<el-select
          v-model="status"
          class="type-select"
          @change="refreshList">
          <el-option
            v-for="(item, index) in [{ name: '全部', value: 'all' }, { name: '未同步', value: 0 }, { name: '同步成功', value: 1 }, { name: '同步失败', value: 2 }]"
            :key="index"
            :label="item.name"
            :value="item.value" />
        </el-select>
        <i class="wk wk-icon-fill-help wk-help-tips" data-type="16" data-id="150" />
      </div>
      <div class="header-handle" :class="{ 'is-end': !handelShow }">
        <reminder
          v-if="handelShow"
          content="若不勾选任何数据，系统默认同步全部数据；且只能同步自己负责的数据。" />
        <div class="header-handle-button">
          <el-button
            v-if="handelShow"
            type="primary"
            @click="syncDataClick()">{{ syncBtnName }}</el-button>
          <el-button
            @click="exportDataClick()">导出</el-button>
        </div>
      </div>
      <div class="table-content">
        <el-table
          :data="list"
          :height="tableHeight"
          :cell-style="cellStyle"
          stripe
          highlight-current-row
          style="width: 100%;"
          @selection-change="handleSelectionChange">
          <el-table-column
            show-overflow-tooltip
            type="selection"
            align="center"
            width="55" />
          <el-table-column
            v-if="handelShow"
            :formatter="fieldFormatter"
            show-overflow-tooltip
            label="同步状态"
            prop="status"
            width="120" />
          <el-table-column
            v-for="(item, index) in fieldList"
            :key="index"
            :prop="item.prop"
            :label="item.label"
            :min-width="item.width"
            show-overflow-tooltip>
            <template slot-scope="{row, column}">
              <wk-field-view
                :props="item"
                :form-type="item.formType"
                :value="row[column.property]">
                <template slot-scope="{ data }">
                  {{ fieldFormatter(row, column, item) }}
                </template>
              </wk-field-view>
            </template>
          </el-table-column>
        </el-table>
        <div class="p-contianer">
          <el-pagination
            :current-page="currentPage"
            :page-sizes="pageSizes"
            :page-size.sync="pageSize"
            :total="total"
            class="p-bar"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  crmMarketingCensusAPI,
  crmMarketingExcelExportAPI,
  crmMarketingSynchroAPI
} from '@/api/crm/marketing'
import {
  filedGetTableFieldAPI
} from '@/api/crm/common'
import {
  crmMarketingFieldListAPI
} from '@/api/admin/crm'

import Reminder from '@/components/Reminder'
import MarketingMixin from './Marketing'
import WkFieldView from '@/components/NewCom/WkForm/WkFieldView'

import { downloadExcelWithResData } from '@/utils'
import { getFormFieldShowName } from '@/components/NewCom/WkForm/utils'

export default {
  // 活动管理 的 统计
  name: 'Statistics',
  components: {
    Reminder,
    WkFieldView
  },
  mixins: [MarketingMixin],
  props: {
    // 模块ID
    id: [String, Number],
    // 详情
    detail: Object,
    // 没有值就是全部类型 有值就是当个类型
    crmType: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      loading: false,
      // 筛选类型
      status: 'all',
      fieldList: [],
      list: [],
      selectionList: [],

      tableHeight: document.documentElement.clientHeight - 425,

      currentPage: 1,
      pageSize: 15,
      pageSizes: [15, 30, 45, 60],
      total: 0
    }
  },
  computed: {
    handelShow() {
      return this.detail && this.detail.crmType <= 2
    },
    syncBtnName() {
      if (!this.detail) {
        return ''
      }
      return {
        '1': '同步到线索',
        '2': '同步到客户'
      }[this.detail.crmType]
    }
  },
  watch: {
    detail() {
      this.getFieldList()
    }
  },
  mounted() {
    this.getFieldList()
  },
  activated: function() {},
  deactivated: function() {},
  methods: {
    /**
     * 获取字段
     */
    getFieldList() {
      if (!this.detail) {
        return
      }
      this.loading = true
      const request = this.detail.crmType > 2 ? crmMarketingFieldListAPI : filedGetTableFieldAPI
      const params = this.detail.crmType > 2 ? {
        id: this.detail.crmType
      } : {
        label: this.detail.crmType,
        type: '1' //  一维数组
      }
      request(params)
        .then(res => {
          const showFieldsStr = this.detail.fieldDataId || ''

          const showFields = showFieldsStr.split(',')

          const resData = res.data || []
          const fieldList = []
          for (let index = 0; index < resData.length; index++) {
            const element = resData[index]
            if (this.isShowField(element.formType) && showFields.includes(element.fieldId)) {
              var width = 0
              if (!element.width) {
                if (element.name && element.name.length <= 6) {
                  width = element.name.length * 15 + 45
                } else {
                  width = 140
                }
              } else {
                width = element.width
              }

              fieldList.push({
                prop: element.fieldName,
                formType: element.formType,
                label: element.name,
                width: width
              })
            }
          }

          fieldList.push({
            prop: 'ownerUserName',
            formType: 'text',
            label: '负责人',
            width: 140
          })
          this.fieldList = fieldList

          // 获取好字段开始请求数据
          this.getList()
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 格式化字段
     */
    fieldFormatter(row, column, field) {
      // 如果需要格式化
      if (column.property === 'status') {
        const status = row[column.property]
        return {
          0: '未同步',
          1: '同步成功',
          2: '同步失败'
        }[status]
      }
      let value = row[column.property]
      if (field && field.formType === 'field_tag') {
        try {
          value = JSON.parse(value)
        } catch (err) {
          value = []
        }
      } else if (field) {
        return getFormFieldShowName(field.formType, row[column.property], '--', field)
      }
      return value === '' || value === null ? '--' : value
    },

    /**
     * 获取基础信息
     */
    getList() {
      this.loading = true
      crmMarketingCensusAPI({
        page: this.currentPage,
        limit: this.pageSize,
        marketingId: this.id,
        status: this.status == 'all' ? '' : this.status
      })
        .then(res => {
          const resData = res.data || {}
          this.list = resData.list
          this.total = resData.totalRow

          this.loading = false
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 刷新列表
     */
    refreshList() {
      this.currentPage = 1
      this.getList()
    },

    /**
     * 更改每页展示数量
     */
    handleSizeChange(val) {
      this.pageSize = val
      this.getList()
    },

    /**
     * 更改当前页数
     */
    handleCurrentChange(val) {
      this.currentPage = val
      this.getList()
    },

    /** 勾选操作 */
    /**
     * 当选择项发生变化时会触发该事件
     */
    handleSelectionChange(val) {
      this.selectionList = val // 勾选的行
    },

    /**
     * 通过回调控制style
     */
    cellStyle({ row, column, rowIndex, columnIndex }) {
      if (column.property === 'status') {
        const status = row[column.property]
        if (status == 0) {
          return { color: '#7A869A' }
        } else if (status == 1) {
          return { color: '#33D555' }
        } else if (status == 2) {
          return { color: '#F84F4F' }
        }
      } else {
        return ''
      }
    },

    /**
     * 同步 和 导出操作
     */
    syncDataClick() {
      if (this.total === 0) {
        this.$message.error('您没有可同步的数据')
        return
      }
      this.loading = true
      const params = {}
      params.marketingId = this.id
      params.status = this.status == 'all' ? '' : this.status
      params.rIds = this.selectionList.map(item => item.rId)
      crmMarketingSynchroAPI(params)
        .then(res => {
          this.loading = false
          this.$message.success('同步成功')
          this.refreshList()
        })
        .catch(() => {
          this.loading = false
        })
    },

    exportDataClick() {
      const params = {
        marketingId: this.id,
        status: this.status == 'all' ? '' : this.status
      }

      // 勾选导出
      if (this.selectionList.length) {
        params.rIds = this.selectionList.map(item => item.rId)
      }
      crmMarketingExcelExportAPI(params)
        .then(res => {
          downloadExcelWithResData(res)
        })
        .catch(() => {})
    }
  }
}
</script>

<style lang="scss" scoped>
.b-cont {
  position: relative;
  height: 100%;
  padding-right: 32px;
  overflow-y: auto;
}

.header {
  &-select {
    .el-select {
      margin-left: 18px;
    }
  }

  &-handle {
    display: flex;
    justify-content: space-between;
    min-height: 30px;
    margin-top: 16px;
    line-height: 30px;

    &.is-end {
      justify-content: flex-end;
      margin-top: 0;
    }

    .reminder-wrapper {
      width: auto;
    }

    &-button {
      float: right;
    }
  }
}

.table-content {
  padding-top: 16px;
}

.table-head-name {
  padding: 0;
  font-size: 14px;
  line-height: 23px;
}
</style> -->
