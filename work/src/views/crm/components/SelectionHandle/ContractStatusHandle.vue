<template>
  <el-dialog
    ref="wkDialog"
    :visible="visible"
    :append-to-body="true"
    :close-on-click-modal="false"
    title="客户合同状态"
    width="400px"
    @close="handleCancel">
    <el-form
      ref="fieldForm"
      :model="form"
      :rules="rules"
      :validate-on-rule-change="false"
      label-position="top">
      <el-form-item
        class="wk-form-item"
        label="合同状态"
        prop="status">
        <el-select
          v-model="form.status"
          style="width: 100%;">
          <el-option
            v-for="item in options"
            :key="item.value"
            :label="item.label"
            :value="item.value" />
        </el-select>
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
import { crmContractReturnOrPostAPI } from '@/api/crm/customer'

import ElDialogLoadingMixin from '@/mixins/ElDialogLoading'

export default {
  /** 客户管理  成交状态 操作*/
  name: 'DealStatusHandle',
  components: {},
  mixins: [ElDialogLoadingMixin],
  props: {
    value: [Number, String],
    id: [String, Number],
    visible: {
      type: Boolean,
      required: true,
      default: false
    },
    // 勾选数据
    selectionList: {
      type: Array,
      default: () => {
        return []
      }
    }
  },
  data() {
    return {
      loading: true,
      form: {
        status: '邮寄状态'
      },
      rules: {
        status: [{ required: true, message: '请选择', trigger: 'change' }]
      },
      options: [
        {
          label: '邮寄状态',
          value: '邮寄状态'
        },
        {
          label: '返还状态',
          value: '返还状态'
        }
      ]
    }
  },
  computed: {},
  watch: {
    value: {
      handler(val) {
        if (typeof val != 'undefined' && val != null) {
          this.form = {
            status: val == '邮寄状态' ? '邮寄状态' : '返还状态'
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
        status: '邮寄状态'
      }
      this.$emit('update:visible', false)
      this.$emit('handle')
    },

    /**
     * 点击确定
     */
    handleConfirm() {
      this.$refs.fieldForm.validate((valid) => {
        if (valid) {
          const params = {
            returnPostStatus: this.form.status
          }
          params.contractId = this.id
          this.loading = true
          crmContractReturnOrPostAPI(params)
            .then(res => {
              this.$message({
                type: 'success',
                message: '操作成功'
              })
              this.loading = false
              this.$emit('handle', {
                type: 'deal_status'
              })
              this.handleCancel()
            })
            .catch(() => {
              this.loading = false
            })
        } else {
          return false
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import "@/styles/wk-form.scss";
</style>
