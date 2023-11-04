<template>
  <el-dialog
    :visible="show"
    :append-to-body="true"
    :close-on-click-modal="false"
    top="10vh"
    width="80%"
    custom-class="no-padding-dialog"
    @close="hideView">

    <div
      slot="title"
      class="header"
      @click="showDview = false">
      <span class="title">{{ title }}</span>
    </div>

    <div class="container">
      <el-input
        v-if="placeholder"
        v-model="inputContent"
        :placeholder="placeholder"
        class="search-input"
        @keyup.enter.native="searchInput">
        <el-button
          slot="suffix"
          type="icon"
          icon="wk wk-sousuo"
          @click.native="searchInput" />
      </el-input>
      <div class="content">
        <div class="list-body">
          <el-table
            id="crm-table"
            ref="crmTable"
            v-loading="loading"
            :data="list"
            :height="tableHeight"
            :cell-class-name="cellClassName"
            :class="WKConfig.tableStyle.class"
            :stripe="WKConfig.tableStyle.stripe"
            highlight-current-row
            style="width: 100%;"
            @row-click="handleRowClick"
            @sort-change="sortChange">
            <el-table-column
              v-if="showCall"
              :resizable="false"
              prop="call"
              fixed
              label=""
              width="65">
              <template
                slot="header"
                slot-scope="slot">
                <i
                  class="el-icon-phone"
                  style="color: #2486e4;cursor: not-allowed; opacity: 0.5;" />
              </template>
              <template slot-scope="scope">
                <el-popover
                  placement="right"
                  width="500"
                  popper-class="no-padding-popover"
                  trigger="click"
                  @show="showData(scope.row.customerId)"
                  @hiden="showCount = -1">
                  <call-center
                    :scope="scope"
                    :show="scope.row.customerId === showCount"
                    crm-type="customer"
                    @changeType="changeCRMType" />
                  <el-button
                    slot="reference"
                    :style="{'opacity' :scope.$index >= 0 ? 1 : 0}"
                    type="primary"
                    class="wk-call-btn"
                    icon="el-icon-phone"
                    circle
                    @click.stop="callCheckClick($event,scope,scope.$index)" />
                </el-popover>
              </template>
            </el-table-column>
            <el-table-column
              v-for="(item, index) in showFieldList"
              :key="index"
              :sortable="item.prop != 'poolDay' ? 'custom' : false"
              :fixed="index==0"
              :prop="item.prop"
              :label="item.label"
              :width="item.width"
              show-overflow-tooltip>
              <template slot-scope="{ row, column, $index }">
                <template v-if="item.prop == 'dealStatus'">
                  <span :class="row[item.prop] | dealIcon" />
                  <span>{{ row[item.prop] | dealName }}</span>
                </template>
                <template v-else-if="item.prop == 'status'">
                  <i
                    v-if="row.status == 2"
                    class="wk wk-circle-password customer-lock" />
                </template>
                <template v-else-if="item.prop == 'receivedStatus'">
                  {{ getReceivedStatusName(row[column.property]) }}
                </template>
                <template v-else-if="item.prop == 'checkStatus'">
                  <span
                    :style="{
                      backgroundColor: getStatusColor(row.checkStatus)
                    }"
                    class="status-mark" />
                  <span>{{ getStatusName(row.checkStatus) }}</span>
                </template>
                <wk-field-view
                  v-else
                  :props="item"
                  :form-type="item.formType"
                  :value="row[column.property]"
                >
                  <template slot-scope="{ data }">
                    {{ fieldFormatter(row, column, row[column.property], item) }}
                  </template>
                </wk-field-view>
              </template>
            </el-table-column>
            <el-table-column v-if="showFillColumn" />
          </el-table>
          <div
            v-if="paging"
            class="p-contianer">
            <el-pagination
              :current-page="currentPage"
              :page-sizes="pageSizes"
              :page-size.sync="pageSize"
              :total="total"
              class="p-bar"
              background
              layout="prev, pager, next, sizes, total, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange" />
          </div>
        </div>
      </div>
      <!-- 相关详情页面 -->
      <c-r-m-all-detail
        :id="rowID"
        :visible.sync="showDview"
        :crm-type="rowType"
        :model-data="modelData"
        class="d-view"
        @handle="handleHandle" />

      <record-list
        v-if="recordShow"
        :crm-type="rowType"
        :request="recordRequest"
        :params="recordParams"
        @handle="getList"
        @hide="recordShow = false" />
    </div>
  </el-dialog>
</template>
<script type="text/javascript">
import { filedGetTableFieldAPI } from '@/api/crm/common'

import crmTypeModel from '@/views/crm/model/crmTypeModel'
import CRMAllDetail from '@/views/crm/components/CRMAllDetail'
import RecordList from './components/RecordList'
import WkFieldView from '@/components/NewCom/WkForm/WkFieldView'

import { mapGetters } from 'vuex'
import Lockr from 'lockr'
import CheckStatusMixin from '@/mixins/CheckStatusMixin'
import CallCenter from '@/callCenter/CallCenter'
import { getFormFieldShowName } from '@/components/NewCom/WkForm/utils'
import { getPlanReceivablesStatusName } from '@/views/crm/receivablesPlan/utils'

export default {
  name: 'ReportList', // 简报列表
  components: {
    CRMAllDetail,
    RecordList,
    CallCenter,
    WkFieldView
  },
  filters: {
    dealIcon(statu) {
      return statu == 1 ? 'deal-suc' : 'deal-un'
    },

    dealName(statu) {
      // debugger
      return statu == 1 ? '已成交' : '未成交'
    }
  },
  mixins: [CheckStatusMixin],
  props: {
    show: {
      type: Boolean,
      default: false
    },
    title: String,
    placeholder: {
      type: String,
      default: '搜索内容'
    },
    crmType: String,
    fieldList: Array,
    recordRequest: Function,
    request: Function,
    params: Object,
    // 展示分页
    paging: {
      type: Boolean,
      default: true
    },

    sortable: {
      type: [Boolean, String],
      default: false
    }
  },
  data() {
    return {
      inputContent: '',

      loading: false, // 加载动画
      tableHeight: this.getTableHeight(), // 表的高度
      list: [],
      showFieldList: [],
      sortData: {}, // 字段排序
      currentPage: 1,
      pageSize: Lockr.get('crmPageSizes') || 15,
      pageSizes: [15, 30, 60, 100],
      total: 0,

      /** 控制详情展示 */
      rowID: '', // 行信息
      rowType: '', // 详情类型
      showDview: false,
      showCount: 0,
      recordParams: {},
      recordShow: false,
      modelData: {}
    }
  },
  computed: {
    ...mapGetters(['crm']),
    showExamineStatus() {
      if (this.crmType == 'contract' && this.crmType == 'receivables') {
        return true
      }
      return false
    },
    showFillColumn() {
      if (this.fieldList && this.fieldList.length) {
        return false
      }
      return true
    },

    showCall() {
      return this.$store.state.crm.isCall && this.crmType === 'customer'
    }
  },
  watch: {
    show(value) {
      if (value) {
        this.initInfo()
      }
    }
  },
  mounted() {
    this.$nextTick(() => {
      const callOutData = JSON.parse(localStorage.getItem('callOutData'))
      if (callOutData) {
        this.modelData = {
          modelId: callOutData.id,
          model: callOutData.type
        }
      }
    })
  },

  destroyed() {},
  methods: {
    /**
     * 获取表高
     */
    getTableHeight() {
      const clientHeight = document.documentElement.clientHeight
      const paddingHieght = clientHeight * 0.2

      return clientHeight - paddingHieght - 200
    },

    /**
     * 初始化数据
     */
    initInfo() {
      this.inputContent = ''
      this.showFieldList = []
      this.sortData = {}
      this.$nextTick(() => {
        this.$refs.crmTable.clearSort()
      })
      this.list = []
      this.currentPage = 1

      window.onresize = () => {
        this.tableHeight = this.getTableHeight()
      }

      if (this.fieldList) {
        this.showFieldList = this.fieldList
        this.getList()
      } else {
        this.getFieldList()
      }
    },

    /**
     * 搜索
     */
    searchInput() {
      this.currentPage = 1
      this.getList()
    },

    /**
     * 获取列表数据
     */
    getList() {
      this.loading = true
      var params = {}

      // 加入分页
      if (this.paging) {
        params = {
          page: this.currentPage,
          limit: this.pageSize
        }
      }

      // 如果有占位符 加入搜索
      if (this.placeholder) {
        params.search = this.inputContent
      }

      if (this.sortData.order) {
        params.sortField = this.sortData.prop
        params.order = this.sortData.order == 'ascending' ? 2 : 1
      }

      this.request({ ...params, ...this.params })
        .then(res => {
          if (this.paging) {
            this.list = res.data.list
            this.total = res.data.totalRow
          } else {
            this.list = res.data
          }
          this.loading = false
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 获取表头字段
     */
    getFieldList() {
      if (this.showFieldList.length == 0) {
        this.loading = true
        const crmType =
          this.crmType == 'business_status' ? 'business' : this.crmType
        var params = {
          label: crmTypeModel[crmType]
        }

        filedGetTableFieldAPI(params)
          .then(res => {
            for (let index = 0; index < res.data.length; index++) {
              const element = res.data[index]

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

              this.showFieldList.push({
                prop: element.fieldName,
                formType: element.formType,
                label: element.name,
                width: width
              })
            }

            // 获取好字段开始请求数据
            this.getList()
          })
          .catch(() => {
            this.loading = false
          })
      } else {
        // 获取好字段开始请求数据
        this.getList()
      }
    },

    /**
     * 获取回款状态值
     */
    getReceivedStatusName(receivedStatus) {
      return getPlanReceivablesStatusName(receivedStatus)
    },

    /**
     * 格式化字段
     */
    fieldFormatter(row, column, cellValue, field) {
      // 如果需要格式化
      if (this.fieldList && this.fieldList.length) {
        if (column.property == 'crmType') {
          return crmTypeModel.convertTypeToName(row[column.property])
        }
      }

      if (field) {
        return getFormFieldShowName(field.formType, row[column.property], '--', field)
      }

      return row[column.property] === '' || row[column.property] === null ? '--' : row[column.property]
    },

    /**
     * 字段排序
     */
    sortChange(column, prop, order) {
      this.sortData = column
      this.getList()
    },

    /**
     * 更改每页展示数量
     */
    handleSizeChange(val) {
      Lockr.set('crmPageSizes', val)
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

    /**
     * 查看详情
     */
    handleRowClick(row, column, event) {
      if (this.crmType === 'leads') {
        if (column.property === 'leadsName') {
          this.rowID = row.leadsId
          this.showDview = true
        } else {
          this.showDview = false
        }
      } else if (this.crmType === 'customer') {
        if (column.property === 'customerName') {
          this.rowID = row.customerId
          this.rowType = 'customer'
          this.showDview = true
        } else {
          this.showDview = false
        }
      } else if (this.crmType === 'contacts') {
        if (column.property === 'customerName') {
          this.rowID = row.customerId
          this.rowType = 'customer'
          this.showDview = true
        } else if (column.property === 'name') {
          this.rowID = row.contactsId
          this.rowType = 'contacts'
          this.showDview = true
        } else {
          this.showDview = false
        }
      } else if (
        this.crmType === 'business' ||
        this.crmType === 'business_status'
      ) {
        if (column.property === 'customerName') {
          this.rowID = row.customerId
          this.rowType = 'customer'
          this.showDview = true
        } else if (column.property === 'businessName') {
          this.rowID = row.businessId
          this.rowType = 'business'
          this.showDview = true
        } else {
          this.showDview = false
        }
      } else if (this.crmType === 'contract') {
        if (column.property === 'customerName') {
          this.rowID = row.customerId
          this.rowType = 'customer'
          this.showDview = true
        } else if (column.property === 'businessName') {
          this.rowID = row.businessId
          this.rowType = 'business'
          this.showDview = true
        } else if (column.property === 'contactsName') {
          this.rowID = row.contactsId
          this.rowType = 'contacts'
          this.showDview = true
        } else if (column.property === 'num' || column.property === 'name') {
          this.rowID = row.contractId
          this.rowType = 'contract'
          this.showDview = true
        } else {
          this.showDview = false
        }
      } else if (this.crmType === 'product') {
        if (column.property === 'name') {
          this.rowID = row.productId
          this.rowType = 'product'
          this.showDview = true
        } else {
          this.showDview = false
        }
      } else if (this.crmType === 'receivables') {
        if (column.property === 'customerName') {
          this.rowID = row.customerId
          this.rowType = 'customer'
          this.showDview = true
        } else if (column.property === 'contractNum') {
          this.rowID = row.contractId
          this.rowType = 'contract'
          this.showDview = true
        } else if (column.property === 'number') {
          this.rowID = row.receivablesId
          this.rowType = 'receivables'
          this.showDview = true
        } else {
          this.showDview = false
        }
      } else if (this.crmType === 'receivablesPlan') {
        if (column.property === 'customerName') {
          this.rowID = row.customerId
          this.rowType = 'customer'
          this.showDview = true
        } else if (column.property === 'contractNum') {
          this.rowID = row.contractId
          this.rowType = 'contract'
          this.showDview = true
        } else if (column.property === 'num') {
          this.rowID = row.receivablesPlanId
          this.rowType = 'receivablesPlan'
          this.showDview = true
        } else {
          this.showDview = false
        }
      } else if (this.crmType === 'record') {
        if (column.property === 'count' && row.count) {
          this.rowType = 'crm_' + crmTypeModel.convertTypeToKey(row.crmType)
          this.recordParams = { crmType: row.crmType, queryType: 0, ...this.params }
          this.recordShow = true
        } else {
          this.recordShow = false
        }
      } else if (this.crmType === 'invoice') {
        if (column.property === 'customerName') {
          this.rowID = row.customerId
          this.rowType = 'customer'
          this.showDview = true
        } else if (column.property === 'contractNum') {
          this.rowID = row.contractId
          this.rowType = 'contract'
          this.showDview = true
        }
      }
    },

    /**
     * 详情操作
     */
    handleHandle(data) {
      if (
        data.type === 'alloc' ||
        data.type === 'get' ||
        data.type === 'transfer' ||
        data.type === 'transform' ||
        data.type === 'delete' ||
        data.type === 'put_seas'
      ) {
        this.showDview = false
      }

      if (data.type !== 'edit') {
        this.getList()
      }
    },

    /**
     * 通过回调控制class
     */
    cellClassName({ row, column, rowIndex, columnIndex }) {
      if (this.crmType == 'product') {
        if (column.property === 'name') {
          return 'can-visit--underline'
        }
        return ''
      }
      if (
        this.crmType &&
        (column.property === 'customerName' ||
          column.property === 'businessName' ||
          column.property === 'name' ||
          column.property === 'contactsName' ||
          column.property === 'num' ||
          column.property === 'contractNum' ||
          column.property === 'number' ||
          (this.crmType === 'record' && column.property === 'count' &&
        row[column.property]))
      ) {
        return 'can-visit--underline'
      } else {
        return ''
      }
    },

    /**
     * 隐藏视图
     */
    hideView() {
      this.$emit('update:show', false)
      this.$emit('hide')
    },

    /**
       * 查看详情
       * @param val
       */
    changeCRMType(val) {
      this.rowType = val.type
      this.rowID = val.id

      this.modelData = {
        modelId: val.id,
        model: val.type
      }

      this.showDview = true

      let callOutData = {
        modelId: val.id,
        model: val.type
      }
      callOutData = JSON.stringify(callOutData)
      localStorage.setItem('callOutData', callOutData)
    },

    /**
     * pover 显示时触发
     */
    showData(val) {
      this.showCount = val
    },

    /**
     * 解决povper重复的bug
     */
    callCheckClick(e, scope) {
      this.list.forEach(item => {
        this.$set(item, 'callShow', false)
      })
      this.$set(scope.row, 'callShow', !scope.row.callShow)
      const popoverEl = e.target.parentNode
      popoverEl.__vue__.showPopper = !scope.row.callShow
    }
  }
}
</script>
<style lang="scss" scoped>
@import "../../../styles/table.scss";

/deep/ .no-padding-dialog {
  .el-dialog__header {
    padding: 24px;
  }
}

/deep/ .el-table {
  .el-table__fixed::before {
    display: none;
  }
}

/** 容器布局 */
.container {
  height: 100%;
  padding: 0 24px 16px;
}

.content {
  position: relative;
  height: 100%;
}

.header {
  position: relative;

  .title {
    font-size: $--font-size-xxlarge;
    font-weight: $--font-weight-primary;
    color: $--color-text-primary;
  }
}

.search-input {
  width: 220px;
  margin-bottom: 20px;
}

.d-view {
  top: 0;
}

</style>
