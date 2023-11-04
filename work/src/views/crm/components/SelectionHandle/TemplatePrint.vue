<template>
  <el-dialog
    ref="wkDialog"
    :visible="visible"
    :append-to-body="true"
    :close-on-click-modal="false"
    title="选择打印模板"
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
        label="模板"
        prop="templateId">
        <el-select
          v-model="form.templateId"
          class="handle-item-content">
          <el-option
            v-for="item in options"
            :key="item.templateId"
            :label="item.templateName"
            :value="item.templateId" />
        </el-select>
      </el-form-item>
    </el-form>
    <span
      slot="footer"
      class="dialog-footer">
      <el-button
        v-debounce="handleConfirm"
        type="primary">确定</el-button>
      <el-button @click.native="handleCancel">取消</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { printTemplateListAPI } from '@/api/admin/crm'

import crmTypeModel from '@/views/crm/model/crmTypeModel'
import ElDialogLoadingMixin from '@/mixins/ElDialogLoading'

export default {
  // 模板打印
  name: 'TemplatePrint',
  components: {},
  mixins: [ElDialogLoadingMixin],
  props: {
    visible: {
      type: Boolean,
      required: true,
      default: false
    },
    crmType: {
      type: String,
      default: ''
    },
    detail: Object
  },
  data() {
    return {
      loading: true,
      options: [],
      form: {
        templateId: ''
      },
      rules: {
        templateId: [{ required: true, message: '请选择', trigger: 'change' }]
      }
    }
  },
  computed: {},
  watch: {},
  created() {
    this.getOptions()
  },
  methods: {
    /**
     * 取消选择
     */
    handleCancel() {
      // 重置状态
      this.$emit('update:visible', false)
    },

    getOptions() {
      this.$refs.fieldForm.validate((valid) => {
        if (valid) {
          this.loading = true
          printTemplateListAPI({
            type: crmTypeModel.convertKeyToType(this.crmType),
            pageType: 0
          })
            .then(res => {
              this.options = res.data.list || []
              if (this.options.length) {
                this.form.templateId = this.options[0].templateId
              } else {
                this.form.templateId = ''
              }
              this.loading = false
            })
            .catch(() => {
              this.loading = false
            })
        } else {
          return false
        }
      })
    },

    /**
     * 点击确定
     */
    handleConfirm() {
      if (this.form.templateId) {
        const id = this.detail[`${this.crmType}Id`]
        const routeData = this.$router.resolve(`/print/?templateId=${this.form.templateId}&id=${id}`)
        window.open(routeData.href, '_blank')
        this.handleCancel()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import "@/styles/wk-form.scss";
</style>
