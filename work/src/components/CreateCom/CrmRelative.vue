<template>
  <el-dialog
    :visible="visible"
    :close-on-click-modal="false"
    :title="getTitle()"
    :width="contentWidth"
    class="crm-ralative"
    append-to-body
    @close="closeView">
    <div ref="crContainer" class="cr-container-wrap">
      <div class="cr-container">
        <div
          v-if="crmType == '' && !commonConfig.isCommon"
          class="cr-body-side">
          <div
            v-for="(item, index) in leftSides"
            :key="index"
            :class="leftType===item.type? 'side-item-select' : 'side-item-default'"
            class="side-item"
            @click="sideClick(item)">{{ item.name }}
            <span v-if="item.num > 0" class="side-item__num">{{ `(${item.num})` }}</span>
          </div>
          <div v-if="leftType=='dept'">
            <el-tree
              :data="deptTreeList"
              @node-click="handleDeptClick" />
          </div>
        </div>
        <div v-if="commonConfig.isCommon">
          <template v-for="(item, index) in leftSides">
            <crm-relative-table
              v-if="item.loaded"
              v-show="item.type == leftType"
              ref="moduleTable"
              :key="index"
              :props="commonConfig"
              :selected-data="currentSelectedData[item.type]"
              @selection-change="selectionChange($event, item)"
            />
          </template>
        </div>
        <div v-else :style="{ 'padding-left': crmType == '' ? '150px' : '0'}">
          <template v-for="(item, index) in leftSides"> 
            <component
              :is="getComponentsName(item.type)"
              v-if="item.loaded"
              v-show="item.type == leftType"
              ref="moduleTable"
              :key="index"
              class="crm-table-index"
              :props="componentConfig"
              :is-relative="isRelative"
              :current-crm-type="currentCrmType"
              :is-related-contract="isRelatedContract"
              :selected-data="currentSelectedData[item.type]"
              :is-or-contract="isOrContract"
              @selection-change="selectionChange($event, item)" />
          </template>
        </div>
      </div>
      <div
        :class="['dialog-footer', { 'is-common': commonConfig.isCommon }]"
      >
        <el-button
          type="primary"
          @click="confirmClick(false)">确定</el-button>
        <el-button @click="closeView">取消</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script type="text/javascript">
import {
  depListAPI,
  userListAPI
} from '@/api/common'

import { objDeepCopy } from '@/utils'
import merge from '@/utils/merge'

// 通用配置 含 CrmRelativeTable 声明的信息
const DefaultCommon = {
  isCommon: false,
  type: '',
  name: ''
}

export default {
  name: 'CrmRelatieve', // 相关
  components: {
    CustomerIndex: () => import('@/views/crm/customer'),
    ContactsIndex: () => import('@/views/crm/contacts'),
    BusinessIndex: () => import('@/views/crm/business'),
    ContractIndex: () => import('@/views/crm/contract'),
    LeadsIndex: () => import('@/views/crm/leads'),
    ProductIndex: () => import('@/views/crm/product'),
    ReceivablesIndex: () => import('@/views/crm/receivables'),
    CrmRelativeTable: () => import('./CrmRelativeTable'),
    InvoiceIndex: () => import('@/views/crm/invoice'),
    //  CrmRelativeTable: () => import('@/views/crm/invoice'),
    UnitIndex: () => import('@/views/crm/unit'),
  },
  props: {
    visible: Boolean,
    // 多选框 只能选一个
    radio: {
      type: Boolean,
      default: true
    },
    acceptEmail: {
      type: String,
      default: ''
    },
    // 没有值就是全部类型 有值就是当个类型
    crmType: {
      type: String,
      default: ''
    },
    // 需要展示哪些类型 默认关键字数组
    showTypes: {
      type: Array,
      default: () => {
        return [
          'customer',
          'contacts',
          'leads',
          'business',
          'contract',
          'product',
          'receivables',
          'unit'
        ]
      }
    },
    // 已选信息
    selectedData: {
      type: Object,
      default: () => {
        return {}
      }
    },
    // 自定义配置
    props: Object,
    // default 默认  condition 固定条件筛选 moduleType 下的
    // relative: 相关 添加
    action: {
      type: Object,
      default: () => {
        return {
          type: 'default',
          data: {}
        }
      }
    },
    isRelatedContract: {
      type: Boolean,
      default: false
    },
    currentCrmType: {
      type: String,
      default: ''
    },
    isOrContract: [String, Number],
    // 控制筛选关联合同时展示内容, 1为回款关联合同, 2为发票关联合同
    isRelative: [Number, Boolean]
  },
  // 处理el-input 右侧展示删除按钮
  provide() {
    return {
      'elForm': '',
      'elFormItem': ''
    }
  },

  data() {
    return {
      leftType: '',
      leftSides: [],
      /** 各类型选择的值 */
      currentSelectedData: {},
      /** 部门数据 */
      deptTreeList: [],
      deptId: '' // 选择的部门id
    }
  },
  computed: {
    /**
     * 通用配置
     */
    commonConfig() {
      console.log(this.action)
      return merge({ ...DefaultCommon }, this.action || {})
    },

    /**
     * 模块配置
     */
    componentConfig() {
      const params = {}
      if (this.action && this.action.type === 'condition') {
        params[this.action.data.moduleType + 'Id'] = this.action.data[
          this.action.data.moduleType + 'Id'
        ]
        if (this.action.data.params) {
          for (const field in this.action.data.params) {
            params[field] = this.action.data.params[field]
          }
        }
      }
      
      const config = {
        isSelect: true,
        showModuleName: false,
        selectionHandle: false,
        radio: this.radio,
        params,
        otherHeight: 325, // 去掉dialog 等处的定高区域
        ...(this.props || {})
      }
      if (this.leftType == 'dept') {
        config.fieldList = [
          { name: '姓名', fieldName: 'realname' },
          { name: '邮箱', fieldName: 'email' },
          { name: '手机号', fieldName: 'username' },
          { name: '性别', fieldName: 'sex' },
          { name: '部门', fieldName: 'deptName' },
          { name: '岗位', fieldName: 'post' }
        ]
        config.request = userListAPI
        config.params = {
          deptId: this.deptId,
          isNeedChild: 1,
          limit: 15,
          page: 1,
          realname: ''
        }
      }
      return config
    },

    /**
     * 内容宽度
     */
    contentWidth() {
      return this.crmType == '' && !this.commonConfig.isCommon ? '1050px' : '910px'
    }
  },
  watch: {
    visible(val) {
      if (val) {
        this.$nextTick(() => {
          const mainTable = this.getCurrentMainTable()
          if (mainTable.updateTableHeight) {
            mainTable.updateTableHeight()
          }
        })
      }
    },
    selectedData: function(data) {
      this.handleCurrentSelectData(data)
    }
  },
  mounted() {
    // 获取传值
    this.handleCurrentSelectData(this.selectedData)
    if (this.showTypes.includes('dept')) {
      this.getDeptList()
    }
  },
  methods: {
    /**
     * 目前选择值
     */
    handleCurrentSelectData(data) {
      if (this.commonConfig.isCommon) {
        const tempData = {}
        tempData[this.commonConfig.type] = []
     
        this.currentSelectedData = tempData
      } else {
        if (data && Object.keys(data).length) {
          this.currentSelectedData = objDeepCopy(data)
        } else {
          const tempData = {}
          if (this.crmType) {
            tempData[this.crmType] = []
            this.currentSelectedData = tempData
          } else {
            for (let index = 0; index < this.showTypes.length; index++) {
              const key = this.showTypes[index]
              tempData[key] = []
            }
            this.currentSelectedData = tempData
          }
        }
      }

      // 初始化
      if (this.commonConfig.isCommon) {
        this.leftSides.push({
          name: this.commonConfig.name,
          isCommon: true, // 是统一效果
          loaded: true,
          num: 0,
          type: this.commonConfig.type
        })
        this.leftType = this.commonConfig.type
      } else {
        console.log(this.getLeftItems())
        if (this.leftSides.length === 0) {
          const leftItems = this.getLeftItems()
          if (this.crmType) {
            const leftItem = leftItems[this.crmType]
            leftItem.loaded = true
            this.leftSides.push(leftItem)
            this.leftType = this.crmType
          } else {
            for (let index = 0; index < this.showTypes.length; index++) {
              const leftItem = leftItems[this.showTypes[index]]
              const leftData = this.currentSelectedData[leftItem.type]
              leftItem.num = leftData ? leftData.length : 0
              this.leftSides.push(leftItem)
            }

            if (this.leftSides.length > 0) {
              const leftItem = this.leftSides[0]
              leftItem.loaded = true
              this.leftType = leftItem.type
            }
          }
        } else {
          // 更新多tabs 下数据
          if (!this.crmType) {
            for (let index = 0; index < this.leftSides.length; index++) {
              const leftItem = this.leftSides[index]
              const leftData = this.currentSelectedData[leftItem.type]
              leftItem.num = leftData ? leftData.length : 0
            }
          }
        }
      }
    },

    /**
     * 刷新列表
     */
    refreshList() {
      this.$refs['crm' + this.crmType][0].refreshList()
    },

    /**
     * 侧边点击
     */
    sideClick(item) {
      this.leftType = item.type
      item.loaded = true
    },

    /**
     * 关闭操作
     */
    closeView() {
      this.$emit('close')
      this.$emit('update:visible', false)
    },

    /**
     * 勾选change
     */
    selectionChange(data, item) {
      // console.log(this.$refs)
      // this.$refs.multipleTable.clearSelection()
      item.num = data.length
      this.currentSelectedData[this.leftType] = data
    },

    /**
     * 确定选择
     */
    confirmClick() {
      
      // 如果是单类型 在这里数据赋值
      
      if (this.crmType) {
        this.currentSelectedData[this.leftType] = this.getCurrentMainTable().selectionList
        if (this.acceptEmail == 'receive') {
        
          this.$emit('changeCheckout', { data: this.currentSelectedData[this.crmType], type: 'receive' })
        } else if (this.acceptEmail == 'sent') {
        
          this.$emit('changeCheckout', { data: this.currentSelectedData[this.crmType], type: 'sent' })
        } else {
        
          // 以单类型传值
          let currentSelectedData = this.currentSelectedData[this.crmType]
          // this.$emit('changeCheckout', {
          //   data: this.currentSelectedData[this.crmType]
          //     ? this.currentSelectedData[this.crmType]
          //     : []
          // })

          this.$emit('changeCheckout', {
            data: currentSelectedData
              ? currentSelectedData
              : []
          })
    
        }
      } else {
        this.$emit('changeCheckout', { data: this.currentSelectedData })
      }
      this.$nextTick(() => {
        this.closeView()
      })
    },

    /**
     * 获取当前主列表对象
     */
    getCurrentMainTable() {
      const list = this.$refs.moduleTable
      const opstionsName = this.getComponentsName(this.leftType)
      return list.find(item => item.$options && item.$options.name === opstionsName)
    },

    /**
     * 根据类型获取标题展示名称
     */
    getTitle() {
      if (this.commonConfig.isCommon) {
        return this.commonConfig.name
      }
      if (this.crmType == 'leads') {
        return '关联线索模块'
      } else if (this.crmType == 'customer') {
        return '关联客户模块'
      } else if (this.crmType == 'contacts') {
        return '关联联系人模块'
      } else if (this.crmType == 'business') {
        return '关联商机模块'
      } else if (this.crmType == 'product') {
        return '关联产品模块'
      } else if (this.crmType == 'contract') {
        return '关联合同模块'
      } else if (this.crmType == 'invoice') {
        return '关联发票模块'
      } else if (this.crmType == 'unit') {
        return '关联发票抬头'
      }  else {
        return '关联相关信息'
      }
    },

    /**
     * 获取组件名称
     */
    getComponentsName(type) {
      if (type === 'customer') {
        return 'CustomerIndex'
      } else if (type === 'contacts') {
        return 'ContactsIndex'
      } else if (type === 'leads') {
        return 'LeadsIndex'
      } else if (type === 'business') {
        return 'BusinessIndex'
      } else if (type === 'contract') {
        return 'ContractIndex'
      } else if (type === 'product') {
        return 'ProductIndex'
      } else if (type === 'receivables') {
        return 'ReceivablesIndex'
      } else if (type === 'invoice') {
        return 'InvoiceIndex'
      } else if (type === 'unit') {
        return 'UnitIndex'
      } else {
       
        return 'CrmRelativeTable'
      }
    },

    /**
     * 设置勾选值
     */
    setSelections(data) {
      this.getCurrentMainTable().setSelections(data)
    },

    /**
     * 切换某一行的选中状态
     */
    toggleRowSelection(rowKey, rowId, selected) {
      this.getCurrentMainTable().toggleRowSelection(rowKey, rowId, selected)
    },

    /**
     * 获取左侧菜单信息
     */
    getLeftItems() {
      return {
        customer: {
          name: '客户',
          loaded: false,
          num: 0,
          type: 'customer'
        },
        contacts: {
          name: '联系人',
          loaded: false,
          num: 0,
          type: 'contacts'
        },
        leads: {
          name: '线索',
          loaded: false,
          num: 0,
          type: 'leads'
        },
        business: {
          name: '商机',
          loaded: false,
          num: 0,
          type: 'business'
        },
        contract: {
          name: '合同',
          loaded: false,
          num: 0,
          type: 'contract'
        },
        product: {
          name: '产品',
          loaded: false,
          num: 0,
          type: 'product'
        },
        dept: {
          name: '同事',
          loaded: false,
          num: 0,
          type: 'dept'
        },
        receivables: {
          name: '回款',
          loaded: false,
          num: 0,
          type: 'receivables'
        },
        invoice: {
          name: '发票',
          loaded: false,
          num: 0,
          type: 'invoice'
        },
        unit: {
          name: '发票抬头',
          loaded: false,
          num: 0,
          type: 'unit'
        }
      }
    },
    /**
     * 获取部门数据
     */
    getDeptList() {
      depListAPI({
        type: 'tree'
      })
        .then(res => {
          this.deptTreeList = res.data
        })
        .catch(() => {
        })
    },
    /**
     * 部门点击
     */
    handleDeptClick(data) {
      this.deptId = data.id
    }
  }
}
</script>
<style rel="stylesheet/scss" lang="scss" scoped>
.cr-container {
  position: relative;
  height: 100%;
}

.cr-container-wrap {
  position: relative;
  height: 100%;
}

.dialog-footer {
  margin-top: 0;
  margin-right: 40px;
  text-align: right;
}

.cr-body-side {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 3;
  flex-shrink: 0;
  width: 150px;
  height: 100%;
  font-size: 12px;
  background-color: white;
  border-right: 1px solid $--border-color-base;

  .side-item {
    position: relative;
    height: 40px;
    padding: 0 20px;
    font-size: 14px;
    line-height: 40px;
    cursor: pointer;

    &__num {
      position: absolute;
      top: 0;
      right: 5px;
      font-size: 12px;
      color: $--color-text-regular;
    }
  }

  .side-item::before {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 2px;
    content: " ";
  }
}

.side-item-default {
  color: $--color-text-primary;
}

.side-item-select {
  background-color: $--background-color-base;
}

.side-item-select::before {
  background-color: $--color-primary;
}

.el-dialog__wrapper {
  /deep/ .el-dialog {
    height: calc(100% - 80px);
    margin-top: 40px !important;
  }

  /deep/ .el-dialog__body {
    height: calc(100% - 100px);
    padding: 0;
  }
}

/deep/ .el-tree-node__content {
  height: 40px;
}

// 客户 线索等列表头上的padding 去除
/deep/ .crm-table-index {
  .wk-page-header {
    padding-top: 0;
  }
}
</style>
