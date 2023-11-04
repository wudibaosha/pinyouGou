<template>
  <el-dialog
    ref="wkDialog"
    :visible.sync="visible"
    :append-to-body="true"
    :close-on-click-modal="false"
    title="批量分配"
    width="400px"
    @close="handleCancel">
    <span slot="title" class="el-dialog__title">批量分配<i v-if="batchHelpObj" class="wk wk-icon-fill-help wk-help-tips" :data-type="batchHelpObj.type" :data-id="batchHelpObj.id" /></span>
    <el-form
      ref="fieldForm"
      :model="form"
      :rules="rules"
      :validate-on-rule-change="false"
      label-position="top">
      <el-form-item
        class="wk-form-item"
        label="负责人"
        prop="userId">
        <wk-user-dialog-select
          v-model="form.userId"
          style="width: 100%;"
          radio />
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
import { crmCustomerDistributeAPI } from '@/api/crm/customer'

import WkUserDialogSelect from '@/components/NewCom/WkUserDialogSelect'

import ElDialogLoadingMixin from '@/mixins/ElDialogLoading'

export default {
  /** 客户管理 的 勾选后的 公海分配 操作*/
  name: 'AllocHandle',
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
    /** 没有值就是全部类型 有值就是当个类型 */
    crmType: {
      type: String,
      default: ''
    },
    poolId: [String, Number],
    /** 转移数据 */
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
      visible: false,
      form: {
        userId: ''
      },
      rules: {
        userId: [{ required: true, message: '请选择负责人', trigger: 'change' }]
      }
    }
  },
  computed: {
    // 帮助信息
    batchHelpObj() {
      return {
        customer: {
          type: '8',
          id: '119'
        }
      }[this.crmType] || null
    }
  },
  watch: {
    dialogVisible: {
      handler(val) {
        this.visible = val
        if (!val) {
          this.form = {
            userId: ''
          }
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
     * 取消选择
     */
    handleCancel() {
      this.visible = false
      this.$emit('update:dialogVisible', false)
    },

    handleConfirm() {
      this.$refs.fieldForm.validate((valid) => {
        if (valid) {
          const params = {
            userId: this.form.userId,
            poolId: this.poolId
          }
          params.ids = this.selectionList.map(item => item[this.crmType + 'Id'])
          this.loading = true
          crmCustomerDistributeAPI(params)
            .then(res => {
              this.$message({
                type: 'success',
                message: '操作成功'
              })
              this.loading = false
              this.$emit('handle', {
                type: 'alloc'
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
