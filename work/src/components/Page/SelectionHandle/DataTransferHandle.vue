<template>
    <el-dialog
      ref="wkDialog"
      :visible.sync="visible"
      :append-to-body="true"
      :close-on-click-modal="false"
      width="500px"
      @close="handleCancel">
      <span slot="title" class="el-dialog__title">客户相关数据转移<i v-if="config.help" class="wk wk-icon-fill-help wk-help-tips" :data-type="config.help.type" :data-id="config.help.id" /></span>
      <el-form
        ref="fieldForm"
        :model="form"
        :validate-on-rule-change="false"
        label-position="top">
        <!-- <el-form-item
          class="wk-form-item"
          label="变更负责人为"
          prop="ownerUserId"
          :rules="[
            { required: true, message: '请选择团队成员', trigger: 'change' }
          ]">
          <wk-user-dialog-select
            v-model="form.ownerUserId"
            style="width: 100%;"
            radio />
        </el-form-item> -->
  
        <el-form-item
          v-if="config.showRemoveType"
          class="wk-form-item"
          label="将数据转移到以下客户"
          prop="removeType">
          <el-radio-group v-model="form.targetCustomerId">
            
            <el-radio
               
                v-for="item in customerArray" 
                :label="item.customerId">{{ item.customerName }}
                
            </el-radio>
         
          </el-radio-group>
        </el-form-item>
  
        <!-- <el-form-item
          v-if="config.showRemoveType && form.removeType === 2"
          class="wk-form-item"
          label="权限"
          prop="handleType">
          <el-radio-group v-model="form.handleType">
            <el-radio :label="1">只读</el-radio>
            <el-radio :label="2">读写</el-radio>
          </el-radio-group>
        </el-form-item> -->
  
        <!-- 仅客户下可进行同时变成负责人 crmType === 'customer'-->
        <el-form-item
          
          class="wk-form-item"
          prop="addsTypes">
          <template slot="label">数据包括</template>
          <el-checkbox-group v-model="form.crmData">
            <el-checkbox label="1">商机</el-checkbox>
            <el-checkbox label="2">合同</el-checkbox>
            <el-checkbox label="3">发票</el-checkbox>
            <el-checkbox label="4">回款</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
  
        
      </el-form>
      <span
        slot="footer"
        class="dialog-footer">
        <el-button
          v-debounce="handleConfirm"
          type="primary">保存</el-button>
        <el-button @click.native="handleCancel">取消</el-button>
      </span>
    </el-dialog>
  </template>
  
  <script>
  import WkUserDialogSelect from '@/components/NewCom/WkUserDialogSelect'
  
  import ElDialogLoadingMixin from '@/mixins/ElDialogLoading'
  import merge from '@/utils/merge'
  import {
    transferCustomerRelativeDataAPI
} from '@/api/crm/customer'
  import TableMixin from '@/views/crm/mixins/Table'
  
  const DefaultTransferHandle = {
    // 场景编辑请求
    request: null,
    params: null,
    showChangeOwner: false, // 同时变更负责人
    showRemoveType: false, // 是否展示移除操作类型
    // 帮助提示
    help: null
  }
  
  export default {
    /** 客户管理 的 勾选后的 转移 操作*/
    name: 'TransferHandle',
    components: {
      WkUserDialogSelect
    },
    mixins: [ElDialogLoadingMixin],
    props: {
      dialogVisible: {
        type: Boolean,
        required: true,
        default: false
      },

      // /** 没有值就是全部类型 有值就是当个类型 */
      // crmType: {
      //   type: String,
      //   default: ''
      // },
      props: Object,
      // /** 转移数据 */
      customerArray: {
        type: Array,
        default: () => {
          return []
        }
      },
      customerId: {
        type: String,
        default: ''
      }
    },
    mixins: [TableMixin],
    data() {
      return {
        
    
        loading: false, // 加载动画
        visible: false,
  
        form: {
          crmData: [],
          targetCustomerId: undefined,
          sourceCustomerId: undefined
        }
      }
    },
    computed: {
      // 合并 props
      config() {
        return merge({ ...DefaultTransferHandle }, this.props || {})
      }
  
      // // 是否展示移除操作类型
      // showRemoveType() {
      //   if (this.crmType == 'leads' ||
      //      this.crmType == 'product' ||
      //      this.crmType == 'invoice') {
      //     return false
      //   }
      //   return true
      // }
  
      // // 帮助信息
      // helpObj() {
      //   return {
      //     leads: {
      //       type: '7',
      //       id: '80'
      //     }, customer: {
      //       type: '8',
      //       id: '81'
      //     }, contacts: {
      //       type: '9',
      //       id: '82'
      //     }, business: {
      //       type: '10',
      //       id: '83'
      //     }, contract: {
      //       type: '11',
      //       id: '84'
      //     }, receivables: {
      //       type: '12',
      //       id: '85'
      //     }, invoice: {
      //       type: '13',
      //       id: '86'
      //     }, product: {
      //       type: '15',
      //       id: '87'
      //     }
      //   }[this.crmType] || null
      // }
    },
    watch: {
      dialogVisible: {
        handler(val) {
          this.visible = val
          if (!val) {
            this.resetData()
          }
        },
        deep: true,
        immediate: true
      }
    },
    mounted() {
      this.visible = this.dialogVisible
    },
    methods: {
      /**
       * 重置信息
       */
      resetData() {
        this.form = {
          ownerUserId: '', // 变更负责人
          removeType: 1, // 移动类型
          handleType: 1, // 操作类型
          addsTypes: [], // 添加至
          validType: '', // 有效类型
          expiresTime: '' // 有效时间
        }
      },
  
      /**
       * 取消选择
       */
      handleCancel() {
        this.visible = false
        this.$emit('update:dialogVisible', false)
      },
  
      handleConfirm() {
        this.$refs.fieldForm.validate((valid) => {
          if (valid) {
            if (!this.form.targetCustomerId) {
              this.$message.error('请选择客户联系人')
            } else if (!this.form.crmData) {
              this.$message.error('请选择相关数据')
            } else {
              this.loading = true
              console.log(this.getParams())

              transferCustomerRelativeDataAPI(this.getParams())
                .then(res => {
                  this.$message({
                    type: 'success',
                    message: '操作成功'
                  })
                  this.loading = false
                  this.handleCancel()
  
  
                  this.$emit('handle', { type: 'transfer' })
                })
                .catch(() => {
                  this.loading = false
                })
            }
          } else {
            return false
          }
        })
      },
      // getRequest() {
      //   if (this.crmType === 'leads') {
      //     return crmLeadsTransferAPI
      //   } else if (this.crmType === 'customer') {
      //     return crmCustomerTransferAPI
      //   } else if (this.crmType === 'contacts') {
      //     return crmContactsTransferAPI
      //   } else if (this.crmType === 'business') {
      //     return crmBusinessTransferAPI
      //   } else if (this.crmType === 'contract') {
      //     return crmContractTransferAPI
      //   } else if (this.crmType === 'receivables') {
      //     return crmReceivablesTransferAPI
      //   } else if (this.crmType === 'product') {
      //     return crmProductTransferAPI
      //   } else if (this.crmType === 'invoice') {
      //     return crmInvoiceTransferAPI
      //   }
      // },
      getParams() {
        var params = {
          targetCustomerId: this.form.targetCustomerId,
          sourceCustomerId: this.customerId,
          crmData: this.form.crmData
        }
  
       return params
      },

      
  
    }
  }
  </script>
  
  <style lang="scss" scoped>
  @import "@/styles/wk-form.scss";
  </style>
  