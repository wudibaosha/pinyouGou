<template>
  <div class="main">
    <xr-header
      label="登录日志" />
    <div class="main-body">
      <flexbox class="main-table-header">
        <el-date-picker
          v-model="dateTime"
          type="daterange"
          value-format="yyyy-MM-dd"
          range-separator="-"
          start-placeholder="开始时间"
          end-placeholder="结束时间" />
        <wk-user-dialog-select
          v-model="userList"
          :radio="false"
          placeholder="选择人员" />
        <el-button
          type="primary"
          @click="refreshList">查询</el-button>
        <el-button
          class="main-table-header-button"
          @click="exportClick">导出</el-button>
      </flexbox>
      <el-table
        v-loading="loading"
        :data="list"
        :class="WKConfig.tableStyle.class"
        :stripe="WKConfig.tableStyle.stripe"
        :height="tableHeight"
        :cell-class-name="cellClassName"
        class="main-table"
        highlight-current-row
        style="width: 100%;">
        <el-table-column
          v-for="(item, index) in fieldList"
          :key="index"
          :prop="item.prop"
          :label="item.label"
          show-overflow-tooltip />
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
  </div>
</template>

<script>
import {
  queryLoginLogListAPI,
  loginLogExportAPI
} from '@/api/admin/log'

import XrHeader from '@/components/XrHeader'
import WkUserDialogSelect from '@/components/NewCom/WkUserDialogSelect'
import { Loading } from 'element-ui'

import { downloadExcelWithResData } from '@/utils'

export default {
  // 登录日志
  name: 'LoginLog',
  components: {
    XrHeader,
    WkUserDialogSelect
  },
  mixins: [],
  data() {
    return {
      loading: false, // 加载动画
      tableHeight: document.documentElement.clientHeight - 270, // 表的高度
      dateTime: [],
      userList: [],
      list: [],
      fieldList: [
        {
          prop: 'realname',
          label: '用户',
          width: 100
        },
        {
          prop: 'loginTime',
          label: '登录时间',
          width: 150
        },
        {
          prop: 'ipAddress',
          label: 'IP地址',
          width: 100
        },
        {
          prop: 'loginAddress',
          label: '登录地点',
          width: 150
        },
        {
          prop: 'deviceType',
          label: '设备类型',
          width: 150
        },
        {
          prop: 'core',
          label: '终端内核',
          width: 150
        },
        {
          prop: 'platform',
          label: '平台',
          width: 100
        },
        {
          prop: 'authResult',
          label: '认证结果',
          width: 100
        }
      ],
      currentPage: 1,
      pageSize: 10,
      pageSizes: [10, 20, 30, 40],
      total: 0,

      postParams: {}
    }
  },
  computed: {},
  mounted() {
    // 控制table的高度
    window.onresize = () => {
      self.tableHeight = document.documentElement.clientHeight - 270
    }

    this.getList()
  },
  methods: {
    refreshList() {
      this.currentPage = 1
      this.getList()
    },

    /** 获取列表数据 */
    getList() {
      this.loading = true
      const params = {
        page: this.currentPage,
        limit: this.pageSize
      }
      if (this.userList && this.userList.length) {
        params.userIds = this.userList
      }

      if (this.dateTime && this.dateTime.length) {
        params.startTime = this.dateTime[0]
        params.endTime = this.dateTime[1]
      }

      this.postParams = params
      queryLoginLogListAPI(params)
        .then(res => {
          const list = res.data.list || []
          list.forEach(item => {
            item.authResult = {
              1: '成功',
              2: '失败'
            }[item.authResult]
          })
          this.list = list
          this.total = res.data.totalRow
          this.loading = false
        })
        .catch(() => {
          this.loading = false
        })
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
     *  添加审批流
     */
    exportClick() {
      const loading = Loading.service({ fullscreen: true, text: '导出中...' })
      loginLogExportAPI(this.postParams)
        .then(res => {
          downloadExcelWithResData(res)
          loading.close()
        })
        .catch(() => {
          loading.close()
        })
    },
    // 更改每页展示数量
    handleSizeChange(val) {
      this.pageSize = val
      this.getList()
    },
    // 更改当前页数
    handleCurrentChange(val) {
      this.currentPage = val
      this.getList()
    }
  }
}
</script>

<style lang="scss" scoped>
@import "./index.scss";
</style>
