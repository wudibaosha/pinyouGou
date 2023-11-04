<template>
  <flexbox
    class="main"
    direction="column"
    align="stretch">
    <xr-header
      label="自定义打印模板">
      <el-button
        slot="ft"
        type="primary"
        @click="addClick">新建打印模板</el-button>
    </xr-header>
    <div class="main-body">
      <el-table
        id="examine-table"
        v-loading="loading"
        :data="list"
        :class="WKConfig.tableStyle.class"
        :stripe="WKConfig.tableStyle.stripe"
        :height="tableHeight"
        :cell-class-name="cellClassName"
        class="main-table"
        highlight-current-row
        style="width: 100%;"
        @row-click="handleRowClick">
        <el-table-column
          v-for="(item, index) in fieldList"
          :key="index"
          :formatter="fieldFormatter"
          :prop="item.prop"
          :min-width="item.width"
          :label="item.label"
          show-overflow-tooltip />
        <el-table-column
          fixed="right"
          label="操作"
          width="250">
          <template slot-scope="scope">
            <el-button
              type="primary-text"
              style="padding: 0;"
              @click="handleClick('edit', scope)">编辑名称</el-button>
            <el-button
              type="primary-text"
              style="padding: 0;"
              @click="handleClick('copy', scope)">复制</el-button>
            <el-button
              type="primary-text"
              style="padding: 0;"
              @click="handleClick('delete', scope)">删除</el-button>
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
      <template-type-add
        :visible.sync="templateAddShow"
        :detail="editData"
        @save="refreshList"
        @next="createNext" />
    </div>
  </flexbox>
</template>

<script>
import XrHeader from '@/components/XrHeader'
import TemplateTypeAdd from './components/TemplateTypeAdd'

import {
  printTemplateListAPI,
  printDeleteTemplateAPI,
  printCopyTemplateAPI } from '@/api/admin/crm'

export default {
  components: {
    XrHeader,
    TemplateTypeAdd
  },
  data() {
    return {
      loading: false, // 加载动画
      tableHeight: document.documentElement.clientHeight - 220, // 表的高度
      list: [],
      fieldList: [
        {
          prop: 'templateName',
          label: '模板名称',
          width: 150
        },
        {
          prop: 'type',
          label: '关联对象',
          width: 150
        },
        {
          prop: 'createTime',
          label: '创建时间',
          width: 150
        },
        {
          prop: 'createUserName',
          label: '创建人',
          width: 150
        },
        {
          prop: 'updateTime',
          label: '更新时间',
          width: 150
        }
      ],
      currentPage: 1,
      pageSize: 10,
      pageSizes: [10, 20, 30, 40],
      total: 0,
      // 新建
      editData: null,
      templateAddShow: false
    }
  },
  mounted() {
    // 控制table的高度
    window.onresize = () => {
      this.tableHeight = document.documentElement.clientHeight - 220
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

    refreshList() {
      this.handleCurrentChange(1)
    },

    /**
     * 数据获取
     */
    getList() {
      this.loading = true
      printTemplateListAPI({
        page: this.currentPage,
        limit: this.pageSize
      })
        .then(res => {
          this.list = res.data.list

          this.total = res.data.totalRow

          this.loading = false
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 格式化字段
     */
    fieldFormatter(row, column) {
      if (column.property === 'type') {
        return {
          5: '商机',
          6: '合同',
          7: '回款'
        }[row[column.property]]
      }
      return row[column.property]
    },

    /**
     * 通过回调控制class
     */
    cellClassName({ row, column, rowIndex, columnIndex }) {
      if (column.property === 'templateName') {
        return 'can-visit--underline'
      } else {
        return ''
      }
    },

    /**
     * 当某一行被点击时会触发该事件
     */
    handleRowClick(row, column, event) {
      if (column.property === 'templateName') {
        this.$router.push({
          name: 'crmPrintDetail',
          query: {
            handle: 'detail',
            templateName: row.templateName,
            templateId: row.templateId,
            type: row.type
          }
        })
      }
    },

    /** ***** 操作 ******/
    addClick() {
      this.editData = null
      this.templateAddShow = true
    },

    createNext(data) {
      this.$router.push({
        name: 'crmPrintDetail',
        query: {
          handle: 'create',
          ...data
        }
      })
    },

    handleClick(type, scope) {
      if (type === 'edit') {
        this.editData = scope.row
        this.templateAddShow = true
      } else if (type === 'delete') {
        // 启用停用
        this.$confirm('确定删除?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            this.loading = true
            printDeleteTemplateAPI({
              templateId: scope.row['templateId']
            })
              .then(res => {
                this.list.splice(scope.$index, 1)
                if (this.list.length == 0) {
                  this.currentPage = this.currentPage - 1 > 0 ? this.currentPage - 1 : 1
                }
                this.getList()
                this.$message({
                  type: 'success',
                  message: '操作成功'
                })
                this.loading = false
              })
              .catch(() => {
                this.loading = false
              })
          })
          .catch(() => {})
      } else if (type === 'copy') {
        this.loading = true
        printCopyTemplateAPI({
          templateId: scope.row['templateId']
        })
          .then(res => {
            this.getList()
            this.$message({
              type: 'success',
              message: '操作成功'
            })
            this.loading = false
          })
          .catch(() => {
            this.loading = false
          })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import "../../styles/index.scss";
@import "../../styles/table.scss";

.main-body {
  margin-top: #{$--interval-base * 2};
}

.el-button--small {
  padding: 0;
}

.wk-help-tips {
  margin-left: 4px;
}
</style>

