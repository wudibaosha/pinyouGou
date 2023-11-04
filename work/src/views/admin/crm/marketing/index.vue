<template>
  <flexbox
    class="main"
    direction="column"
    align="stretch">
    <xr-header
      label="市场活动表单设置">
      <i
        slot="otherLabel"
        class="wk wk-icon-fill-help wk-help-tips"
        data-type="24"
        data-id="228" />
      <el-button
        slot="ft"
        type="primary"
        @click="createClick">新建表单</el-button>
    </xr-header>
    <div class="main-body">
      <el-table
        id="examine-table"
        v-loading="loading"
        :data="list"
        :height="tableHeight"
        :class="WKConfig.tableStyle.class"
        :stripe="WKConfig.tableStyle.stripe"
        class="main-table"
        highlight-current-row
        style="width: 100%;">
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
              @click="handleClick('edit-table', scope)">编辑表单</el-button>
            <el-button
              type="primary-text"
              style="padding: 0;"
              @click="handleClick('edit', scope)">编辑</el-button>
            <el-button
              :disabled="scope.row.isSys === 1"
              type="primary-text"
              style="padding: 0;"
              @click="handleClick('delete', scope)">删除</el-button>
            <el-button
              type="primary-text"
              style="padding: 0;"
              @click="handleClick('change', scope)">{{ scope.row['status'] === 0 ? '启用' : '停用' }}</el-button>
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
  </flexbox>
</template>

<script>
import {
  crmMarketingFormPageAPI,
  crmMarketingFormDeleteAPI,
  crmMarketingFormSaveOrUpdateAPI,
  crmMarketingFormUpdateStatusAPI
} from '@/api/admin/crm'

import XrHeader from '@/components/XrHeader'

import { isEmpty } from '@/utils/types'

export default {
  name: 'MarketingSet',
  components: {
    XrHeader
  },
  data() {
    return {
      loading: false, // 加载动画
      tableHeight: document.documentElement.clientHeight - 220, // 表的高度
      list: [],
      fieldList: [
        {
          prop: 'title',
          label: '表单名称',
          width: 150
        },
        {
          prop: 'createTime',
          label: '创建时间',
          width: 150
        },
        {
          prop: 'updateUserName',
          label: '最后修改人',
          width: 150
        },
        {
          prop: 'updateTime',
          label: '最后修改时间',
          width: 150
        },
        {
          prop: 'status',
          label: '状态',
          width: 100
        }
      ],
      currentPage: 1,
      pageSize: 10,
      pageSizes: [10, 20, 30, 40],
      total: 0
    }
  },
  mounted() {
    window.onresize = () => {
      this.tableHeight = document.documentElement.clientHeight - 220
    }

    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      crmMarketingFormPageAPI({
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

    fieldFormatter(row, column) {
      if (column.property === 'status') {
        if (row[column.property] === 0) {
          return '停用'
        }
        return '启用'
      }
      return row[column.property]
    },

    /**
     *  添加表单
     */
    createClick() {
      this.createViewShow(false, null)
    },

    /**
     * 创建展示
     */
    createViewShow(isEdit, data) {
      this.$prompt('表单名称', isEdit ? '编辑表单' : '新建表单', {
        confirmButtonText: isEdit ? '保存' : '下一步',
        cancelButtonText: '取消',
        inputType: 'text',
        inputValue: isEdit ? data.title : '',
        inputPlaceholder: '请输入内容',
        beforeClose: (action, instance, done) => {
          if (action === 'confirm') {
            const value = instance.$refs.input.value
            if (isEmpty(value)) {
              this.$message.error('请输入内容')
            } else {
              done()
              this.createParamsSubmite(value, isEdit ? data.id : null)
            }
          } else {
            done()
          }
        }
      })
    },

    /**
     * 比较参数
     */
    createParamsSubmite(title, id) {
      this.loading = true
      const params = {
        title
      }

      if (id) {
        params.id = id
      }
      crmMarketingFormSaveOrUpdateAPI(params)
        .then(res => {
          this.loading = false
          if (!id) {
            // 如果是新建 提示去创建表单
            this.$confirm('您将继续完成市场活动表单的创建', '创建成功', {
              showCancelButton: false,
              closeOnClickModal: false,
              closeOnPressEscape: false,
              showClose: false,
              confirmButtonText: '确定',
              type: 'warning',
              callback: action => {
                if (action === 'confirm') {
                  const resData = res.data || {}
                  this.$router.push({
                    name: 'marketingHandlefield',
                    params: {
                      type: 'crm_marketing',
                      label: 'none',
                      id: resData.id
                    }
                  })
                }
              }
            })
          } else {
            this.$message.success('操作成功')
          }
          this.getList()
        })
        .catch(() => {
          this.loading = false
        })
    },

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
    handleClick(type, scope) {
      if (type === 'edit-table') {
        this.$router.push({
          name: 'marketingHandlefield',
          params: {
            type: 'crm_marketing',
            label: 'none',
            id: scope.row.id
          }
        })
      } else if (type === 'edit') {
        this.createViewShow(true, scope.row)
      } else if (type === 'delete') {
        // 启用停用
        this.$confirm('您确定要删除该表单?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            this.loading = true
            crmMarketingFormDeleteAPI({
              id: scope.row['id']
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
      } else if (type === 'change') {
        // 启用停用
        this.$confirm(
          '您确定要' +
            (scope.row['status'] === 0 ? '启用' : '停用') +
            '该表单?',
          '提示',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
          .then(() => {
            crmMarketingFormUpdateStatusAPI({
              id: scope.row['id'],
              status: scope.row['status'] === 0 ? 1 : 0
            })
              .then(res => {
                scope.row['status'] = scope.row['status'] === 0 ? 1 : 0
                this.$message({
                  type: 'success',
                  message: '操作成功'
                })
              })
              .catch(() => {})
          })
          .catch(() => {})
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
</style>

