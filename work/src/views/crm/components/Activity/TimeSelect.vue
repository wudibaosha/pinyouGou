<template>
  <el-popover
    v-model="showTypePopover"
    :width="width"
    placement="bottom"
    class="time-type-select"
    popper-class="no-padding-popover"
    trigger="click">
    <div class="type-popper">
      <div class="type-content">
        <div
          v-for="(item, index) in options"
          :key="index"
          :class="{ 'selected' : selectType.value == item.value && !showCustomContent}"
          class="type-content-item"
          @click="typeSelectClick(item)">
          <div class="mark" />{{ item.label }}
        </div>
        <div
          :class="{ 'selected' : showCustomContent}"
          class="type-content-item"
          @click="showCustomContent = true">
          <div class="mark" />自定义
        </div>
      </div>
      <div
        v-if="showCustomContent"
        class="type-content-custom">
        <el-date-picker
          v-model="startTime"
          :editable="false"
          type="datetime"
          value-format="yyyy-MM-dd HH:mm:ss"
          placeholder="选择日期" />
        <el-button @click="customSureClick">确定</el-button>
      </div>
    </div>
    <el-input
      slot="reference"
      v-model="typeShowValue"
      :readonly="true"
      :style="{width: width + 'px'}"
      placeholder="选择下次联系时间"
      class="type-select">
      <i
        slot="suffix"
        :class="['el-icon-arrow-up', { 'is-reverse' : showTypePopover}]" />
    </el-input>
  </el-popover>
</template>

<script type="text/javascript">
import { isObject } from '@/utils/types'

export default {
  name: 'TimeSelect',
  props: {
    defaultType: [String, Number, Object],
    // 容器宽度，默认200px
    width: {
      type: [String, Number],
      default: 200
    },
    options: {
      type: Array,
      default: () => {
        return [
          { label: '今天', value: 'today' },
          { label: '昨天', value: 'yesterday' },
          { label: '本周', value: 'week' },
          { label: '上周', value: 'lastWeek' },
          { label: '本月', value: 'month' },
          { label: '上月', value: 'lastMonth' },
          { label: '本季度', value: 'quarter' },
          { label: '上季度', value: 'lastQuarter' },
          { label: '本年', value: 'year' },
          { label: '去年', value: 'lastYear' }
        ]
      }
    } // 数据源 如果存在 替换 默认
  },
  data() {
    return {
      selectType: { value: '' },
      showTypePopover: false,
      showCustomContent: false, // 展示自定义时间内容
      sureCustomContent: false, // 确定

      startTime: '',
      endTime: ''
    }
  },
  computed: {
    typeShowValue() {
      if (this.sureCustomContent) {
        if (this.startTime) {
          return this.startTime
        }
        return ''
      } else {
        return this.selectType.label || ''
      }
    }
  }, // 时间类型选择
  watch: {
    defaultType: {
      handler() {
        if (this.defaultType.type === 'default') {
          this.selectType = this.getDefaultTypeValue(this.defaultType.value)
          this.showCustomContent = false
          this.sureCustomContent = false
        } else if (this.defaultType.type === 'custom') {
          this.sureCustomContent = true
          this.showCustomContent = true
          this.startTime = this.defaultType.value
        }
      },
      deep: true
    }
  },
  mounted() {
    if (this.defaultType !== undefined) {
      if (typeof this.defaultType === 'string') {
        this.selectType = this.getDefaultTypeValue(this.defaultType)
      } else if (isObject(this.defaultType)) {
        if (this.defaultType.label) {
          this.selectType = this.defaultType
        } else if (this.defaultType.type == 'default') {
          this.selectType = this.getDefaultTypeValue(this.defaultType.value)
        } else if (this.defaultType.type == 'custom') {
          this.sureCustomContent = true
          this.showCustomContent = true
          this.startTime = this.defaultType.value
        }
      }
    } else {
      this.$emit('change', { type: 'default', value: this.selectType.value })
    }
  },
  methods: {
    getDefaultTypeValue(type) {
      for (let index = 0; index < this.options.length; index++) {
        const element = this.options[index]
        if (element.value == type) {
          return element
        }
      }

      return { value: '' }
    },

    // 类型选择
    typeSelectClick(item) {
      this.showTypePopover = false
      this.sureCustomContent = false
      this.showCustomContent = false
      this.selectType = item
      this.$emit('change', { type: 'default', value: this.selectType.value, label: this.selectType.label })
    },
    // 选择自定义时间 确定
    customSureClick() {
      if (this.startTime) {
        this.sureCustomContent = true
        this.showTypePopover = false

        this.$emit('change', {
          type: 'custom',
          value: this.startTime
        })
      }
    }
  }
}
</script>
<style lang="scss" scoped>
/deep/ .type-select {
  .el-input__inner {
    height: inherit;
    cursor: pointer;
  }
}

// 时间选择
.type-popper {
  .type-content {
    max-height: 250px;
    overflow-y: auto;

    .type-content-item {
      position: relative;
      height: 34px;
      padding: 0 20px;
      line-height: 34px;
      color: #606266;
      cursor: pointer;

      .mark {
        display: inline-block;
        width: 6px;
        height: 6px;
        margin-right: 8px;
        background-color: transparent;
        border-radius: 3px;
      }
    }

    .selected {
      font-weight: bold;
      color: $--color-primary;

      .mark {
        background-color: $--color-primary;
      }
    }

    .type-content-item:hover {
      background-color: #f5f7fa;
    }
  }

  .type-content-custom {
    position: relative;
    padding: 5px 20px 10px;
    overflow: hidden;

    .el-date-editor {
      width: 100%;
      margin-bottom: 8px;
    }

    button {
      float: right;
    }
  }
}

.el-icon-arrow-up {
  position: absolute;
  top: 10px;
  right: 5px;
  font-size: 14px;
  color: #c0c4cc;
  cursor: pointer;
  transition: transform 0.3s;
  transform: rotate(180deg);
}

.el-icon-arrow-up.is-reverse {
  transform: rotate(0deg);
}
</style>
