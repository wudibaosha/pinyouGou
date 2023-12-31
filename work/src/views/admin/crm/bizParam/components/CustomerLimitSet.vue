<template>
  <div>
    <div class="content-header">
      <span>{{ title }}<i
        v-if="helpTypeId"
        class="wk wk-icon-fill-help wk-help-tips"
        data-type="24"
        :data-id="helpTypeId"
        @click.stop="" /></span>
      <el-button
        type="primary"
        @click="addRule">添加规则</el-button>
    </div>
    <div class="customer-table">
      <el-table
        v-loading="loading"
        :data="list"
        :class="WKConfig.tableStyle.class"
        :stripe="WKConfig.tableStyle.stripe"
        :height="tableHeight"
        style="width: 100%;">
        <el-table-column
          v-for="(item, index) in fieldList"
          :key="index"
          :prop="item.field"
          :label="item.label"
          :formatter="fieldFormatter"
          show-overflow-tooltip />
        <el-table-column
          fixed="right"
          label="操作"
          width="120">
          <template slot-scope="scope">
            <el-button
              type="primary-text"
              style="padding: 0;"
              @click="handleEdit(scope.row)">编辑</el-button>
            <el-button
              type="primary-text"
              style="padding: 0;"
              @click="handleDelete(scope)">删除</el-button>
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
          background
          layout="prev, pager, next, sizes, total, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </div>
    </div>

    <edit-customer-limit
      :visible.sync="showAddEdit"
      :types="types"
      :action="action"
      @success="getList" />
  </div>
</template>

<script>
import {
  crmSettingCustomerConfigListAPI,
  crmSettingCustomerConfigDelAPI
} from '@/api/admin/crm'
import EditCustomerLimit from './EditCustomerLimit'

export default {
  name: 'CustomerLimitSet',

  components: {
    EditCustomerLimit
  },

  props: {
    types: [String, Number] // 1拥有客户上限2锁定客户上限
  },

  data() {
    return {
      loading: false, // 展示加载中效果
      tableHeight: document.documentElement.clientHeight - 290, // 表的高度
      // 设置
      list: [],
      // 添加 编辑
      showAddEdit: false,
      action: {},
      currentPage: 1,
      pageSize: 10,
      pageSizes: [10, 20, 30, 40],
      total: 0
    }
  },

  computed: {
    title() {
      return {
        1: '拥有客户数限制',
        2: '锁定客户数限制'
      }[this.types]
    },

    helpTypeId() {
      return {
        1: '220',
        2: '221'
      }[this.types]
    },

    fieldList() {
      const temps = [
        { label: '适用范围', field: 'userIds' },
        {
          label: {
            1: '拥有客户数上限',
            2: '锁定客户数上限'
          }[this.types],
          field: 'customerNum'
        }
      ]

      if (this.types == 1) {
        temps.push({
          label: {
            1: '成交客户是否占有拥有客户数',
            2: '成交客户是否占有锁定客户数'
          }[this.types],
          field: 'customerDeal'
        })
      }

      return temps
    }
  },

  watch: {
    types() {
      this.list = []
      this.getList()
    }
  },
  created() {
    /** 控制table的高度 */
    window.onresize = () => {
      this.tableHeight = document.documentElement.clientHeight - 290
    }
    this.getList()
  },

  methods: {
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

    /**
     * 列表
     */
    getList() {
      this.loading = true
      crmSettingCustomerConfigListAPI({
        page: this.currentPage,
        limit: this.pageSize,
        type: this.types
      })
        .then(res => {
          this.loading = false
          this.list = res.data.list
          this.total = res.data.totalRow
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 列表格式化
     */
    fieldFormatter(row, column) {
      if (column.property == 'customerDeal') {
        return row.customerDeal == 1 ? '是' : '否' // 0 不占用 1 占用
      } else if (column.property === 'userIds') {
        const structures = row['deptIds'] || []
        let strName = structures
          .map(item => item.name)
          .join('、')

        const users = row['userIds'] || []
        const userName = users
          .map(item => item.realname)
          .join('、')

        if (strName && userName) {
          strName += '、'
        }
        const name = strName + userName
        return name || '全公司'
        // 1 启用 0 禁用 2 删除
      } else if (column.property === 'status') {
        if (row[column.property] === 0) {
          return '停用'
        }
        return '启用'
      }
      return row[column.property]
    },

    /**
     * 编辑
     */
    handleEdit(data) {
      this.action = {
        type: 'update',
        data: data
      }
      this.showAddEdit = true
    },

    /**
     * 添加
     */
    addRule() {
      this.action = {
        type: 'save'
      }
      this.showAddEdit = true
    },

    /**
     * 删除
     */
    handleDelete(scope) {
      this.$confirm('确定删除?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          this.loading = true
          crmSettingCustomerConfigDelAPI({
            settingId: scope.row.settingId
          })
            .then(res => {
              this.list.splice(scope.$index, 1)
              this.$message.success('删除成功')
              this.loading = false
            })
            .catch(() => {
              this.loading = false
            })
        })
        .catch(() => {
          this.$message({
            type: 'info',
            message: '已取消删除'
          })
        })
    }
  }
}
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
@import "./index.scss";

.customer-table {
  margin-top: #{$--interval-base * 2};
}

.el-button--small {
  padding: 0;
}
</style>
