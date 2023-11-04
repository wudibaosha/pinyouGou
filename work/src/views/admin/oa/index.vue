<template>
  <flexbox
    class="main"
    direction="column"
    align="stretch">
    <xr-header
      label="办公审批流">
      <el-button
        slot="ft"
        type="primary"
        @click="addExamine">新建审批流程</el-button>
    </xr-header>
    <div class="main-body">
      <component :is="leftType" />
    </div>
  </flexbox>
</template>

<script>
import ExamineManager from './components/ExamineManager'
import XrHeader from '@/components/XrHeader'

export default {
  components: {
    ExamineManager,
    XrHeader
  },
  data() {
    return {
      leftType: 'ExamineManager',
      leftSides: [
        {
          name: '审批类型管理',
          type: 'ExamineManager'
        }
      ]
    }
  },
  mounted() {},
  methods: {
    /**
     * 新建
     */
    addExamine() {
      const examineManager = this.getChildByName('ExamineManager')
      examineManager && examineManager.addExamine()
    },

    /**
     * 通过name获取子组件
     */
    getChildByName(name) {
      const getChild = function(name, list) {
        for (let i = 0; i < list.length; i++) {
          const vm = list[i]
          const componentName = vm.$options.name || vm.$options._componentTag

          if (componentName === name) return vm
          if (vm.$children && vm.$children.length) {
            const res = getChild(name, vm.$children)
            if (res) return res
          }
        }
        return null
      }
      return getChild(name, this.$children)
    }
  }
}
</script>

<style lang="scss" scoped>
@import "../styles/index.scss";

.main-body {
  margin-top: #{$--interval-base * 2};
}
</style>

