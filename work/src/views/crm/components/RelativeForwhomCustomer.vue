<template>
  <div
    v-loading="loading"
    v-empty="nopermission"
    class="rc-cont"
    xs-empty-icon="nopermission"
    xs-empty-text="暂无权限">
    <div class="up">
      <flexbox justify="space-between" class="rc-header">
        <div class="title">上级客户</div>
        <div
          v-if="!isSeas">
          <!-- <el-button
            v-if="customerSave"
            class="xr-btn--orange rc-head-item"
            icon="el-icon-plus"
            @click="createClick">新建上级客户</el-button> -->
          <template v-if="canRelation">
            <crm-relative
              v-if="showUpRelativeView"
              :visible.sync="showUpRelativeView"
              :radio="true"
              crm-type="customer"
              @close="showUpRelativeView = false"
              @changeCheckout="checkUpRelativeInfos" />
            <el-button
              icon="el-icon-plus"
              @click="showUpRelativeClick">关联上级客户</el-button>
          </template>
        </div>
      </flexbox>
      <el-table
        v-show="fieldList.length > 0"
        :data="upList"
        :height="tableHeight"
        :cell-class-name="cellClassName"
        stripe
        style="width: 100%;"
        @row-click="handleRowClick">
        <el-table-column
          v-for="(item, index) in fieldList"
          :key="index"
          :prop="item.prop"
          :label="item.label"
          resizable
          show-overflow-tooltip>
          <template slot-scope="{ row, column, $index }">
            <template v-if="item.prop == 'dealStatus'">
              <i :class="row[item.prop] | dealIcon" />
              <span>{{ row[item.prop] | dealName }}</span>
            </template>
            <template v-else-if="item.prop == 'status'">
              <i
                v-if="row.status == 2"
                class="wk wk-circle-password customer-lock" />
            </template>
            <wk-field-view
              v-else
              :props="item"
              :form-type="item.formType"
              :value="row[column.property]"
            >
              <template slot-scope="{ data }">
                {{ fieldFormatter(row, column, row[column.property], item) }}
              </template>
            </wk-field-view>
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="100"
          fixed="right">
          <template slot-scope="scope">
            <flexbox justify="center">
              <el-button
                v-if="!isSeas"
                class="set-chief-btn"
                type="primary-text"
                @click.native="unRelevanceHandleClick(scope,'up')">解除关联</el-button>
            </flexbox>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="down">
      <flexbox justify="space-between" class="rc-header">
        <div class="title">下级客户</div>
        <div
          v-if="!isSeas"
          direction="row-reverse">
          <!-- <el-button
            v-if="customerSave"
            icon="el-icon-plus"
            @click="createClick">新建下级客户</el-button> -->
          <template v-if="canRelation">
            <crm-relative
              v-if="showDownRelativeView"
              :visible.sync="showDownRelativeView"
              :radio="true"
              crm-type="customer"
              @close="showDownRelativeView = false"
              @changeCheckout="checkDownRelativeInfos" />
            <el-button
              icon="el-icon-plus"
              @click="showDownRelativeView = true">关联下级客户</el-button>
          </template>
        </div>
      </flexbox>

      <el-table
        v-show="fieldList.length > 0"
        :data="downList"
        :height="tableHeight"
        :cell-class-name="cellClassName"
        stripe
        @row-click="handleRowClick">
        <el-table-column
          v-for="(item, index) in fieldList"
          :key="index"
          :prop="item.prop"
          :label="item.label"
          resizable
          show-overflow-tooltip>
          <template slot-scope="{ row, column, $index }">
            <template v-if="item.prop == 'dealStatus'">
              <i :class="row[item.prop] | dealIcon" />
              <span>{{ row[item.prop] | dealName }}</span>
            </template>
            <template v-else-if="item.prop == 'status'">
              <i
                v-if="row.status == 2"
                class="wk wk-circle-password customer-lock" />
            </template>
            <wk-field-view
              v-else
              :props="item"
              :form-type="item.formType"
              :value="row[column.property]"
            >
              <template slot-scope="{ data }">
                {{ fieldFormatter(row, column, row[column.property], item) }}
              </template>
            </wk-field-view>
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="100"
          fixed="right">
          <template slot-scope="scope">
            <flexbox justify="center">
              <el-button
                v-if="!isSeas"
                class="set-chief-btn"
                type="primary-text"
                @click.native="unRelevanceHandleClick(scope,'down')">解除关联</el-button>
            </flexbox>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <c-r-m-full-screen-detail
      :id="detailId"
      :visible.sync="showFullDetail"
      crm-type="customer"
      @handle="detailHandle" />
    <c-r-m-all-create
      v-if="isCreate"
      :action="createActionInfo"
      crm-type="customer"
      @save-success="createSaveSuccess"
      @close="isCreate=false" />
  </div>
</template>

<script type="text/javascript">
import {
  filedGetTableFieldAPI
} from '@/api/crm/common'
import {
  crmCustomerQuerySuperiorByIdAPI,
  crmCustomerSaveSuperiorAPI,
  crmCustomerSaveSubordinateAPI,
  crmCustomerDeleteSuperiorAPI
} from '@/api/crm/customer'

import CRMAllCreate from './CRMAllCreate'
import CrmRelative from '@/components/CreateCom/CrmRelative'
import WkFieldView from '@/components/NewCom/WkForm/WkFieldView'

import { getPermissionByKey } from '@/utils'
import { getFormFieldShowName } from '@/components/NewCom/WkForm/utils'

export default {
  name: 'RelativeForwhomCustomer', // 相关上下级客户
  components: {
    CRMFullScreenDetail: () => import('@/components/CRMFullScreenDetail'),
    CRMAllCreate,
    CrmRelative,
    WkFieldView
  },
  filters: {
    dealIcon(statu) {
      return statu == 1 ? 'wk wk-success deal-suc' : 'wk wk-close deal-un'
    },

    dealName(statu) {
      return statu == 1 ? '已成交' : '未成交'
    }
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
      upList: [],
      downList: [],
      fieldList: [],
      tableHeight: '200px',
      showFullDetail: false,
      // 控制新建
      isCreate: false,
      // 查看全屏联系人详情的 ID
      detailId: '',
      // 创建的相关信息
      createActionInfo: { type: 'relative', crmType: this.crmType, data: {}},
      // 关联的逻辑
      showUpRelativeView: false, // 上级
      showDownRelativeView: false // 下级
    }
  },
  inject: ['rootTabs'],
  computed: {
    // 联系人下客户id获取关联商机
    customerId() {
      return this.detail.customerId
    },
    // 是否能关联
    canRelation() {
      return this.crmType == 'customer'
    },
    customerSave() {
      return !!getPermissionByKey('crm.customer.save')
    }
  },
  watch: {
    id(val) {
      this.upList = []
      this.downList = []
      this.getDetail()
    },

    'rootTabs.currentName'(val) {
      if (val === 'RelativeForwhomCustomer') {
        this.getDetail(false)
      }
    }
  },
  mounted() {
    this.getDetail()
  },
  methods: {
    /**
     * 关联上级客户
     */
    showUpRelativeClick() {
      if (this.upList.length > 0) {
        this.$message.error('只能关联一个上级客户')
      } else {
        this.showUpRelativeView = true
      }
    },
    /**
     * 关联上级的数据
     */
    checkUpRelativeInfos(data) {
      if (data.data.length > 0) {
        if (data.data[0].customerId == this.id) {
          this.$message.error('上级客户不能是当前客户')
          return
        }
        const params = {
          superiorCustomerId: data.data[0].customerId,
          subordinateCustomerId: this.id
        }
        crmCustomerSaveSuperiorAPI(params)
          .then(res => {
            this.getDetail()
            this.$message.success('操作成功')
          })
          .catch(() => {})
      }
    },
    /**
     * 关联下级的数据
     */
    checkDownRelativeInfos(data) {
      if (data.data.length > 0) {
        if (data.data[0].customerId == this.id) {
          this.$message.error('下级客户不能是当前客户')
          return
        }
        const params = {
          superiorCustomerId: this.id,
          subordinateCustomerId: data.data[0].customerId
        }
        crmCustomerSaveSubordinateAPI(params)
          .then(res => {
            this.getDetail()
            this.$message.success('操作成功')
          })
          .catch(() => {})
      }
    },

    /**
     * 取消关联
     */
    unRelevanceHandleClick(scope, type) {
      this.$confirm('确认取消关联?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          let params
          if (type == 'up') {
            params = {
              superiorCustomerId: scope.row.customerId,
              subordinateCustomerId: this.id
            }
          } else {
            params = {
              superiorCustomerId: this.id,
              subordinateCustomerId: scope.row.customerId
            }
          }
          crmCustomerDeleteSuperiorAPI(params)
            .then(res => {
              this.getDetail()
              this.$message.success('操作成功')
            })
            .catch(() => {})
        })
        .catch(() => {})
    },

    /**
     * 表头数据
     */
    getFieldList() {
      filedGetTableFieldAPI({
        label: 2
      }).then(res => {
        const fieldList = []
        for (let index = 0; index < res.data.length; index++) {
          const element = res.data[index]
          fieldList.push({ prop: element.fieldName, width: '150', label: element.name, formType: element.formType })
        }
        this.fieldList = fieldList
      }).catch(() => {})
    },

    /**
     * 获取数据
     */
    getDetail(loading = true) {
      this.loading = loading
      const request = {
        customer: crmCustomerQuerySuperiorByIdAPI
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
          this.upList = res.data.superiorCustomer || []
          this.downList = res.data.subordinateCustomer || []
        })
        .catch(data => {
          if (data.code == 102) {
            this.nopermission = true
          }
          this.loading = false
        })
    },

    /**
     * 当某一行被点击时会触发该事件
     */
    handleRowClick(row, column, event) {
      if (column.property == 'customerName') {
        this.detailId = row.customerId
        this.showFullDetail = true
      }
    },

    /**
     * 通过回调控制class
     */
    cellClassName({ row, column, rowIndex, columnIndex }) {
      if (column.property === 'customerName') {
        return 'can-visit--underline'
      } else {
        return ''
      }
    },

    /**
     * 新建下级客户
     */
    createClick() {
      this.createActionInfo.data['customer'] = this.detail
      this.isCreate = true
    },
    createSaveSuccess() {
      this.getDetail()
    },

    /**
     * 详情操作
     */
    detailHandle(data) {
      if (data.type === 'delete') {
        this.getDetail()
        this.$nextTick(() => {
          this.$bus.emit('crm-tab-num-update')
        })
      }
    },
    /**
     * 格式化字段
     * @param {*} row
     * @param {*} column
     * @param {*} cellValue
     */
    fieldFormatter(row, column, cellValue, field) {
      // 如果需要格式化
      if (column.property === 'isTransform') {
        return ['否', '是'][row[column.property]] || '--'
      }

      if (field) {
        return getFormFieldShowName(field.formType, row[column.property], '--', field)
      }
      return row[column.property] === '' || row[column.property] === null ? '--' : row[column.property]
    }
  }
}
</script>
<style lang="scss" scoped>
@import "../styles/relativecrm.scss";

.down {
  margin-top: 8px;
}

.rc-header {
  >.title {
    font-size: 16px;
    font-weight: 600;
  }
}

.el-table {
  margin-top: 16px;
}

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
