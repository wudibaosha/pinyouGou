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
        <el-form-item label="发票号码" prop="invoiceNumber">
          <el-input v-model="form.invoiceNumber" />
        </el-form-item>
        <el-form-item label="实际开票日期" prop="realInvoiceDate">
          <el-date-picker
            v-model="form.realInvoiceDate"
            style="width: 100%;"
            value-format="yyyy-MM-dd"
            type="date"
            placeholder="选择日期" />
        </el-form-item>
        <el-form-item label="物流单号">
          <el-input v-model="form.logisticsNumber" />
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
import { crmInvoiceStatusResetAPI, crmInvoiceStatusUpdateOpenAPI} from '@/api/crm/invoice'

import ElDialogLoadingMixin from '@/mixins/ElDialogLoading'

export default {
  name: 'MarkInvoice', // 标记为开票
  components: {
  },
  mixins: [ElDialogLoadingMixin],
  props: {
    visible: {
      type: Boolean,
      required: true,
      default: false
    },
    detail: Object,
    reset: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      form: {
        invoiceNumber: '',
        logisticsNumber: '',
        realInvoiceDate: ''
      },
      rules: {
        realInvoiceDate: [
          { required: true, message: '请选择实际开票日期', trigger: 'change' }
        ],
        invoiceNumber: [
          { required: true, message: '请填写发票号码', trigger: 'change' }
        ]
      }
    }
  },
  computed: {
    title() {
      return this.reset ? '重置开票信息' : '标记为开票'
    }
  },
  watch: {
    visible: {
      handler(val) {
        if (val && this.reset) {
          this.form = {
            invoiceNumber: this.detail.invoiceNumber,
            logisticsNumber: this.detail.logisticsNumber,
            realInvoiceDate: this.detail.realInvoiceDate
          }
        }
      },
      immediate: true
    }
  },
  mounted() {},
  methods: {
    /**
     * 取消选择
     */
    handleCancel() {
      // 重置状态
      this.form = {
        invoiceNumber: '',
        logisticsNumber: '',
        realInvoiceDate: ''
      }
      this.$emit('update:visible', false)
    },

    /**
     * 点击确定
     */
    handleConfirm() {
      this.$refs.form.validate((valid) => {
        if (valid) {
          if (this.invoiceNumber <= 0) {
            return
          }
          var params = {
            ...this.form
          }
          if (this.detail.invoiceSonId) {
            params.invoiceId = this.detail.invoiceSonId
          } else {
            params.invoiceId = this.detail.invoiceId
          }
          if (!this.reset) {
            params.invoiceStatus = 1
          }
          this.loading = true
          // const request = this.reset ? crmInvoiceStatusResetAPI : crmInvoiceStatusUpdateAPI
          const request = crmInvoiceStatusUpdateOpenAPI
          request(params)
            .then(res => {
              this.$message({
                type: 'success',
                message: '操作成功'
              })
              this.loading = false
              this.detail.invoiceStatus = 1
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
