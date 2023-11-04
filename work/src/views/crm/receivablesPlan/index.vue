<template>
  <div>
    <wk-page-header
      :title="config.showModuleName ? '回款计划管理' : ''"
      :help="getHelpObj(crmType, 'index')"
      :dropdowns="getDefaultHeaderHandes()"
      @command="pageHeaderCommand">
      <template slot="right">
        <el-button
          v-if="saveAuth"
          type="primary"
          @click="createClick">新建回款计划</el-button>
        <el-button
          v-if="saveAuth"
          slot="ft"
          @click="batchCreateClick">批量新建</el-button>
      </template>
    </wk-page-header>

    <div
      v-empty="!crm[crmType].index"
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
            <template v-if="item.prop == 'checkStatus'">
              <span :style="getStatusStyle(row.checkStatus)" class="status-mark" />
              <span>{{ getStatusName(row.checkStatus) }}</span>
            </template>
            <template v-else-if="item.prop == 'receivedStatus'">
              {{ getReceivedStatusName(row.receivedStatus) }}
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
        <el-table-column
          v-if="receivablesSaveAuth"
          :resizable="false"
          label="操作"
          fixed="right"
          width="120">
          <template
            slot="header"
            slot-scope="slot">
            操作<i class="wk wk-icon-fill-help wk-help-tips" data-type="17" data-id="139" />
          </template>
          <template slot-scope="scope">
            <el-button
              :disabled="!!scope.row.receivablesId"
              :type="!!scope.row.receivablesId ? '' : 'primary'"
              @click.native="receivablesCreate(scope.row)">新建回款</el-button>
          </template>
        </el-table-column>

        <wk-empty
          slot="empty"
          :props="{
            buttonTitle: '新建回款计划',
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
        <span v-if="moneyPageData" class="money-bar">计划回款总金额：{{ moneyPageData.planReceivedMoney || 0 | separator }}/实际回款总金额：{{ moneyPageData.realReceivedMoney || 0 | separator }}/未回款总金额：{{ moneyPageData.unreceivedMoney || 0 | separator }}</span>
      </div>
    </div>

    <!-- 新建 -->
    <c-r-m-all-create
      v-if="createShow"
      :crm-type="createCrmType"
      :action="createActionInfo"
      @save-success="handleHandle"
      @close="createShow=false" />

    <!-- 批量新建 -->
    <receivables-plan-batch-create
      v-if="batchCreateShow"
      @close="batchCreateShow = false"
      @save-success="handleHandle"
    />

    <!-- 相关详情页面 -->
    <c-r-m-all-detail
      :id.sync="rowID"
      :visible.sync="showDview"
      :crm-type="rowType"
      :page-list="crmType == rowType ? list : []"
      :page-index.sync="rowIndex"
      class="d-view"
      @handle="handleHandle" />
  </div>
</template>

<script>
import {
  crmReceivablesPlanDeleteAPI,
  crmReceivablesPlanExcelExportAPI
} from '@/api/crm/receivablesPlan'

import ReceivablesPlanBatchCreate from './BatchCreate'
import CRMAllDetail from '@/views/crm/components/CRMAllDetail'
import CRMAllCreate from '@/views/crm/components/CRMAllCreate'

import TableMixin from '../mixins/Table'
import { isObject } from '@/utils/types'
import { getPlanReceivablesStatusName } from './utils'
import { getPermissionByKey } from '@/utils'
import moment from 'moment'

export default {
  // 回款计划计划
  name: 'ReceivablesPlanIndex',
  components: {
    ReceivablesPlanBatchCreate,
    CRMAllDetail,
    CRMAllCreate
  },
  mixins: [TableMixin],
  data() {
    return {
      crmType: 'receivablesPlan', // receivablesPlan
      rowHeight: 49, // 按钮使行高变高
      createCrmType: '',
      createShow: false,
      batchCreateShow: false,
      moneyData: null, // 列表金额
      createActionInfo: {}
    }
  },
  computed: {
    // 选择数据，隐藏金额信息
    showBottomMoney() {
      return !this.config.isSelect
    },

    moneyPageData() {
      if (!this.showBottomMoney) {
        return false
      }

      if (!isObject(this.moneyData) || JSON.stringify(this.moneyData) == '{}') {
        return null
      }

      return this.moneyData
    },

    receivablesSaveAuth() {
      return !!getPermissionByKey('crm.receivables.save')
    },

    // 可操作选项
    handleOperations() {
      return this.getOperations([
        'export',
        'update',
        'delete'
      ])
    }
  },
  mounted() {},
  deactivated() {
  },
  methods: {
    /**
     * @description: 表头事件
     * @param {*} type
     * @return {*}
     */
    tableOperationsClick(type) {
      if (type === 'export') {
        // 成交状态
        this.$wkExport.export(this.crmType, {
          params: { ids: this.selectionList.map(item => item[`${this.crmType}Id`]) },
          request: crmReceivablesPlanExcelExportAPI
        })
      } else if (type === 'delete') {
        this.$confirm(`确定删除选中的${this.selectionList.length}项吗？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            this.loading = true
            crmReceivablesPlanDeleteAPI(this.selectionList.map(item => item[`${this.crmType}Id`]))
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
      } else if (type === 'update') {
        this.createCrmType = this.crmType
        this.createActionInfo = {
          type: 'update',
          id: this.selectionList[0][`${this.crmType}Id`]
        }
        this.createShow = true
      }
    },

    /**
     * 通过回调控制class
     */
    cellClassName({ row, column, rowIndex, columnIndex }) {
      if (
        column.property === 'customerName' ||
        column.property === 'contractNum' ||
        column.property === 'num'
      ) {
        return 'can-visit--underline'
      } else {
        return ''
      }
    },

    /**
     * 新建点击
     */
    createClick() {
      this.createCrmType = this.crmType
      this.createActionInfo = {
        type: 'save',
        crmType: this.crmType,
        data: {}
      }
      this.createShow = true
    },

    /**
     * 批量创建
     */
    batchCreateClick() {
      this.batchCreateShow = true
    },

    /**
     * 获取回款状态值
     */
    getReceivedStatusName(receivedStatus) {
      return getPlanReceivablesStatusName(receivedStatus)
    },

    /**
     * 新建回款
     */
    receivablesCreate(data) {
      this.createCrmType = 'receivables'
      this.createActionInfo = {
        type: 'relative',
        crmType: this.crmType,
        data: {
          customer: {
            customerName: data.customerName,
            customerId: data.customerId
          },
          contract: {
            contractNum: data.contractNum,
            contractId: data.contractId,
            name: data.contractName
          },
          receivablesPlanId: data.receivablesPlanId,
          num: data.num,
          returnTime: moment().format('YYYY-MM-DD'),
          money: data.realReceivedMoney, // 实际回款
          unreceivedMoney: data.unreceivedMoney, // 未回款
          returnType: data.returnType
        }
      }
      this.createShow = true
    }
  }
}
</script>

<style lang="scss" scoped>
@import "../styles/table.scss";

/deep/ .field-set-wrap {
  z-index: 10;
}
</style>
