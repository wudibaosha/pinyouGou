<template>
  <el-dialog
    ref="wkDialog"
    :visible="visible"
    :append-to-body="true"
    :close-on-click-modal="false"
    :title="title"
    width="405px"
    @close="handleCancel">
    <div class="handle-box">
      <el-form ref="form" :model="form" :rules="rules" label-width="105px">
        <el-form-item label="报账合同编号" prop="rentNumber">
          <el-input v-model="form.rentNumber" />
        </el-form-item>
        <el-form-item label="报账项目" prop="rentProject">
          <el-input v-model="form.rentProject" />
        </el-form-item>

      </el-form>
    </div>
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
import { crmInvoiceRentMsgAPI } from '@/api/crm/invoice'

import ElDialogLoadingMixin from '@/mixins/ElDialogLoading'

export default {
  name: 'RentMsg', // 填写报账信息
  components: {
  },
  mixins: [ElDialogLoadingMixin],
  props: {
    visible: {
      type: Boolean,
      required: true,
      default: false
    },
    detail: Object
  },
  data() {
    return {
      form: {
        rentNumber: '',
        rentProject: ''
      },
      rules: {
        rentNumber: [
          { required: true, message: '请填写项目编号', trigger: 'change' }
        ],
        rentProject: [
          { required: true, message: '请填写报账项目', trigger: 'change' }
        ]
      }
    }
  },
  computed: {
    title() {
      return '确认报账信息'
    }
  },
  watch: {},
  mounted() {},
  methods: {
    /**
     * 取消选择
     */
    handleCancel() {
      // 重置状态
      this.form = {
        rentNumber: '',
        rentProject: ''
      }
      this.$emit('update:visible', false)
    },

    /**
     * 点击确定
     */
    handleConfirm() {
      this.$refs.form.validate((valid) => {
        if (valid) {
          var params = {
            ...this.form
          }
          if (this.detail.invoiceSonId) {
            params.invoiceId = this.detail.invoiceSonId
          } else {
            params.invoiceId = this.detail.invoiceId
          }
          params.rentStatus = 1
          this.loading = true
          crmInvoiceRentMsgAPI(params)
            .then(res => {
              this.$message({
                type: 'success',
                message: '操作成功'
              })
              this.loading = false
              this.detail.rentStatus = 1
              this.handleCancel()
              this.$emit('change')
            })
            .catch(() => {
              this.loading = false
            })
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.handle-box {
  font-size: 12px;
  color: $--color-text-primary;
}

.handle-item {
  padding-bottom: 15px;

  .handle-item-name {
    flex-shrink: 0;
    width: 110px;
  }

  .handle-item-content {
    flex: 1;
  }
}

.handle-bar {
  position: relative;
  height: 30px;
  margin-top: 10px;

  button {
    float: right;
    margin-right: 10px;
  }
}
</style>
