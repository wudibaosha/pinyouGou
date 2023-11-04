<template>
  <div>
    <!-- <c-r-m-list-head
      :crm-type="crmType"
      :create-fun="createClick"
      :show-title="config.showModuleName"
      title="商机管理"
      main-title="新建商机"
      @on-handle="listHeadHandle"
      @on-export="exportInfos" /> -->
    <wk-page-header
      :title="config.showModuleName ? '商机管理' : ''"
      :help="getHelpObj(crmType, 'index')"
      :dropdowns="getDefaultHeaderHandes()"
      @command="pageHeaderCommand">
      <template slot="right">
        <el-button
          v-if="saveAuth"
          type="primary"
          @click="createClick">新建商机</el-button>
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


          
          <!-- <template slot-scope="{ row, column }">

            
          </template> -->

          <template slot-scope="{ row, column }">

            <template v-if="item.prop == 'isOrContract'">
              <span :class="row[item.prop] | dealIcon" />
              <span>{{ row[item.prop] | dealName }}</span>
            </template>

           
            <wk-field-view
              v-else
              :props="item"
              :form-type="item.formType"
              :value="row[column.property]">
              <template>
                {{ fieldFormatter(row, column, row[column.property], item) }}
              </template>
            </wk-field-view>
          </template>
        </el-table-column>
        <el-table-column />

        <wk-empty
          slot="empty"
          :props="{
            buttonTitle: '新建商机',
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
        <span v-if="moneyPageData" class="money-bar">商机金额<i v-if="showBottomMoney" class="wk wk-icon-fill-help wk-help-tips" data-type="10" data-id="152" />：{{ moneyPageData.businessSumMoney || 0 | separator }}</span>
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
    <business-create
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
  crmBusinessTransferAPI,
  crmBusinessSettingTeamSaveAPI,
  crmBusinessSettingTeamDeleteAPI,
  crmBusinessExcelExportAPI,
  crmBusinessDeleteAPI
} from '@/api/crm/business'

import BusinessCreate from './Create'
import CRMAllDetail from '@/views/crm/components/CRMAllDetail'
import TransferHandle from '@/components/Page/SelectionHandle/TransferHandle' // 转移
import TeamsHandle from '@/components/Page/SelectionHandle/TeamsHandle' // 操作团队成员

import TableMixin from '../mixins/Table'
import { floatAdd } from '@/utils'

export default {
  /** 客户管理 的 商机列表 */
  name: 'BusinessIndex',
  components: {
    BusinessCreate,
    CRMAllDetail,
    TransferHandle,
    TeamsHandle
  },
  mixins: [TableMixin],
  data() {
    return {
      crmType: 'business',
      createShow: false,
      moneyData: null, // 列表金额
      // 转移
      transferDialogShow: false,
      transferHandleProps: {},
      // 团队展示
      teamsHandleProps: {},
      teamsDialogShow: false
    }
  },
  filters: {
    dealIcon(statu) {
      return statu == 1 ? 'deal-suc' : 'deal-un'
    },

    dealName(statu) {
      return statu == 1 ? '是' : '否'
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

      if (!this.moneyData || JSON.stringify(this.moneyData) == '{}') {
        return null
      }

      if (this.selectionList.length == 0) {
        return this.moneyData || {}
      } else {
        let money = 0.0
        for (let index = 0; index < this.selectionList.length; index++) {
          const element = this.selectionList[index]
          money = floatAdd(money, parseFloat(element.money))
        }
        return {
          businessSumMoney: money.toFixed(2)
        }
      }
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
  mounted() {},
  methods: {
    /**
     * @description: 表头事件
     * @param {*} type
     * @return {*}
     */
    tableOperationsClick(type) {
      if (type === 'transfer') {
        this.transferHandleProps = {
        // 场景编辑请求
          request: crmBusinessTransferAPI,
          params: { ids: this.selectionList.map(item => item[this.crmType + 'Id']) },
          showRemoveType: true, // 是否展示移除操作类型
          // 帮助提示
          help: this.getHelpObj(this.crmType, 'transfer')
        }
        this.transferDialogShow = true
      } else if (type === 'export') {
        // 成交状态
        this.$wkExport.export(this.crmType, {
          params: { ids: this.selectionList.map(item => item[`${this.crmType}Id`]) },
          request: crmBusinessExcelExportAPI
        })
      } else if (type === 'delete') {
        this.$confirm(`确定删除选中的${this.selectionList.length}项吗？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            this.loading = true
            crmBusinessDeleteAPI(this.selectionList.map(item => item[`${this.crmType}Id`]))
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
          addRequest: crmBusinessSettingTeamSaveAPI,
          removeRequest: crmBusinessSettingTeamDeleteAPI,
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
      if (column.property === 'businessName') {
        return 'can-visit--underline can-visit--bold'
      } else if (column.property === 'customerName') {
        return 'can-visit--underline'
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
</style>
