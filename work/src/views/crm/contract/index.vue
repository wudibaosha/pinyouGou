<template>
  <div>
    <!-- <c-r-m-list-head
      :crm-type="crmType"
      :create-fun="createClick"
      :show-title="config.showModuleName"
      title="合同管理"
      main-title="新建合同"
      @on-handle="listHeadHandle"
      @on-export="exportInfos" /> -->
    <wk-page-header
      :title="config.showModuleName ? '合同管理' : ''"
      :help="getHelpObj(crmType, 'index')"
      :dropdowns="getDefaultHeaderHandes()"
      @command="pageHeaderCommand">
      <template slot="right">
        <el-button
          v-if="saveAuth"
          type="primary"
          @click="createClick">新建合同</el-button>
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
      <!-- @select="select" @select="toggleRowSelection":row-key="`${crmType}Id`"-->
      <el-table
        id="crm-table"
        ref="contractTable"
        v-loading="loading"
        :row-height="rowHeight"
        :data="list"
        :height="tableHeight"
        :cell-class-name="cellClassName"
        :class="crmTableClass"
        row-key="id"
        :stripe="tableStyleObj.stripe"
        use-virtual
        highlight-current-row
        style="width: 100%;"
        :tree-props="{children: 'contractRelationList', hasChildren: 'hasChildren'}"

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
          :sortable="item.fieldName=='projectTransferMoney'||item.fieldName=='isProjectTransfer' ||item.fieldName=='contractRelation'? false:'custom'"
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

        <wk-empty
          slot="empty"
          :props="{
            buttonTitle: '新建合同',
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
        <span class="money-bar">{{ moneyDes }}<i v-if="showBottomMoney" class="wk wk-icon-fill-help wk-help-tips" data-type="11" data-id="133" /></span>
      </div>
    </div>
    <!-- 相关详情页面 -->
    <c-r-m-all-detail
      :id.sync="rowID"
      :visible.sync="showDview"
      :crm-type="rowType"
      :page-list="crmType == rowType ? list : []"
      :page-index.sync="rowIndex"
      class="d-view"
      @handle="handleHandle" />

    <!-- 新建 -->
    <contract-create
      v-if="createShow"
      @close="createShow = false"
      @save-success="handleHandle"
    />

    <!-- 转移 -->
    <transfer-handle
      v-if="transferDialogShow"
      :props="transferHandleProps"
      :dialog-visible.sync="transferDialogShow"
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
  crmContractTransferAPI,
  crmContractSettingTeamSaveAPI,
  crmContractSettingTeamDeleteAPI,
  crmContractExcelExportAPI,
  crmContractDeleteAPI
} from '@/api/crm/contract'

import ContractCreate from './Create'
import CRMAllDetail from '@/views/crm/components/CRMAllDetail'
import TransferHandle from '@/components/Page/SelectionHandle/TransferHandle' // 转移
import TeamsHandle from '@/components/Page/SelectionHandle/TeamsHandle' // 操作团队成员

import TableMixin from '../mixins/Table'
import { floatAdd } from '@/utils'
import { separator } from '@/filters/vueNumeralFilter/filters'

export default {
  /** 客户管理 的 合同列表 */
  name: 'ContractIndex',
  components: {
    ContractCreate,
    CRMAllDetail,
    TransferHandle,         
    TeamsHandle
  },
  mixins: [TableMixin],
  data() {
    return {
      crmType: 'contract',
      createShow: false,
      moneyData: null, // 合同列表金额
      // 转移
      transferDialogShow: false,
      transferHandleProps: {},
      // 团队展示
      teamsHandleProps: {},
      teamsDialogShow: false,
      a: 1
    }
  },
  computed: {
    // 选择数据，隐藏金额信息
    showBottomMoney() {
      return !this.config.isSelect
    },

    moneyDes() {
      // 选择数据，隐藏金额信息
      if (!this.showBottomMoney) {
        return ''
      }

      if (!this.moneyData || JSON.stringify(this.moneyData) == '{}') {
        return ''
      }

      const canCheckMoney = this.moneyData.hasOwnProperty('contractMoney')
      const canCheckReceivedMoney = this.moneyData.hasOwnProperty('receivedMoney')
      const canCheckUnReceivedMoney = this.moneyData.hasOwnProperty('unReceivedMoney')
      let contractMoney = 0.0
      let receivedMoney = 0.0
      let unReceivedMoney = 0.0

      // 未勾选展示合同总金额信息
      if (this.selectionList.length == 0) {
        contractMoney = this.moneyData.contractMoney
        receivedMoney = this.moneyData.receivedMoney
        unReceivedMoney = this.moneyData.unReceivedMoney
      } else {
        for (let index = 0; index < this.selectionList.length; index++) {
          const element = this.selectionList[index]
          // 1 审核通过的合同
          if (element.checkStatus == 1) {
            if (canCheckMoney) {
              contractMoney = floatAdd(contractMoney, parseFloat(element.money || 0))
            }
            if (canCheckReceivedMoney) {
              receivedMoney = floatAdd(receivedMoney, parseFloat(element.receivedMoney || 0))
            }

            if (canCheckUnReceivedMoney) {
              unReceivedMoney = floatAdd(unReceivedMoney, parseFloat(element.unreceivedMoney || 0))
            }
          }
        }

        contractMoney = contractMoney.toFixed(2)
        receivedMoney = receivedMoney.toFixed(2)
        unReceivedMoney = unReceivedMoney.toFixed(2)
      }

      let moneyDes = ''
      if (canCheckMoney) {
        moneyDes = `合同总金额：${separator(contractMoney || 0)}`
      }

      if (canCheckReceivedMoney) {
        moneyDes += moneyDes ? ' / ' : ''
        moneyDes += `已收款金额：${separator(receivedMoney || 0)}`
      }

      if (canCheckUnReceivedMoney) {
        moneyDes += moneyDes ? ' / ' : ''
        moneyDes += `应收款金额：${separator(unReceivedMoney || 0)}`
      }

      return moneyDes
    },
    // 可操作选项
    handleOperations() {
      return this.getOperations([
        'transfer',
        'export',
        'delete',
        'add_user',
        'delete_user'
      ])
    }
  },
  mounted() {
  },
  methods: {
    rowSelect(row) {
      console.log(row[0])
      this.$nextTick(() => {
        this.$refs.contractTable.toggleRowSelection(row[0], true)
      })
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
          request: crmContractTransferAPI,
          params: { ids: this.selectionList.map(item => item[this.crmType + 'Id']) },
          showRemoveType: true, // 是否展示移除操作类型
          // 帮助提示
          help: this.getHelpObj(this.crmType, 'transfer')
        }
        this.transferDialogShow = true
      } else if (type === 'export') {
        console.log(this.selectionList, this.crmType)
        // 成交状态
        this.$wkExport.export(this.crmType, {
          params: { ids: this.selectionList.map(item => item[`${this.crmType}Id`]) },
          request: crmContractExcelExportAPI
        })
      } else if (type === 'delete') {
        this.$confirm(`确定删除选中的${this.selectionList.length}项吗？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            this.loading = true
            crmContractDeleteAPI(this.selectionList.map(item => item[`${this.crmType}Id`]))
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
      } else if (type === 'add_user' || type === 'delete_user') {
        // 团队操作
        this.teamsHandleProps = {
          type: {
            add_user: 'add',
            delete_user: 'delete'
          }[type],
          addRequest: crmContractSettingTeamSaveAPI,
          removeRequest: crmContractSettingTeamDeleteAPI,
          params: { ids: this.selectionList.map(item => item[this.crmType + 'Id']) },
          // 帮助提示
          readOnlyHelp: this.getHelpObj(this.crmType, 'teamReadOnly'),
          readWriteHelp: this.getHelpObj(this.crmType, 'teamReadWrite')
        }
        this.teamsDialogShow = true
      }
    },

    /**
     * 通过回调控制class
     */
    cellClassName({ row, column, rowIndex, columnIndex }) {
      if (column.property === 'name'){
        return 'can-visit--underline can-visit--bold' 
        // return 'can-visit--underline-invoice can-visit--bold'
      }
      if (column.property === 'num' && Number(row.checkStatus) != 2) {
        return 'can-visit--underline can-visit--bold'
      } else if (column.property === 'num' && Number(row.checkStatus) == 2) {
        return 'can-visit--underline-invoice can-visit--bold'
      }else if (
        column.property === 'customerName' ||
        column.property === 'businessName' ||
        column.property === 'contactsName'
      ) {
        return 'can-visit--underline'
      } else if (column.property === 'money') {
        return 'xr-money'
      } else if (column.property === 'receivedMoney') {
        return 'xr-money green'
      } else if (column.property === 'unreceivedMoney') {
        return 'xr-money red'
      } else {
        return ''
      }
    },

    /**
     * 新建点击
     */
    createClick() {
      this.createShow = true
    }
  }
}
</script>

<style lang="scss" scoped>
@import "../styles/table.scss";

.crm-container {
  /deep/ .cell {
    display: flex;
    justify-content: start;
  }

  .status-mark {
    display: inline-block;
    width: 8px;
    height: 8px;
    margin: 8px 2px;
    border-radius: 4px;
  }
}
</style>
