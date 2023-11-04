<template>
  <div class="system-customer main">
    <xr-header
      label="业绩目标设置">
      <i
        slot="otherLabel"
        class="wk wk-icon-fill-help wk-help-tips"
        data-type="24"
        data-id="226" />
    </xr-header>
    <div class="customer-content">
      <!-- 业绩目标设置 -->
      <div class="main-body">
        <task-set-statistics />
      </div>
    </div>
  </div>
</template>

<script>
import TaskSetStatistics from './components/TaskSetStatistics' // 业绩目标设置
import XrHeader from '@/components/XrHeader'

export default {
  name: 'BizGoals', // 业绩目标设置

  components: {
    TaskSetStatistics,
    XrHeader
  },

  data() {
    return {
    }
  },

  created() {},

  methods: {}
}
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
@import "../../styles/index.scss";

.main-body {
  margin-top: #{$--interval-base * 2};
}
</style>
