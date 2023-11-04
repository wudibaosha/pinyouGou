<template>
  <div>
    <div
      :style="{ backgroundColor: iconColor }"
      class="header-icon">
      <i :class="iconClass" />
    </div>
    <xh-icon-popover
      ref="iconPopover"
      :visible.sync="iconVisible"
      :select-icon="selectIcon"
      @select="iconSelect">
      <el-button
        slot="reference"
        :type="iconVisible ? 'selected' : ''">选择图标</el-button>
    </xh-icon-popover>
  </div>
</template>

<script>
import XhIconPopover from './XhIconPopover'

export default {
  // 审批流图标
  name: 'XhIconSelect',
  components: {
    XhIconPopover
  },
  props: {
    value: {
      type: String,
      default: ''
    },
    // 索引值 用于更新数据
    index: Number,
    // 包含数据源
    item: Object
  },
  data() {
    return {
      iconVisible: false,
      dataValue: ''
    }
  },
  computed: {
    iconColor() {
      const temps = this.dataValue.split(',')
      return temps.length > 1 ? temps[1] : '#0052CC'
    },

    iconClass() {
      const temps = this.dataValue.split(',')
      return temps.length > 1 ? temps[0] : 'wk wk-approve'
    },

    selectIcon() {
      const temps = this.dataValue.split(',')
      if (temps.length > 1) {
        return {
          icon: temps[0],
          color: temps[1]
        }
      } else {
        return null
      }
    }
  },
  watch: {
    value: function(val) {
      this.dataValue = val
    }
  },
  mounted() {
    this.dataValue = this.value
  },

  beforeDestroy() {},
  methods: {
    iconSelect(icon, color) {
      this.dataValue = `${icon},${color}`
      this.valueChange()
    },

    valueChange() {
      this.$emit('value-change', {
        index: this.index,
        value: this.dataValue
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.header-icon {
  display: inline-block;
  width: 36px;
  height: 36px;
  margin-right: 30px;
  line-height: 36px;
  text-align: center;
  border-radius: $--border-radius-base;

  .wk {
    font-size: 22px;
    color: white;
  }
}
</style>
