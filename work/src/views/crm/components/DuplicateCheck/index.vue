<template>
  <el-dialog
    :visible.sync="visible"
    :append-to-body="true"
    :close-on-click-modal="false"
    :before-close="handleClose"
    title="客户查重"
    custom-class="no-padding-dialog"
    width="800px">
    <span slot="title" class="el-dialog__title">客户查重<i v-if="helpObj" class="wk wk-icon-fill-help wk-help-tips" :data-type="helpObj.type" :data-id="helpObj.id" /></span>
    <div
      v-loading="loading"
      :class="{ 'show-table': showTable }"
      class="duplicate-check">
      <div>
        <el-input
          v-model="searchContent"
          class="search-input"
          @keyup.enter.native="getList">
          <el-select
            slot="prepend"
            v-model="typeSelect">
            <el-option
              label="按客户联系人"
              value="name" />
            <el-option
              label="按手机号/电话"
              value="phone" />
          </el-select>
          <el-button
            slot="append"
            type="primary"
            icon="wk wk-search"
            @click.native="getList">查重</el-button>
        </el-input>
      </div>

      <el-table
        v-if="showTable"
        :data="tableData"
        :cell-class-name="cellClassName"
        class="duplicate-check__content"
        border
        height="380"
        style="width: 100%;"
        @row-click="handleRowClick">
        <el-table-column
          v-for="(item, index) in fieldList"
          :key="index"
          :prop="item.prop"
          :label="item.label"
          :min-width="item.width"
          show-overflow-tooltip />
        <el-table-column
          fixed="right"
          width="110px"
          label="操作">
          <template slot-scope="scope">
            <el-button
              type="primary-text"
              style="padding: 0;"
              :disabled="!scope.row.poolAuthList || !scope.row.poolAuthList.receive"
              @click="handleClick('receive', scope.row)">领取</el-button>
            <el-button
              type="primary-text"
              style="padding: 0;"
              :disabled="!scope.row.poolAuthList ||!scope.row.poolAuthList.distribute"
              @click="handleClick('distribute', scope.row)">分配</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div
        v-if="showTable"
        class="duplicate-check__footer">注：查重结果最多显示10条，如不完整，请完善查重条件</div>

      <c-r-m-full-screen-detail
        :id="relationId"
        :visible.sync="showFullDetail"
        :crm-type="relationCrmType"
        :pool-id="poolId"
        @handle="getList" />

      <alloc-handle
        :pool-id="poolId"
        :selection-list="[relationData]"
        :dialog-visible.sync="allocDialogShow"
        crm-type="customer"
        @handle="getList" />
    </div>
  </el-dialog>
</template>

<script>
import {
  crmCustomerDataCheckAPI,
  crmCustomerReceiveAPI
} from '@/api/crm/customer'

import AllocHandle from '../SelectionHandle/AllocHandle' // 公海分配操作

import crmTypeModel from '@/views/crm/model/crmTypeModel'

export default {
  name: 'DuplicateCheck',
  components: {
    AllocHandle,
    CRMFullScreenDetail: () =>
      import('@/components/CRMFullScreenDetail')
  },
  props: {
    crmType: String,
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      loading: false,
      typeSelect: 'name',
      searchContent: '',
      tableData: null,

      showFullDetail: false, // 查看相关客户管理详情
      relationId: '', // 相关ID参数
      relationData: {}, // 关联数据
      poolId: '', // 公海Id
      relationCrmType: '', // 相关类型
      allocDialogShow: false //  分配弹窗
    }
  },
  computed: {
    showTable() {
      return this.tableData
    },

    isCustomerFilter() {
      return this.typeSelect == 'name'
    },

    // 客户联系人、创建时间、负责人、最后跟进时间、操作
    fieldList() {
      if (this.isCustomerFilter) {
        return [{
          prop: 'name',
          label: '客户联系人',
          width: 200
        }, {
          prop: 'createTime',
          label: '创建时间',
          width: 160
        }, {
          prop: 'ownerUserName',
          label: '负责人',
          width: 100
        }, {
          prop: 'lastTime',
          label: '最后跟进时间',
          width: 160
        }, {
          prop: 'module',
          label: '模块',
          width: 100
        }]
      }

      return [{
        prop: 'mobile',
        label: '手机号/电话',
        width: 160
      }, {
        prop: 'contactsName',
        label: '联系人',
        width: 160
      }, {
        prop: 'name',
        label: '客户联系人',
        width: 200
      }, {
        prop: 'ownerUserName',
        label: '负责人',
        width: 100
      }, {
        prop: 'module',
        label: '模块',
        width: 100
      }]
    },

    // 帮助信息
    helpObj() {
      return {
        leads: {
          type: '7',
          id: '77'
        }, customer: {
          type: '8',
          id: '78'
        }, contacts: {
          type: '9',
          id: '79'
        }
      }[this.crmType] || null
    }
  },
  watch: {
    typeSelect() {
      this.searchContent = ''
      this.tableData = null
    }
  },
  mounted() {},
  methods: {
    handleClose() {
      this.$emit('update:visible', false)
      this.resetData()
    },

    resetData() {
      this.typeSelect = 'name'
      this.searchContent = ''
      this.tableData = null
    },

    getList() {
      if (!this.searchContent) {
        return
      }
      const params = {}
      params[this.typeSelect] = this.searchContent
      this.loading = true
      crmCustomerDataCheckAPI(params).then(res => {
        this.loading = false
        const list = res.data || []
        this.tableData = list.map(item => {
          item.module = crmTypeModel.convertTypeToName(item.type)
          if (item.poolName) {
            item.module = `${item.module}（${item.poolName}）`
          }
          // 是手机号
          if (!this.isCustomerFilter) {
            item.mobile = this.searchContent
            if (item.type == crmTypeModel.contacts) {
              item.contactsName = item.name
              item.contactsId = item.id

              item.name = item.customerName
              item.id = item.customerId
              // name 字段对应的点击类型 以type为准，所以将type校准为客户
              // 联系人详情 已 contactsId 为准
              item.type = crmTypeModel.customer
            }
          }

          return item
        })
      }).catch(() => {
        this.loading = false
      })
    },

    /**
     * 列表点击
     */
    handleRowClick(row, column, event) {
      if (column.property == 'name' && row.id) {
        this.relationId = row.id
        if (row.poolAuthList) {
          this.poolId = row.poolAuthList.poolId
        } else {
          this.poolId = ''
        }
        const key = crmTypeModel.convertTypeToKey(row.type)
        this.relationCrmType = key == 'pool' ? 'customer' : key
        this.showFullDetail = true
      } else if (column.property == 'contactsName' && row.contactsId) {
        this.relationId = row.contactsId
        this.relationCrmType = 'contacts'
        this.showFullDetail = true
      }
    },

    /**
     * 通过回调控制class
     */
    cellClassName({ row, column, rowIndex, columnIndex }) {
      if (column.property === 'name' || column.property === 'contactsName') {
        return 'can-visit--underline'
      } else {
        return ''
      }
    },

    handleClick(type, data) {
      if (type === 'receive') {
        this.$confirm('确定要领取该客户吗?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            crmCustomerReceiveAPI({
              ids: [data.id],
              poolId: data.poolAuthList.poolId
            })
              .then(res => {
                this.$message.success('操作成功')
                this.getList()
              })
              .catch(() => {})
          })
          .catch(() => {})
      } else {
        data['customerId'] = data.id
        this.relationData = data
        this.allocDialogShow = true
      }
    }
  }
}
</script>

<style scoped lang="scss">
.duplicate-check {
  position: relative;
  padding: 20px;
  padding-bottom: 40px;

  &__content {
    margin-top: 15px;
  }

  &__footer {
    margin-top: 8px;
  }
}

.duplicate-check.show-table {
  padding-bottom: 20px;
}

.el-input {
  /deep/ .el-select .el-input {
    width: 130px;

    /deep/ i {
      font-weight: bold;
    }
  }

  /deep/ .el-input-group__append {
    color: white;
    background-color: $--color-primary;
    border-color: $--color-primary;

    .el-button {
      /deep/ i {
        margin-right: 5px;
        font-size: 14px;
      }
    }
  }
}
</style>
