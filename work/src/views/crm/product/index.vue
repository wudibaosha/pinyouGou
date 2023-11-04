<template>
  <div>
    <wk-page-header
      :title="config.showModuleName ? '产品管理' : ''"
      :help="getHelpObj(crmType, 'index')"
      :dropdowns="getDefaultHeaderHandes()"
      @command="pageHeaderCommand">
      <template slot="right">
        <el-button
          v-if="saveAuth"
          type="primary"
          @click="createClick">新建产品</el-button>
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
        :condition-type-fun="conditionTypeFun"
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
        ref="multiple1Table"
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
            <!-- 产品主图 -->
            <img-view
              v-if="column.property==='mainFile'"
              :src="row[column.property]" />
            <wk-field-view
              v-else
              :props="item"
              :ignore-fields="['status']"
              :form-type="item.formType"
              :value="row[column.property]"
            >
              <template slot-scope="{ data }">
                <span v-if="data.props.fieldName === 'status'">
                  <i v-if="getStatusIcon(row[column.property])" :style="getStatusIcon(row[column.property]).style" :class="getStatusIcon(row[column.property]).icon" />{{ row[column.property] }}
                </span>
                <span v-else>{{ fieldFormatter(row, column, row[column.property], item) }}</span>
              </template>
            </wk-field-view>
          </template>
        </el-table-column>
        <el-table-column />

        <wk-empty
          slot="empty"
          :props="{
            buttonTitle: '新建产品',
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
    <product-detail
      v-if="showDview"
      :id.sync="rowID"
      :page-list="crmType == rowType ? list : []"
      :page-index.sync="rowIndex"
      class="d-view"
      @handle="handleHandle"
      @hide-view="showDview=false" />

    <!-- 新建 -->
    <product-create
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
  </div>
</template>

<script>
import {
  crmProductTransferAPI,
  crmProductStatusAPI,
  crmProductExcelExportAPI,
  crmProductDeleteAPI
} from '@/api/crm/product'

import ImgView from './components/ImgView'
import ProductCreate from './Create'
import ProductDetail from './Detail'
import TransferHandle from '@/components/Page/SelectionHandle/TransferHandle' // 转移

import TableMixin from '../mixins/Table'

export default {
  /** 客户管理 的 产品列表 */
  name: 'ProductIndex',
  components: {
    ImgView,
    ProductCreate,
    ProductDetail,
    TransferHandle
  },
  mixins: [TableMixin],
  data() {
    return {
      crmType: 'product',
      createShow: false,
      // 转移
      transferDialogShow: false,
      transferHandleProps: {}
    }
  },
  computed: {
    // 可操作选项
    handleOperations() {
      return this.getOperations([
        'transfer',
        'export',
        'delete',
        'start',
        'disable'
      ])
    }
  },
  mounted() {},
  methods: {
    test(){
      
      this.$refs.multiple1Table.clearSelection()
      console.log(this.$refs.multiple1Table.clearSelection)
      
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
          request: crmProductTransferAPI,
          params: { ids: this.selectionList.map(item => item[this.crmType + 'Id']) },
          // 帮助提示
          help: this.getHelpObj(this.crmType, 'transfer')
        }
        this.transferDialogShow = true
      } else if (type === 'export') {
        // 成交状态
        this.$wkExport.export(this.crmType, {
          params: { ids: this.selectionList.map(item => item[`${this.crmType}Id`]) },
          request: crmProductExcelExportAPI
        })
      } else if (type === 'delete') {
        this.$confirm(`确定删除选中的${this.selectionList.length}项吗？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            this.loading = true
            crmProductDeleteAPI(this.selectionList.map(item => item[`${this.crmType}Id`]))
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
      } else if (type === 'start' || type === 'disable') {
        const message = {
          start: '确定要上架这些产品吗?',
          disable: '确定要下架这些产品吗?'
        }[type]
        this.$confirm(message, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            this.loading = true
            crmProductStatusAPI({
              ids: this.selectionList.map(item => item.productId),
              status: type === 'start' ? '1' : '0'
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

    /**
     * 通过回调控制class
     */
    cellClassName({ row, column, rowIndex, columnIndex }) {
      if (column.property === 'name') {
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
    },

    /**
     * 获取状态图标
     */
    getStatusIcon(value) {
      if (value === '上架') {
        return {
          icon: 'wk wk-icon-s-up-line',
          style: {
            color: '#00875A',
            marginRight: '4px'
          }
        }
      } else if (value === '下架') {
        return {
          icon: 'wk wk-icon-s-down-line',
          style: {
            color: '#DE350B',
            marginRight: '4px'
          }
        }
      }

      return null
    },

    /**
     * @description: 校准产品状态的formType
     * @param {*}
     * @return {*}
     */
    conditionTypeFun(data) {
      if (data && data.fieldName === 'status') {
        return data.fieldName
      }
      return data.formType
    }
  }
}
</script>

<style lang="scss" scoped>
@import "../styles/table.scss";
</style>
