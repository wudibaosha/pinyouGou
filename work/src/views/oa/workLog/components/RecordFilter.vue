<template>
  <div class="record-filter">
    <div class="record-filter__header">
      <span class="record-filter__title">筛选</span>
    </div>
    <div class="record-filter__body">
      <el-form ref="form" class="task-filter__body" label-width="90px">
        <el-form-item label="创建人">
          <wk-user-dialog-select
            v-model="usersIdsValue"
            placeholder="选择人员" />
        </el-form-item>
        <el-form-item label="创建时间">
          <time-type-select
            v-if="timeSelectValue"
            width="100%"
            :default-type="timeSelectValue"
            @change="timeTypeChange" />
        </el-form-item>
        <el-form-item label="模块">
          <el-select
            v-model="crmTypeValue">
            <el-option
              v-for="(item, index) in crmTypeOptions"
              :key="index"
              :label="item.label"
              :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select
            v-model="typeValue">
            <el-option
              v-for="(item, index) in typeOptions"
              :key="index"
              :label="item.label"
              :value="item.value" />
          </el-select>
        </el-form-item>
      </el-form>
    </div>
    <div class="record-filter__footer">
      <span
        slot="footer"
        class="dialog-footer">
        <el-button
          v-debounce="saveClick"
          type="primary">保存</el-button>
        <el-button @click.native="closeClick">取消</el-button>
      </span>
    </div>
  </div>
</template>

<script>
import WkUserDialogSelect from '@/components/NewCom/WkUserDialogSelect'
import TimeTypeSelect from '@/components/TimeTypeSelect'

import { objDeepCopy } from '@/utils'

export default {
  // 筛选
  name: 'RecordFilter',
  components: {
    WkUserDialogSelect,
    TimeTypeSelect
  },
  props: {
    crmTypeOptions: Array,
    crmType: [String, Number],
    timeSelect: Object,
    userIds: Array,
    type: [String, Number]
  },
  data() {
    return {
      usersIdsValue: [],
      crmTypeValue: '',
      timeSelectValue: null,
      typeValue: '',

      typeOptions: [
        { label: '全部', value: '' },
        { label: '跟进记录', value: 1 },
        { label: '外勤签到', value: 4 }
      ]
    }
  },
  computed: {},
  watch: {},
  created() {
    this.crmTypeValue = this.crmType
    this.timeSelectValue = objDeepCopy(this.timeSelect)
    this.typeValue = this.type
    this.usersIdsValue = objDeepCopy(this.userIds)
  },

  beforeDestroy() {},
  methods: {
    closeClick() {
      this.$emit('close')
    },

    /**
     * 时间更改
     */
    timeTypeChange(data) {
      this.timeSelectValue = data
    },

    saveClick() {
      this.$emit('save', this.crmTypeValue, this.timeSelectValue, this.typeValue, this.usersIdsValue)
    },

    /**
     * datepicker 不关闭的问题
     */
    handleDateClose() {
      this.$refs.filterDatePicker.pickerVisible = false
    }
  }
}
</script>

<style lang="scss" scoped>
.record-filter {
  &__header {
    padding: 16px;
    padding-bottom: 8px;
  }

  &__title {
    font-size: 18px;
    font-weight: 600;
    line-height: 24px;
  }

  &__body {
    padding: 0 16px;
    word-break: break-all;

    .el-date-editor {
      width: 100%;
    }

    .el-form-item {
      margin-bottom: $--interval-base;
    }
  }

  &__footer {
    padding: 10px;
    text-align: right;
    background-color: #f7f8fa;
    border-top: $--border-base;
  }
}
</style>
