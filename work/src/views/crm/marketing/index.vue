<template>
  <div>
    <!-- <c-r-m-list-head
      :create-fun="createClick"
      :crm-type="crmType"
      title="市场活动管理"
      main-title="新建活动"
      @on-handle="listHeadHandle" /> -->
    <wk-page-header
      :title="config.showModuleName ? '市场活动管理' : ''"
      :help="getHelpObj(crmType, 'index')"
      :dropdowns="getDefaultHeaderHandes()"
      @command="pageHeaderCommand">
      <template slot="right">
        <el-button
          v-if="saveAuth"
          type="primary"
          @click="createClick">新建活动</el-button>
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
      >
        <template slot="custom">
          <div slot="custom" style="margin-left: 8px;">
            关联对象：<el-select
              v-model="marketingCrmType"
              class="type-select"
              mode="no-border"
              @change="refreshList">
              <el-option
                v-for="(item, index) in selectOption"
                :key="index"
                :label="item.name"
                :value="item.value" />
            </el-select>
          </div>
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
          :fixed="index==0"
          :prop="item.prop"
          :label="item.label"
          :width="item.width"
          :formatter="fieldFormatter"
          show-overflow-tooltip />
        <el-table-column />
        <wk-empty
          slot="empty"
          :props="{
            buttonTitle: '新建活动',
            showButton: saveAuth
          }"
          @click="createClick"
        />
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
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </div>
    </div>
    <create
      v-if="isCreate"
      @hiden-view="isCreate = false"
      @save-success="refreshList" />
    <detail
      v-if="showDview"
      :id.sync="rowID"
      :crm-type="rowType"
      :page-list="crmType == rowType ? list : []"
      :page-index.sync="rowIndex"
      @hide-view="showDview = false"
      @handle="handleHandle" />
  </div>
</template>

<script>
import {
  crmMarketingIsEnableAPI,
  crmMarketingDeleteAPI
} from '@/api/crm/marketing'
import {
  crmMarketingFormListAPI
} from '@/api/admin/crm'

import Create from './components/Create'
import Detail from './Detail'
import TableMixin from '../mixins/Table'

export default {
  /** 客户管理 的 活动列表 */
  name: 'Index',

  components: {
    Create,
    Detail
  },

  mixins: [TableMixin],

  data() {
    return {
      crmType: 'marketing',
      selectOption: [],
      marketingCrmType: '', // 类型
      isCreate: false // 是创建
    }
  },

  computed: {
    // 可操作选项
    handleOperations() {
      return this.getOperations([
        'state_start',
        'state_disable',
        'delete'
      ])
    }
  },

  created() {
    this.getCustomFormList()
    this.fieldList = [
      {
        prop: 'marketingName',
        label: '活动名称',
        width: '150'
      },
      {
        prop: 'crmTypeName',
        label: '关联对象',
        width: '80'
      },
      {
        prop: 'createUserName',
        label: '创建人',
        width: '100'
      },
      {
        prop: 'marketingType',
        label: '活动类型',
        width: '150'
      },
      {
        prop: 'startTime',
        label: '开始时间',
        width: '180'
      },
      {
        prop: 'endTime',
        label: '截止时间',
        width: '180'
      },
      {
        prop: 'marketingMoney',
        label: '活动预算',
        width: '100'
      },
      {
        prop: 'address',
        label: '活动地址',
        width: '180'
      },
      {
        prop: 'updateTime',
        label: '更新时间',
        width: '180'
      },
      {
        prop: 'createTime',
        label: '创建时间',
        width: '180'
      },
      {
        prop: 'status',
        label: '状态',
        width: '80'
      }
    ]
  },

  methods: {
    /**
     * @description: 表头事件
     * @param {*} type
     * @return {*}
     */
    tableOperationsClick(type) {
      if (type === 'state_start' || type === 'state_disable') {
        const message = {
          state_start: '确定要启用这些活动吗?',
          state_disable: '确定要停用这些活动吗?'
        }[type]
        this.$confirm(message, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            this.loading = true
            crmMarketingIsEnableAPI({
              marketingIds: this.selectionList.map(item => item.marketingId).join(','),
              status: type === 'state_start' ? 1 : 0
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
      } else if (type === 'delete') {
        this.$confirm(`确定删除选中的${this.selectionList.length}项吗？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            this.loading = true
            crmMarketingDeleteAPI(this.selectionList.map(item => item[`${this.crmType}Id`]))
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

    /**
     * 获取自定义数组
     */
    getCustomFormList() {
      crmMarketingFormListAPI({
        page: this.currentPage,
        limit: this.pageSize,
        pageType: 0
      })
        .then(res => {
          const list = res.data || []
          this.selectOption = [{ name: '全部', value: '' }, { name: '客户', value: 2 }, { name: '线索', value: 1 }].concat(list.map(item => {
            return {
              name: item.title,
              value: item.id
            }
          }))
        })
        .catch(() => {
        })
    },

    /**
     * 新建操作
     */
    createClick() {
      this.isCreate = true
    },

    /**
     * 刷新数据
     */
    refreshList() {
      this.currentPage = 1
      this.getList()
    },

    /** 通过回调控制style */
    cellClassName({ row, column, rowIndex, columnIndex }) {
      if (column.property === 'marketingName') {
        return 'can-visit--underline'
      } else {
        return ''
      }
    },
    /** 格式化 */
    fieldFormatter(row, column, cellValue) {
      if (column.property === 'status') {
        if (cellValue == 1) {
          return '启用'
        } else if (cellValue == 0) {
          return '停用'
        }
      } else if (column.property === 'crmType') {
        if (cellValue == 1) {
          return '线索'
        } else if (cellValue == 2) {
          return '客户'
        }
      } else {
        return cellValue
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import "../styles/table.scss";

.type-select {
  width: 180px;
}
</style>
