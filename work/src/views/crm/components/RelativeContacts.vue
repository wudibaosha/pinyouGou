<template>
  <div
    v-loading="loading"
    v-empty="nopermission"
    class="rc-cont"
    xs-empty-icon="nopermission"
    xs-empty-text="暂无权限">
    <div
      v-if="!isSeas"
      class="rc-head">
      <wk-toggle-button
        v-if="crmType=='customer'"
        v-model="showType">
        <wk-toggle-item
          v-for="item in [{name:'列表视图', value: 'table', icon: 'wk wk-icon-three-line'}, {name:'架构视图', value: 'tree', icon: 'wk wk-icon-org-solid'}]"
          :key="item.value"
          :label="item.name"
          :value="item.value">
          {{ item.name }}<i :class="item.icon" />
        </wk-toggle-item>
      </wk-toggle-button>

      <div class="handle">
        <el-button
          v-if="contactsSave"
          icon="el-icon-plus"
          @click="createClick">新建联系人</el-button>
        <el-button
          v-if="crmType === 'business'"
          @click="showRelativeView = true">关联</el-button>
        <el-button
          v-if="canRelation"
          type="danger"
          @click.native="unRelevanceHandleClick">解除关联</el-button>
        <crm-relative
          v-if="showRelativeView"
          ref="crmrelative"
          :visible.sync="showRelativeView"
          :radio="false"
          :action="{ type: 'condition', data: { moduleType: 'customer', customerId: customerId } }"
          :selected-data="{ 'contacts': list }"
          crm-type="contacts"
          @close="showRelativeView = false"
          @changeCheckout="checkRelativeInfos" />
      </div>
    </div>
    <el-table
      v-if="fieldList.length > 0 && showType == 'table'"
      :data="list"
      :height="tableHeight"
      :cell-class-name="cellClassName"
      stripe
      @row-click="handleRowClick"
      @selection-change="selectionList = $event">
      <el-table-column
        v-if="canRelation"
        show-overflow-tooltip
        type="selection"
        align="center"
        width="55" />
      <el-table-column
        v-for="(item, index) in fieldList"
        :key="index"
        :prop="item.prop"
        :label="item.label"
        show-overflow-tooltip />
      <el-table-column
        label="操作"
        width="120">
        <template slot-scope="scope">
          <flexbox justify="center">
            <span
              v-if="contactsId == scope.row.contactsId"
              class="chief">
              <i class="wk wk-success" />首要联系人</span>
            <el-button
              v-else-if="!isSeas"
              class="set-chief-btn"
              type="primary-text"
              @click.native="setChieflyContacts(scope)">设为首要联系人</el-button>
          </flexbox>
        </template>
      </el-table-column>
    </el-table>

    <flexbox
      v-if="showType == 'tree'"
      :style="{height: `${tableHeight}px`}"
      wrap="wrap"
      align="flex-start"
      class="wk-org-tree">
      <vue2-org-tree
        v-for="(item,index) in treeList"
        :key="index"
        :data="item"
        :label-class-name="orgTreeClass"
        :props="{label: 'name', children: 'children', expand: 'expand'}"
        :render-content="renderContent"
        @on-node-click="orgTreeClick"
      />
    </flexbox>
    <c-r-m-full-screen-detail
      :id="detailId"
      :visible.sync="showFullDetail"
      crm-type="contacts"
      @handle="detailHandle" />
    <c-r-m-all-create
      v-if="isCreate"
      :action="createActionInfo"
      crm-type="contacts"
      @save-success="createSaveSuccess"
      @close="isCreate=false" />
  </div>
</template>

<script type="text/javascript">
import CRMAllCreate from './CRMAllCreate'
import {
  crmCustomerQueryContactsAPI,
  crmCustomerSetContactsAPI,
  crmCustomerQueryContactsByIdAPI
} from '@/api/crm/customer'
import {
  crmBusinessQueryContactsAPI,
  crmBusinessRelateContactsAPI,
  crmBusinessUnrelateContactsAPI,
  crmBusinessSetContactsAPI
} from '@/api/crm/business'
import CrmRelative from '@/components/CreateCom/CrmRelative'

import { WkToggleButton, WkToggleItem } from '@/components/NewCom/WkToggleButton/index'

import { getPermissionByKey } from '@/utils'

export default {
  name: 'RelativeContacts', // 相关联系人列表  可能再很多地方展示 放到客户管理目录下
  components: {
    CRMFullScreenDetail: () => import('@/components/CRMFullScreenDetail'),
    CRMAllCreate,
    CrmRelative,
    WkToggleButton,
    WkToggleItem
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
      showType: 'table', // tree
      list: [],
      fieldList: [],
      treeList: [], // 直属上级架构数据
      tableHeight: '400px',
      showFullDetail: false,
      // 控制新建
      isCreate: false,
      // 查看全屏联系人详情的 ID
      detailId: '',
      // 创建的相关信息
      createActionInfo: { type: 'relative', crmType: this.crmType, data: {}},
      // 关联的逻辑
      showRelativeView: false,
      selectionList: []
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
      return this.crmType == 'business'
    },
    contactsSave() {
      return !!getPermissionByKey('crm.contacts.save')
    },
    orgTreeData() {
      if (this.treeList.length > 0) {
        return this.treeList
      }
      return {}
    }
  },
  watch: {
    id(val) {
      this.list = []
      this.getDetail()
    },

    'rootTabs.currentName'(val) {
      if (val === 'RelativeContacts') {
        this.getDetail(false)
      }
    }
  },
  mounted() {
    this.getDetail()
  },
  methods: {
    /**
     * 关联的数据
     */
    checkRelativeInfos(data) {
      if (data.data.length > 0) {
        const params = { businessId: this.id }
        params.contactsIds = data.data
          .map(item => {
            return item.contactsId
          })
        crmBusinessRelateContactsAPI(params)
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
    unRelevanceHandleClick() {
      if (this.selectionList.length == 0) {
        this.$message.error('请先勾选数据')
      } else {
        this.$confirm('确认取消关联?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            const params = { businessId: this.id }
            params.contactsIds = this.selectionList
              .map(item => {
                return item.contactsId
              })
            crmBusinessUnrelateContactsAPI(params)
              .then(res => {
                this.getDetail()
                this.$message.success('操作成功')
              })
              .catch(() => {})
          })
          .catch(() => {})
      }
    },

    /**
     * 表头数据
     */
    getFieldList() {
      this.fieldList.push({
        prop: 'name',
        width: '200',
        label: '姓名'
      })
      this.fieldList.push({ prop: 'mobile', width: '200', label: '手机' })
      this.fieldList.push({ prop: 'post', width: '200', label: '职务' })
      this.fieldList.push({ prop: 'parentContactsName', width: '200', label: '直属上级' })
    },

    /**
     * 获取数据
     */
    getDetail(loading = true) {
      this.loading = loading
      const request = {
        customer: crmCustomerQueryContactsAPI,
        business: crmBusinessQueryContactsAPI
      }[this.crmType]
      const params = { pageType: 0 }
      params[this.crmType + 'Id'] = this.id
      request(params)
        .then(res => {
          if (this.fieldList.length == 0) {
            this.getFieldList()
          }
          if (this.crmType == 'customer') {
            this.getTreeList()
          }
          this.nopermission = false
          this.loading = false
          this.list = res.data.list
        })
        .catch(data => {
          if (data.code == 102) {
            this.nopermission = true
          }
          this.loading = false
        })
    },
    /**
 * 查询联系人视图结构
 */
    getTreeList() {
      this.loading = true
      crmCustomerQueryContactsByIdAPI({ customerId: this.detail.customerId })
        .then(res => {
          this.treeList = res.data
          this.loading = false
        })
        .catch(() => {
          this.loading = false
        })
    },
    /**
     * 当某一行被点击时会触发该事件
     */
    handleRowClick(row, column, event) {
      if (column.property == 'name') {
        this.detailId = row.contactsId
        this.showFullDetail = true
      }
    },
    /**
     * 架构视图点击
     */
    orgTreeClick(e, data) {
      this.detailId = data.contactsId
      this.showFullDetail = true
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
     * 新建
     */
    createClick() {
      //  客户 下新建联系人
      if (this.crmType == 'customer') {
        this.createActionInfo.data['customer'] = this.detail
      } else if (this.crmType == 'business') {
        this.createActionInfo.data['customer'] = this.detail
        this.createActionInfo.relativeData = {
          businessId: this.detail.businessId
        }
      }
      this.isCreate = true
    },
    createSaveSuccess() {
      if (this.canRelation) {
        this.$refs.crmrelative && this.$refs.crmrelative.refreshList()
      }

      this.$bus.emit('crm-tab-num-update')
      this.getDetail()
    },

    /**
     * 设置首要联系人
     */
    setChieflyContacts(data) {
      const request = {
        customer: crmCustomerSetContactsAPI,
        business: crmBusinessSetContactsAPI
      }[this.crmType]

      const params = { contactsId: data.row.contactsId }
      params[this.crmType + 'Id'] = this.id
      this.loading = true
      request(params)
        .then(res => {
          this.$message.success('操作成功')
          this.$emit('update:contactsId', data.row.contactsId)
          this.loading = false
        })
        .catch(data => {
          this.loading = false
        })
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
    /** ****组织图 */
    renderContent(h, data) {
      return `${data.name}`
    },
    orgTreeClass(data) {
      return 'org-tree-default'
    }
  }
}
</script>
<style lang="scss" scoped>
@import "../styles/relativecrm.scss";

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

.rc-head {
  position: relative;
  min-height: 32px;

  .wk-toggle-button {
    position: absolute;
    top: 0;
    left: 0;
  }

  .handle {
    position: absolute;
    top: 0;
    right: 0;
  }
}

.wk-toggle-item {
  display: flex;

  i {
    margin-left: 2px;
  }
}
</style>
