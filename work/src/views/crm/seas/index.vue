<template>
  <div>
    <!-- <c-r-m-list-head
      :is-seas="true"
      :pool-id="poolId"
      :pool-auth="poolAuth"
      title="公海管理"
      main-title="新建客户"
      crm-type="customer"
      @on-handle="listHeadHandle"
      @on-export="exportInfos"> -->
    <!-- </c-r-m-list-head> -->
    <wk-page-header
      :title="config.showModuleName ? '公海管理' : ''"
      :help="getHelpObj(crmType, 'index')"
      :dropdowns="headerMoreHandles"
      @command="pageHeaderCommand" />
    <div
      v-empty="!indexAuth && poolAuth.index"
      xs-empty-icon="nopermission"
      xs-empty-text="暂无权限"
      class="crm-container">
      <wk-table-header
        ref="tableHeader"
        :search.sync="search"
        :tabs="sceneList"
        :active-tab.sync="sceneId"
        :selection-list="tableSelectionList"
        :operations="handleOperations"
        :condition-type-fun="undefined"
        :fields="getFilterFields"

        :props="tableHeaderProps.props"
        :filter-header-props="tableHeaderProps.filterHeaderProps"
        :filter-form-props="tableHeaderProps.filterFormProps"
        :scene-set-props="tableHeaderProps.sceneSetProps"
        :scene-create-props="tableHeaderProps.sceneCreateProps"
        @tabs-change="sceneSelect"
        @operations-click="tableOperationsClick"
        @event-change="tableHeaderHandle"
        @filter-change="handleFilter"
      >
        <template slot="custom">
          <el-select
            v-model="poolId"
            style="margin-left: 10px;"
            mode="no-border"
            @change="poolChange">
            <el-option
              v-for="item in poolList"
              :key="item.poolId"
              :label="item.poolName"
              :value="item.poolId" />
          </el-select>
        </template>
      </wk-table-header>
      <el-table
        id="crm-table"
        v-loading="loading"
        :row-height="rowHeight"
        :data="list"
        :height="tableHeight"
        :cell-class-name="cellClassName"
        :class="crmTableClass"
        :row-key="`${crmType}Id`"
        :stripe="tableStyleObj.stripe"
        use-virtual
        highlight-current-row
        style="width: 100%;"
        @row-click="handleRowClick"
        @sort-change="sortChange"
        @header-dragend="handleHeaderDragend"
        @selection-change="handleSelectionChange">
        <el-table-column
          show-overflow-tooltip
          reserve-selection
          type="selection"
          fixed
          align="center"
          width="55" />
        <el-table-column
          v-for="(item, index) in fieldList"
          :key="index"
          :fixed="item.isLock === 1"
          :prop="item.prop"
          :label="item.label"
          :width="item.width"
          :class-name="item.width>60 ? 'column' : '' "
          sortable="custom"
          show-overflow-tooltip>
          <template v-if="item.width>60" slot="otherHeader" slot-scope="scope">
            <el-button
              :icon="item.isLock === 1 ? 'wk wk-unlock' : 'wk wk-lock'"
              class="el-lock-btn"
              type="text"
              @click.stop="fieldFixed(item)" />
            <el-button
              v-if="showFilter(item)"
              class="el-filter-btn"
              type="text"
              icon="wk wk-screening"
              @click.stop="showFilterClick(item)" />
          </template>
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
        <el-table-column />
        <field-set
          slot="other"
          :is-seas="isSeas"
          :crm-type="crmType"
          :pool-id="poolId"
          @change="setSave" />
      </el-table>
      <div class="p-contianer">
        <el-dropdown trigger="click" placement="top">
          <el-button class="dropdown-btn"><i class="el-icon-s-fold" /></el-button>
          <el-dropdown-menu slot="dropdown" class="wk-table-style-dropdown-menu">
            <el-dropdown-item>
              <span @click.stop><el-switch v-model="tableStyleObj.rightBorderShow" />显示竖向分割线</span>
            </el-dropdown-item>
            <el-dropdown-item>
              <span @click.stop><el-switch v-model="tableStyleObj.bottomBorderShow" />显示横向分割线</span>
            </el-dropdown-item>
            <el-dropdown-item>
              <span @click.stop><el-switch v-model="tableStyleObj.stripe" />显示斑马纹</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
        <el-pagination
          :current-page="currentPage"
          :page-sizes="pageSizes"
          :page-size.sync="pageSize"
          :total="total"
          :pager-count="5"
          class="p-bar"
          layout="prev, pager, next, sizes, total, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </div>
    </div>
    <customer-detail
      v-if="showDview"
      :id.sync="rowID"
      :page-list="crmType == rowType ? list : []"
      :page-index.sync="rowIndex"
      :pool-id="poolId"
      :is-seas="isSeas"
      class="d-view"
      @handle="handleHandle"
      @hide-view="showDview=false" />

    <!-- 分配 -->
    <alloc-handle
      :crm-type="crmType"
      :pool-id="poolId"
      :selection-list="selectionList"
      :dialog-visible.sync="allocDialogShow"
      @handle="handleHandle" />
  </div>
</template>

<script>
import {
  crmCustomerPoolNameListAPI,
  crmCustomerPoolQueryAuthAPI,
  crmCustomerReceiveAPI,
  crmCustomerPoolExcelExportAPI,
  crmCustomerPoolDeleteAPI
} from '@/api/crm/customer'

import CustomerDetail from '../customer/Detail'
import AllocHandle from '../components/SelectionHandle/AllocHandle' // 公海分配操作

import TableMixin from '../mixins/Table'

export default {
  /** 客户管理 的 公海列表 */
  name: 'SeacIndex',
  components: {
    CustomerDetail,
    AllocHandle
  },
  filters: {
    dealIcon(statu) {
      return statu == 1 ? 'deal-suc' : 'deal-un'
    },

    dealName(statu) {
      return statu == 1 ? '已成交' : '未成交'
    }
  },
  mixins: [TableMixin],
  data() {
    return {
      crmType: 'customer',
      isSeas: true, // 是公海
      poolId: '',
      poolAuth: {},
      poolList: [],
      // 公海分配操作提示框
      allocDialogShow: false
    }
  },
  computed: {
    // 头部更多操作
    headerMoreHandles() {
      const moreHandles = []
      // 公海规则里的管理员可操作
      if (this.poolId && this.poolAuth && this.poolAuth.excelexport) {
        moreHandles.push({ command: 'enter', name: '导入', icon: 'wk wk-import' })
        moreHandles.push({ command: 'out', name: '导出', icon: 'wk wk-export' })
      }

      if (this.$auth('manage.crm.pool')) {
        moreHandles.push({ command: 'seasSet', name: '公海规则', icon: 'wk wk-manage' })
      }

      return moreHandles
    },
    // 可操作选项
    handleOperations() {
      return this.getOperations([
        'alloc',
        'get',
        'export',
        'delete'
      ])
    }
  },
  watch: {
    poolId: {
      handler(newVal) {
        if (newVal) {
          this.getCustomerPoolAuth(newVal)
        }
      },
      deep: true,
      immediate: true
    }
  },
  created() {
    this.getPoolList()
  },
  activated() {
    if (this.isRequested) {
      this.getList()
    }
  },
  deactivated() {
  },
  methods: {
    /**
     * @description: 表头事件
     * @param {*} type
     * @return {*}
     */
    tableOperationsClick(type) {
      if (type == 'alloc') {
        // 公海分配操作
        this.allocDialogShow = true
      } else if (type === 'get') {
        this.$confirm('确定要领取该客户吗?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            // 领取
            this.loading = true
            crmCustomerReceiveAPI({
              ids: this.selectionList.map(item => item.customerId),
              poolId: this.poolId
            })
              .then(res => {
                this.loading = false
                this.$message({
                  type: 'success',
                  message: '操作成功'
                })
                // 刷新待办
                this.$store.dispatch('GetMessageNum')

                this.handleHandle({ type })
              })
              .catch(() => {
                this.loading = false
              })
          })
          .catch(() => {})
      } else if (type === 'export') {
        // 成交状态
        this.$wkExport.export(this.crmType, {
          params: {
            poolId: this.poolId,
            ids: this.selectionList.map(item => item[`${this.crmType}Id`])
          },
          request: crmCustomerPoolExcelExportAPI,
          isSeas: this.isSeas,
          poolId: this.poolId
        })
      } else if (type === 'delete') {
        this.$confirm('若客户下有联系人，联系人将一并删除。确定删除？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            this.loading = true
            crmCustomerPoolDeleteAPI({
              ids: this.selectionList.map(item => item[`${this.crmType}Id`]),
              poolId: this.poolId
            })
              .then(res => {
                this.loading = false
                this.$message({
                  type: 'success',
                  message: '删除成功'
                })
                this.handleHandle({ type })
              })
              .catch(() => {
                // 批量沟通 可能部分删除成功，需要刷新列表
                this.handleHandle({ type })
                this.loading = false
              })
          })
          .catch(() => {})
      }
    },

    // /**
    //  * @description: 表格头部完整配置
    //  * @param {*}
    //  * @return {*}
    //  */
    // getTableHeaderProps() {
    //   const baseProps = this.getBaseTableHeaderProps()
    //   const { filterHeaderProps } = baseProps
    //   filterHeaderProps.tabSetShow = false // 不展示场景
    //   return baseProps
    // },

    /**
     * 获取公海权限
     */
    getCustomerPoolAuth(poolId) {
      crmCustomerPoolQueryAuthAPI({
        poolId: poolId
      })
        .then(res => {
          this.poolAuth = res.data || {}
        })
        .catch(() => {})
    },

    /**
     * 左侧菜单选择
     */
    menuSelect(key, keyPath) {
      this.$emit('menu-select', key, keyPath)
    },

    /**
     * 公海数据
     */
    getPoolList() {
      crmCustomerPoolNameListAPI()
        .then(res => {
          this.poolList = res.data || []
          this.poolId = this.poolList.length > 0 ? this.poolList[0].poolId : ''
          this.getFieldList()
          // 该方法里的 this.crmType data() 中不能获取
          this.tableHeaderProps = this.getBaseTableHeaderProps()
        })
        .catch(() => {
        })
    },

    /**
     * 选择公海
     */
    poolChange() {
      // 重载高级筛选信息，主要保证外露状态
      this.$refs.tableHeader.initFieldList()

      this.currentPage = 1
      this.getFieldList(true)
    },

    /**
     * 通过回调控制class
     */
    cellClassName({ row, column, rowIndex, columnIndex }) {
      if (column.property === 'customerName') {
        return 'can-visit--underline'
      } else if (column.property === 'businessCheck') {
        return 'can-visit'
      } else {
        return ''
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import "../styles/table.scss";
</style>
