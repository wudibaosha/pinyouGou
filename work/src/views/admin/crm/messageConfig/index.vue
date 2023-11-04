<template>
  <flexbox
    class="main"
    direction="column"
    align="stretch">
    <xr-header
      label="消息通知设置" />
    <div v-loading="loading" class="main-body">
      <el-table
        v-loading="loading"
        :data="list"
        :class="WKConfig.tableStyle.class"
        :stripe="WKConfig.tableStyle.stripe"
        :height="tableHeight"
        class="main-table is-bottom-border-style"
        highlight-current-row
        style="width: 100%;">
        <el-table-column
          show-overflow-tooltip
          prop="name"
          width="120"
          label="">
          <template slot-scope="{ row, column, $index }">
            <el-checkbox
              v-model="row.checkbox"
              :true-label="1"
              :false-label="0"
              @change="labelCheckboxChange($event, row)">{{ labelObj[row.label] }}</el-checkbox>
          </template>
        </el-table-column>
        <el-table-column
          show-overflow-tooltip
          prop="name"
          min-width="400"
          label="通知人员配置">
          <template slot-scope="{ row, column, $index }">
            <div v-for="(item, index) in row.list" :key="index" class="list">
              <span class="list-name">{{ nameObj[item.name] }}</span>
              <el-button type="text" @click="setClick(item)">设置</el-button>
              <span class="list-des">{{ nameDesObj[item.name] }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          show-overflow-tooltip
          prop="name"
          min-width="150">
          <template
            slot="header"
            slot-scope="slot">
            <el-checkbox
              v-model="pushMessageValue"
              :true-label="1"
              :false-label="0"
              @change="checkboxChange($event, 'pushMessage')">消息通知</el-checkbox>
          </template>
          <template slot-scope="{ row, column, $index }">
            <el-checkbox
              v-for="(item, index) in row.list"
              :key="index"
              v-model="item.pushMessage"
              :true-label="1"
              :false-label="0"
            >{{ nameObj[item.name] }}</el-checkbox>
          </template>
        </el-table-column>

        <el-table-column
          show-overflow-tooltip
          prop="name"
          min-width="150">
          <template
            slot="header"
            slot-scope="slot">
            <el-checkbox
              v-model="pushBrowserValue"
              :true-label="1"
              :false-label="0"
              @change="checkboxChange($event, 'pushBrowser')">浏览器通知</el-checkbox>
          </template>
          <template slot-scope="{ row, column, $index }">
            <el-checkbox
              v-for="(item, index) in row.list"
              :key="index"
              v-model="item.pushBrowser"
              :true-label="1"
              :false-label="0"
            >{{ nameObj[item.name] }}</el-checkbox>
          </template>
        </el-table-column>

        <el-table-column
          show-overflow-tooltip
          prop="name"
          min-width="150">
          <template
            slot="header"
            slot-scope="slot">
            <el-checkbox
              v-model="pushSmsValue"
              :true-label="1"
              :false-label="0"
              @change="checkboxChange($event, 'pushSms')">短信通知</el-checkbox>
          </template>
          <template slot-scope="{ row, column, $index }">
            <el-checkbox
              v-for="(item, index) in row.list"
              :key="index"
              v-model="item.pushSms"
              :true-label="1"
              :false-label="0"
            >{{ nameObj[item.name] }}</el-checkbox>
          </template>
        </el-table-column>

      </el-table>
    </div>

    <message-config-dialog
      :visible.sync="configDialogVisible"
      :data="editData"
    />
  </flexbox>
</template>

<script>
import {
  adminMessageConfigQueryAPI,
  adminMessageConfigUpdateAPI
} from '@/api/admin/messageConfig'

import XrHeader from '@/components/XrHeader'
import MessageConfigDialog from './components/ConfigDialog'

export default {
  // 客户管理 系统消息设置
  name: 'CustomerMessageConfig',
  components: {
    XrHeader,
    MessageConfigDialog
  },
  mixins: [],
  data() {
    return {
      loading: false, // 加载动画
      tableHeight: document.documentElement.clientHeight - 160, // 表的高度
      list: [],
      allList: [], // 一维数组数据
      pushMessageValue: 0,
      pushBrowserValue: 0,
      pushSmsValue: 0,
      labelObj: {
        leads: '线索',
        customer: '客户',
        contacts: '联系人',
        business: '商机',
        contract: '合同',
        receivables: '回款',
        invoice: '发票',
        product: '产品'
      },
      nameObj: {
        save: '新建',
        transfer: '转移',
        excelImport: '导入',
        excelExport: '导出',
        transform: '转化为客户',
        termMember: '添加/移除团队成员',
        updateInvoiceStatus: '发票状态'
      },
      nameDesObj: {
        save: '默认提醒负责人，支持配置其他提醒人',
        transfer: '默认提醒转移人和被转移人，支持配置其他提醒人',
        excelImport: '默认提醒操作人，支持配置其他提醒人',
        excelExport: '默认提醒操作人，支持配置其他提醒人',
        transform: '默认提醒负责人，支持配置其他提醒人',
        termMember: '默认提醒团队成员，支持配置其他提醒人',
        updateInvoiceStatus: '默认提醒开票申请人，支持配置其他提醒人'
      },
      editData: null,
      configDialogVisible: false
    }
  },
  computed: {},
  mounted() {
    window.onresize = () => {
      this.tableHeight = document.documentElement.clientHeight - 160
    }

    this.getList()
  },
  /**
   *  路由更新
   */
  beforeRouteLeave(to, from, next) {
    this.saveInfo()
    next()
  },
  methods: {
    /**
     * 获取列表数据
     */
    getList() {
      this.loading = true
      // 1 是 crm  3 是 进销存
      adminMessageConfigQueryAPI(1)
        .then(res => {
          this.allList = res.data || []
          const list = []
          this.allList.forEach(item => {
            if (list.length === 0 || list[list.length - 1].label !== item.label) {
              list.push({
                ...item,
                checkbox: false,
                list: []
              })
            }
            list[list.length - 1].list.push(item)
          })

          this.list = list
          this.loading = false
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 全选操作
     */
    checkboxChange(value, type) {
      this.allList.forEach(item => {
        item[type] = value
      })
    },

    /**
     * 横向全选
     */
    labelCheckboxChange(value, row) {
      row.list.forEach(item => {
        item.pushMessage = value
        item.pushBrowser = value
        item.pushSms = value
      })
    },

    /**
     * 设置点击
     */
    setClick(item) {
      this.editData = item
      this.configDialogVisible = true
    },

    /**
     * 保存
     */
    saveInfo() {
      this.loading = true
      adminMessageConfigUpdateAPI(this.allList).then(res => {

      }).catch(() => {})
    }
  }
}
</script>

<style lang="scss" scoped>
@import "../../styles/index.scss";
@import "../../styles/table.scss";

.el-checkbox {
  display: block;
}

.list {
  &-name {
    display: inline-block;
    width: 120px;
  }

  &-des {
    margin-left: 8px;
    color: $--color-text-secondary;
  }

  &:last-child {
    margin-bottom: 8px;
  }

  &:first-child {
    margin-top: 8px;
  }
}
</style>
