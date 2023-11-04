<template>
  <div class="system-customer main">
    <xr-header
      label="自定义字段设置" />
    <div class="main-body">
      <el-table
        v-loading="loading"
        :data="tableList"
        :class="WKConfig.tableStyle.class"
        :stripe="WKConfig.tableStyle.stripe"
        :height="tableHeight"
        highlight-current-row
        style="width: 100%;">
        <el-table-column
          width="100"
          label="模块图标">
          <template slot-scope="scope">
            <div
              class="table-icon">
              <i :class="getLableIcon(scope.row.label) " />
            </div>
          </template>
        </el-table-column>
        <el-table-column
          prop="name"
          label="模块"
          show-overflow-tooltip />
        <el-table-column
          prop="name"
          label="更新时间"
          show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ scope.row.updateTime == 0 ? '暂无' : scope.row.updateTime }}</span>
          </template>
        </el-table-column>

        <el-table-column
          fixed="right"
          label="操作"
          width="100">
          <template slot-scope="scope">
            <el-button
              type="primary-text"
              style="padding: 0;"
              @click="handleCustomField('edit', scope.row, scope.$index)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script>
import { customFieldIndexAPI } from '@/api/admin/crm'

import XrHeader from '@/components/XrHeader'

export default {
  name: 'CustomField',

  components: {
    XrHeader
  },

  data() {
    return {
      loading: false,
      tableHeight: document.documentElement.clientHeight - 140, // 表的高度
      // 自定义字段设置
      tableList: []
    }
  },

  created() {
    // 控制table的高度
    window.onresize = () => {
      self.tableHeight = document.documentElement.clientHeight - 140
    }

    this.getDetail()
  },

  methods: {
    /**
     * 详情
     */
    getDetail() {
      this.loading = true
      customFieldIndexAPI()
        .then(res => {
          this.tableList = res.data
          this.loading = false
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 列表的编辑和预览
     */
    handleCustomField(type, item, index) {
      if (type === 'edit') {
        this.$router.push({
          name: 'customField',
          params: {
            type: {
              1: 'crm_leads',
              2: 'crm_customer',
              3: 'crm_contacts',
              4: 'crm_product',
              5: 'crm_business',
              6: 'crm_contract',
              7: 'crm_receivables',
              8: 'crm_receivables_plan',
              17: 'crm_visit',
              18: 'crm_invoice'
            }[item.label],
            id: 'none',
            label: item.label
          }
        })
      }
    },

    /**
     * 根据自定义字段types 获取展示icon
     */
    getLableIcon(label) {
      return {
        1: 'wk wk-leads',
        2: 'wk wk-customer',
        3: 'wk wk-contacts',
        4: 'wk wk-product',
        5: 'wk wk-business',
        6: 'wk wk-contract',
        7: 'wk wk-receivables',
        8: 'wk wk-icon-plan-solid',
        17: 'wk wk-icon-visit-solid',
        18: 'wk wk-invoice'
      }[label] || 'wk wk-icon-all-solid'
    }
  }
}
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
@import "../../styles/index.scss";

.main-body {
  margin-top: #{$--interval-base * 2};
}
</style>
