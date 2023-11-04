
<template>
  <div
    v-loading="loading"
    v-empty="nopermission"
    class="rc-cont"
    xs-empty-icon="nopermission"
    xs-empty-text="暂无权限">
    <flexbox
      v-if="!isSeas"
      class="rc-head"
      direction="row-reverse">
      <el-button
        v-if="contactsSave"
        icon="el-icon-plus"
        @click="createClick">新建地址</el-button>
    </flexbox>
    <el-table
      v-show="fieldList.length > 0"
      :data="list"
      :height="tableHeight"
      class="table"
      stripe>
      <el-table-column
        v-for="(item, index) in fieldList"
        :key="index"
        :prop="item.prop"
        :label="item.label"
        :formatter="fieldFormatter"
        resizable
        show-overflow-tooltip />
      <el-table-column
        label="操作"
        width="230">
        <template slot-scope="scope">
          <flexbox
            v-if="!isSeas"
            justify="space-between">
            <span v-if="scope.row.isMain==1" class="chief">
              <i class="wk wk-success" />主地址
            </span>
            <el-button
              v-else
              class="set-chief-btn"
              type="text"
              @click.native="setChieflyAddress(scope)">设为主地址</el-button>
            <el-button
              class="set-chief-btn"
              type="text"
              @click.native="editAddress(scope)">编辑</el-button>
            <el-button
              class="set-chief-btn"
              type="text"
              @click.native="cancel(scope)">删除</el-button>
          </flexbox>
        </template>
      </el-table-column>
    </el-table>
    <create
      v-if="isCreate"
      :action="createActionInfo"
      crm-type="customer"
      @save-success="createSaveSuccess"
      @close="isCreate=false" />
  </div>
</template>

<script type="text/javascript">
import Create from './Create'
import {
  crmCustomerQueryAddressByIdAPI,
  crmCustomerSetIsMainAPI,
  crmCustomerCancellationAddressAPI
} from '@/api/crm/customer'
import { getPermissionByKey } from '@/utils'

export default {
  name: 'RelativeAddress', // 相关地址
  components: {
    // CRMFullScreenDetail: () => import('@/components/CRMFullScreenDetail'),
    Create
  },
  mixins: [],
  props: {
    // 模块ID
    id: [String, Number],
    // 首要联系人ID
    contactsId: [String, Number],
    // 客户类型
    crmType: {
      type: String,
      default: ''
    },
    // 是公海 默认是客户
    isSeas: {
      type: Boolean,
      default: false
    },
    // 联系人人下 新建商机 需要联系人里的客户信息  合同下需要客户和商机信息
    detail: {
      type: Object,
      default: () => {
        return {}
      }
    }
  },
  data() {
    return {
      loading: false,
      nopermission: false,
      list: [],
      fieldList: [],
      tableHeight: '400px',
      // 控制新建
      isCreate: false,
      // 创建的相关信息
      createActionInfo: { type: 'save', crmType: this.crmType, detail: this.detail }
    }
  },
  inject: ['rootTabs'],
  computed: {
    // 联系人下客户id获取关联商机
    customerId() {
      return this.detail.customerId
    },
    contactsSave() {
      return !!getPermissionByKey('crm.contacts.save')
    }
  },
  watch: {
    id(val) {
      this.list = []
      this.getDetail()
    },

    'rootTabs.currentName'(val) {
      if (val === 'RelativeAddress') {
        this.getDetail(false)
      }
    }
  },
  mounted() {
    this.getDetail()
  },
  methods: {
    /**
     * 表头数据
     */
    getFieldList() {
      this.fieldList.push({ prop: 'addressType', width: '200', label: '地址类型' })
      this.fieldList.push({ prop: 'postalCode', width: '200', label: '邮政编码' })
      this.fieldList.push({ prop: 'contactsName', width: '200', label: '联系人' })
      this.fieldList.push({ prop: 'telephone', width: '200', label: '联系方式' })
      this.fieldList.push({ prop: 'address', width: '200', label: '地址' })
      this.fieldList.push({ prop: 'remark', width: '200', label: '备注' })
    },

    /**
     * 获取数据
     */
    getDetail(loading = true) {
      this.loading = loading
      const request = {
        customer: crmCustomerQueryAddressByIdAPI
      }[this.crmType]
      const params = { pageType: 0 }
      params[this.crmType + 'Id'] = this.id
      request(params)
        .then(res => {
          if (this.fieldList.length == 0) {
            this.getFieldList()
          }
          this.nopermission = false
          this.loading = false
          this.list = res.data
        })
        .catch(data => {
          if (data.code == 102) {
            this.nopermission = true
          }
          this.loading = false
        })
    },

    /**
     * 新建
     */
    createClick() {
      //  客户 下新建联系人
      if (this.crmType == 'customer') {
        this.createActionInfo.type = 'save'
      }
      this.isCreate = true
    },
    createSaveSuccess() {
      this.$bus.emit('crm-tab-num-update')
      this.getDetail()
    },

    /**
     * 设置主地址
     */
    setChieflyAddress(data) {
      const request = {
        customer: crmCustomerSetIsMainAPI
      }[this.crmType]

      const params = { addressId: data.row.addressId }
      params[this.crmType + 'Id'] = this.id
      this.loading = true
      request(params)
        .then(res => {
          this.$message.success('操作成功')
          this.getDetail()
          this.loading = false
        })
        .catch(data => {
          this.loading = false
        })
    },
    /**
     * 删除
     */
    cancel(data) {
      this.$confirm('确认删除么?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          const params = {
            customerId: this.id,
            addressId: data.row.addressId
          }
          crmCustomerCancellationAddressAPI(params)
            .then(res => {
              this.getDetail()
              this.$message.success('操作成功')
            })
            .catch(() => {})
        })
        .catch(() => {})
    },
    /**
    * 编辑地址
    */
    editAddress(scope) {
      this.createActionInfo.type = 'update'
      this.createActionInfo.rowData = scope.row
      this.isCreate = true
    },
    fieldFormatter(row, column, cellValue) {
      // 1 只读 2 读写 3 负责人
      if (column.property === 'addressType') {
        return {
          1: '办公地址',
          2: '仓储地址',
          3: '注册地址',
          4: '门店地址',
          5: '家庭地址',
          6: '其他'
        }[row[column.property]]
      }
      return row[column.property] === '' || row[column.property] === null ? '--' : row[column.property]
    }
  }
}
</script>
<style lang="scss" scoped>
@import "../../styles/relativecrm.scss";

.set-chief-btn {
  padding: 4px 12px;
}

.chief {
  i {
    margin-right: 3px;
    font-size: 14px;
    color: $--color-g300;
  }
}
</style>

