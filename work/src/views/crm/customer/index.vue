<template>
  <div>
    <wk-page-header
      :title="config.showModuleName ? '客户管理' : ''"
      :help="getHelpObj(crmType, 'index')"
      :dropdowns="getDefaultHeaderHandes()"
      @command="pageHeaderCommand">
      <template slot="right">
        <el-button
          v-if="saveAuth"
          type="primary"
          @click="createClick">新建客户</el-button>
        <el-button
          v-if="indexAuth"
          @click="dupCheckShow = true">查重</el-button>
      </template>
    </wk-page-header>

    <div
      v-empty="!indexAuth"
      xs-empty-icon="nopermission"
      xs-empty-text="暂无权限"
      class="crm-container">
      <wk-table-header
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
      />
      <el-table
        id="crm-table"
        v-loading="loading"
        :row-height="rowHeight"
        :data="list"
        :height="tableHeight"
        :cell-class-name="cellClassName"
        :row-key="`${crmType}Id`"
        :class="crmTableClass"
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
          :resizable="false"
          prop="businessCheck"
          fixed
          label=""
          width="38">
          <template
            slot="header"
            slot-scope="slot">
            <i
              class="wk wk-business"
              style=" color: #9da9c2;cursor: not-allowed;" />
          </template>
          <template slot-scope="scope">
            <el-popover
              :disabled="scope.row.businessCount == 0"
              :offset="250"
              placement="right"
              popper-class="no-padding-popover"
              width="500"
              trigger="click">
              <business-check
                :data="scope"
                :show="scope.row.show"
                @click="relativeBusinessClick"
                @close="businessClose($event, scope)" />
              <i
                slot="reference"
                :style="{'opacity' :scope.row.businessCount > 0 ? 1 : 0}"
                class="wk wk-business"
                style="color: #fc6e51;"
                @click="businessCheckClick($event, scope)" />
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column
          v-if="Show"
          :resizable="false"
          prop="call"
          fixed
          label=""
          width="55">
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
          fixed
          width="60">
          <template
            slot="header"
            slot-scope="slot">
            <i class="el-icon-star-off focus-icon is-disabled" />
          </template>
          <template slot-scope="scope">
            <el-tooltip :content="scope.row.star == 0 ? '添加关注' : '取消关注'" effect="dark" placement="top">
              <i
                v-if="scope.row.star == 0"
                class="el-icon-star-off focus-icon"
                @click="toggleStar(scope.row)" />
              <i
                v-else
                class="wk wk-focus-on focus-icon active"
                @click="toggleStar(scope.row)" />
            </el-tooltip>
          </template>
        </el-table-column> 
        <el-table-column
          v-for="(item, index) in fieldList"
          :key="index"
          :fixed="item.isLock === 1"
          :prop="item.prop"
          :label="item.label"
          :width="item.width"
          :sortable="item.prop != 'poolDay' ? 'custom' : false"
      
          :class-name="item.width>60 ? 'column' : '' "
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
              :value="row[column.property]">
              <template slot-scope="{ data }">
                {{ fieldFormatter(row, column, row[column.property], item) }}
              </template>
            </wk-field-view>
          </template>
        </el-table-column>
        <el-table-column />
        <wk-empty
          slot="empty"
          :props="{
            buttonTitle: '新建客户',
            showButton: saveAuth
          }"
          @click="createClick"
        />
        <field-set
          slot="other"
          :crm-type="crmType"
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

    <!-- 相关详情页面 -->
    <c-r-m-all-detail
      :id.sync="rowID"
      :visible.sync="showDview"
      :crm-type="rowType"
      :model-data="modelData"
      :page-list="crmType == rowType ? list : []"
      :page-index.sync="rowIndex"
      class="d-view"
      @handle="handleHandle" />

    <!-- 新建 -->
    <c-r-m-all-create
      v-if="createShow"
      :crm-type="createType"
      :action="createAction"
      @close="createShow = false"
      @save-success="saveSuccess"
    />

    <!-- 查重 -->
    <duplicate-check
      :crm-type="crmType"
      :visible.sync="dupCheckShow" />

    <!-- 转移 -->
    <transfer-handle
      v-if="transferDialogShow"
      :props="transferHandleProps"
      :dialog-visible.sync="transferDialogShow"
      @handle="handleHandle" />

    <!-- 放入公海 -->
    <put-pool-handle
      :visible.sync="putPoolShow"
      :selection-list="selectionList"
      @handle="handleHandle" />

    <!-- 成交状态 -->
    <deal-status-handle
      :selection-list="selectionList"
      :visible.sync="dealStatusShow"
      @handle="handleHandle" />

    <!-- 团队操作 -->
    <teams-handle
      v-if="teamsDialogShow"
      :props="teamsHandleProps"
      :dialog-visible.sync="teamsDialogShow"
      @handle="handleHandle" />
  </div>
</template>

<script>
import {
  crmCustomerTransferAPI,
  crmCustomerSettingTeamSaveAPI,
  crmCustomerSettingTeamDeleteAPI,
  crmCustomerExcelExportAPI,
  crmCustomerDeleteAPI,
  crmCustomerLockAPI
} from '@/api/crm/customer'

import DuplicateCheck from '../components/DuplicateCheck'
import TransferHandle from '@/components/Page/SelectionHandle/TransferHandle' // 转移
import PutPoolHandle from '../components/SelectionHandle/PutPoolHandle' // 放入公海
import DealStatusHandle from '../components/SelectionHandle/DealStatusHandle' // 客户状态修改操作
import TeamsHandle from '@/components/Page/SelectionHandle/TeamsHandle' // 操作团队成员

import CRMAllCreate from '../components/CRMAllCreate'
import { mapGetters } from 'vuex'
import CRMAllDetail from '@/views/crm/components/CRMAllDetail'
import BusinessCheck from './components/BusinessCheck' // 相关商机
import TableMixin from '../mixins/Table'
import CallCenter from '@/callCenter/CallCenter'

export default {
  /** 客户管理 的 客户列表 */
  name: 'CustomerIndex',
  components: {
    CRMAllDetail,
    BusinessCheck,
    CallCenter,
    CRMAllCreate,
    DuplicateCheck,
    TransferHandle,
    PutPoolHandle,
    DealStatusHandle,
    TeamsHandle
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
      showCount: 0,
      createType: 'customer',
      createAction: {
        type: 'save',
        id: '',
        data: {}
      },
      createShow: false,
      modelData: {},
      // 查重
      dupCheckShow: false,
      // 转移
      transferDialogShow: false,
      transferHandleProps: {},
      // 放入公海
      putPoolShow: false,
      // 成交状态修改框
      dealStatusShow: false,
      // 团队展示
      teamsHandleProps: {},
      teamsDialogShow: false
    }
  },
  computed: {
    ...mapGetters(['CRMConfig']),
    Show() {
      return this.$store.state.crm.isCall
    },
    // 可操作选项
    handleOperations() {
      return this.getOperations([
        'transfer',
        'dataTransfer',
        'put_seas',
        'deal_status',
        'export',
        'delete',
        'lock',
        'unlock',
        'add_user',
        'delete_user'
      ])
    }
  },
  created() {
    // 该方法里的 this.crmType data() 中不能获取
    // this.tableHeaderProps = this.getTableHeaderProps()
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
  activated() {
    if (this.isRequested) {
      this.getList()
    }
  },
  deactivated() {
  },
  methods: {
    titleFieldFormatter(row, column) {
     
      // if (column.property === 'titleType') {
      //   return {
      //     1: '单位',
      //     2: '个人'
      //   }[row[column.property]]
      // }
      return row[column.property] === '' || row[column.property] === null ? '--' : row[column.property]
    },
    /**
     * @description: 表头事件
     * @param {*} type
     * @return {*}
     */
    tableOperationsClick(type) {
      if (type === 'transfer') {
        this.transferHandleProps = {
        // 场景编辑请求
          request: crmCustomerTransferAPI,
          params: { ids: this.selectionList.map(item => item[this.crmType + 'Id']) },
          showChangeOwner: true, // 同时变更负责人
          showRemoveType: true, // 是否展示移除操作类型
          // 帮助提示
          help: this.getHelpObj(this.crmType, 'transfer')
        }
        this.transferDialogShow = true
      } else if (type === 'put_seas') {
        // 客户放入公海
        this.putPoolShow = true
      } else if (type === 'deal_status') {
        // 成交状态
        this.dealStatusShow = true
      } else if (type === 'add_user' || type === 'delete_user') {
        // 团队操作
        this.teamsHandleProps = {
          type: {
            add_user: 'add',
            delete_user: 'delete'
          }[type],
          addRequest: crmCustomerSettingTeamSaveAPI,
          removeRequest: crmCustomerSettingTeamDeleteAPI,
          params: { ids: this.selectionList.map(item => item[this.crmType + 'Id']) },
          // 同时添加至联系人
          showAddType: true,
          // 帮助提示
          readOnlyHelp: this.getHelpObj(this.crmType, 'teamReadOnly'),
          readWriteHelp: this.getHelpObj(this.crmType, 'teamReadWrite')
        }
        this.teamsDialogShow = true
      } else if (type === 'export') {
        // 成交状态
        this.$wkExport.export(this.crmType, {
          params: { ids: this.selectionList.map(item => item[`${this.crmType}Id`]) },
          request: crmCustomerExcelExportAPI
        })
      } else if (type === 'delete') {
        this.$confirm(`确定删除选中的${this.selectionList.length}项吗？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            this.loading = true
            crmCustomerDeleteAPI(this.selectionList.map(item => item[`${this.crmType}Id`]))
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
      } else if (type === 'lock' || type === 'unlock') {
        const message = {
          lock: '确定要锁定这些客户吗？锁定后将不会掉入公海。',
          unlock: '确定要解锁这些客户吗？'
        }[type]
        this.$confirm(message, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            this.loading = true
            crmCustomerLockAPI({
              status: type === 'lock' ? '2' : '1', // 1是正常 2 是锁定
              ids: this.selectionList.map(item => item.customerId).join(',')
            })
              .then(res => {
                this.loading = false
                this.$message({
                  type: 'success',
                  message: '操作成功'
                })
                this.handleHandle({ type })
              })
              .catch(() => {
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
    //   return baseProps
    // },

    /**
     * @description: 相关商机查看
     * @param {*} data
     * @return {*}
     */
    relativeBusinessClick(data) {
      this.rowID = data.businessId
      this.rowType = 'business'
      this.showDview = true
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
    },

    /**
     * @description: 商机预览
     * @param {*} e
     * @param {*} scope
     * @return {*}
     */
    businessCheckClick(e, scope) {
      if (scope.row.businessCount == 0) {
        return
      }

      const popoverEl = e.target.parentNode
      this.$set(scope.row, 'show', !scope.row.show)
      popoverEl.__vue__.showPopper = !scope.row.show
    },

    businessClose(e, scope) {
      const popoverEl = e.parentNode
      popoverEl.__vue__.showPopper = false
      this.$set(scope.row, 'show', false)
    },

    /**
     * pover 显示时触发
     */
    showData(val) {
      this.showCount = val
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
     * 解决povper重复的bug
     */
    callCheckClick(e, scope) {
      this.list.forEach(item => {
        this.$set(item, 'callShow', false)
      })
      this.$set(scope.row, 'callShow', !scope.row.callShow)
      const popoverEl = e.target.parentNode
      popoverEl.__vue__.showPopper = !scope.row.callShow
    },

    /**
     * 新建点击
     */
    createClick() {
      this.createType = this.crmType
      this.createAction = {
        type: 'save',
        id: '',
        data: {}
      }
      this.createShow = true
    },

    /**
     * 创建成功
     */
    saveSuccess(data) {
      if (data.type == 'customer') {
        this.handleHandle(data)
        if (data.createContacts) {
          this.createType = 'contacts'
          this.createAction = {
            type: 'relative',
            crmType: 'customer',
            data: {
              customer: data.data
            }
          }
          this.createShow = true
        }
      }
    }

  }
}
</script>

<style lang="scss" scoped>
@import "../styles/table.scss";
</style>
