<template>
  <el-dialog
    v-loading="loading"
    :visible="visible"
    :append-to-body="true"
    :close-on-click-modal="false"
    title="批量分配"
    width="500px"
    @close="handleCancel">
    <el-form ref="form" :model="editData" label-width="120px">
      <el-form-item :label="ownerUserName" prop="pushOwnerUser">
        <el-radio-group v-model="editData.pushOwnerUser">
          <el-radio :label="1">推送</el-radio>
          <el-radio :label="0">不推送</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="showTermMember" label="团队成员" prop="pushTermMember">
        <el-radio-group v-model="editData.pushTermMember">
          <el-radio :label="1">推送</el-radio>
          <el-radio :label="0">不推送</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="上级主管" prop="pushTermMember">
        <el-select
          v-model="editData.pushParentUserList"
          style="width: 100%;"
          multiple>
          <el-option
            v-for="item in sendLevelOption"
            :key="item.value"
            :label="item.label"
            :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="自定义推送人员" prop="pushTermMember">
        <wk-user-dep-dialog-select
          :user-value.sync="editData.pushCustomUserList"
          :dep-value.sync="editData.pushCustomDeptList"
          placeholder="请选择员工或部门"
          style="width: 100%;"
        />
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
import WkUserDepDialogSelect from '@/components/NewCom/WkUserDepDialogSelect'

import { objDeepCopy } from '@/utils'

export default {
  // 配置
  name: 'MessageConfigDialog',
  components: {
    WkUserDepDialogSelect
  },
  mixins: [],
  props: {
    data: Object,
    visible: {
      type: Boolean,
      required: true,
      default: false
    }
  },
  data() {
    return {
      loading: true,
      editData: null,
      sendLevelOption: []
    }
  },
  computed: {
    ownerUserName() {
      if (['excelImport', 'excelExport'].includes(this.editData.name)) {
        return '操作人'
      }
      return '负责人'
    },
    // 展示团队成员
    showTermMember() {
      if (this.editData &&
       !['leads', 'receivables', 'invoice', 'product'].includes(this.editData.label) &&
       !['save', 'transform', 'excelImport', 'excelExport'].includes(this.editData.name)) {
        return true
      }
      return false
    }
  },
  watch: {
    visible: {
      handler() {
        this.editData = objDeepCopy(this.data || {})
      },
      immediate: true
    }
  },
  created() {
    for (let index = 1; index <= 20; index++) {
      this.sendLevelOption.push({
        label: index === 1 ? '直属上级' : `第${index}级上级`,
        value: index
      })
    }
  },
  methods: {
    /**
     * 取消
     */
    handleCancel() {
      this.$emit('update:visible', false)
    },

    /**
     * 确定
     */
    handleConfirm() {
      for (const key in this.editData) {
        this.data[key] = this.editData[key]
      }

      this.handleCancel()
    }
  }
}
</script>

<style lang="scss" scoped>
/deep/ .el-form-item {
  margin-bottom: 5px;

  .el-form-item__label {
    text-align: left;
  }
}

.el-form {
  max-height: 55vh;
  overflow-x: hidden;
  overflow-y: auto;
}

.handle-bar {
  margin-top: 10px;
  text-align: right;
}
</style>
