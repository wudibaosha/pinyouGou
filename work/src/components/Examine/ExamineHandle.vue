<template>
  <el-dialog
   
    ref="wkDialog"
    :title="title"
    :append-to-body="true"
    :close-on-click-modal="false"
    :visible.sync="showDialog"
    width="600px"
    @close="hiddenView">

    <el-form
        ref="crmForm"
        :validate-on-rule-change="false"
        :model="fieldForm"
        class="wk-form"
        label-position="top">
        <wk-form-items
          v-for="(children, index) in fieldList"
          :key="index"
          :field-list="children"
          :field-from="fieldForm"
          @change="formChange"
        />
    </el-form>
        

    <el-input
    class="input"
      style="margin-top: 30px;"
      v-model="content"
      :rows="8"
      :maxlength="200"
      :placeholder="placeholder"
      type="textarea"
      resize="none"
      show-word-limit />
    <div
      slot="footer"
      class="dialog-footer">
      <el-button
        type="primary"
        @click="handleClick('confirm')">确定</el-button>
      <el-button @click="handleClick('cancel')">取消</el-button>
    </div>
  </el-dialog>
</template>
<script type="text/javascript">
import { crmExamineRecordAuditAPI } from '@/api/examine'
import WkFormItems from '@/components/NewCom/WkForm/WkFormItems'
import ElDialogLoadingMixin from '@/mixins/ElDialogLoading'
import { crmContractUpdatePriceRangeAPI } from '@/api/crm/contract'
export default {
  name: 'ExamineHandle', // 合同审核操作
  components: {
    WkFormItems
  },
  mixins: [ElDialogLoadingMixin],
  props: {
    show: {
      type: Boolean,
      default: false
    },
    fieldList: {
      type: Array,
      default: ()=>[]
    },
    fieldForm: {
      type: Object,
      default: () => ({})
    },
    // 审核 1 审核通过 2 审核拒绝 4 已撤回
    status: {
      type: [String, Number],
      default: 1
    },
    // 详情信息id
    id: [String, Number],
    recordId: [String, Number],
    // crm_contract crm_receivables oa_examine
    examineType: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      loading: false,
      showDialog: false,
      content: '' // 输入内容
    }
  },
  computed: {
    title() {
      if (this.status == 1) {
        return '审批通过'
      } else if (this.status == 2) {
        return '审批拒绝'
      } else if (this.status == 4) {
        return '撤回审批'
      }
      return ''
    },
    placeholder() {
      // 1 审核通过 2 审核拒绝 4 已撤回
      if (this.status == 1) {
        return '请输入审批意见（选填）'
      } else if (this.status == 2) {
        return '请输入审批意见（必填）'
      } else if (this.status == 4) {
        return '请输入撤回理由（必填）'
      }
      return ''
    }
  },
  watch: {
    show: {
      handler(val) {
        this.showDialog = val
      },
      deep: true,
      immediate: true
    }
  },
  mounted() {

  },
  methods: {
    formChange(){

    },
    /**
     * 提交数据
     */
    // submitInfo(status) {
    // if ((this.status == 2 || this.status == 4) && !this.content) {
    submitInfo(status = this.status) {

      if ((this.status == 2) && !this.content) {
        this.$message.error(this.placeholder)
      } else {
       
        if (this.$listeners.confirm) {
          
          this.$emit('confirm', this.content,this.fieldForm.fieldFhdimr)
        } else {
          this.loading = true
      
          console.log(this.fieldList.length)
          if(this.examineType == 'crm_contract' && this.fieldList.length > 0) {
            crmContractUpdatePriceRangeAPI({
              contractId: this.id,
              priceRange: this.fieldForm.fieldFhdimr,
            })
            .then(res => {
            })

          }
          crmExamineRecordAuditAPI({
            typeId: this.id,
            recordId: this.recordId,
            status: status,
            remarks: this.content
          })
            .then(res => {
              this.loading = false
              this.$message.success('操作成功')
              // 刷新待办
              if (
              this.examineType == 'crm_contract' ||
              this.examineType == 'crm_invoice' ||
              this.examineType == 'crm_receivables'
              ) {
                this.$store.dispatch('GetMessageNum')
              }

              this.resetInfo()

              this.$emit('save', { type: this.status })
              this.hiddenView()
            })
            .catch(() => {
              this.loading = false
            })
        }
      }
    },

    /**
     * 操作点击
     */
    handleClick(type) {
      if (type == 'cancel') {
        this.hiddenView()
        this.resetInfo()
      } else if (type == 'confirm') {

         this.submitInfo()
      }
    },

    /**
     * 关闭
     */
    hiddenView() {
      this.$emit('close')
    },

    /**
     * 重置信息
     */
    resetInfo() {
      this.content = ''
    }
  }
}
</script>
<style lang="scss" scoped>
.el-dialog__wrapper /deep/ .el-dialog__body {
  padding: 10px 25px 20px;
}

/deep/ .wk-form-item {
  padding: 0 0 0;
  margin-bottom: 0;
}
.title {
  padding-bottom: 8px;
  font-size: 12px;
  color: $--color-text-regular;
}
</style>
