<template>
  <flexbox
    class="detail-head-base"
    align="stretch">
    <div
      v-for="(item,index) in list"
      :key="index"
      class="base-item">
      <div class="base-title">{{ item.title }}<i v-if="item.helpObj" class="wk wk-icon-fill-help wk-help-tips" :data-type="item.helpObj.type" :data-id="item.helpObj.id" /></div>
      <div v-if="item.addShow" class="base-value">
        <el-button
          icon="el-icon-plus"
          type="text"
          style="padding: 0;"
          @click="handleClick('contacts-add')">添加</el-button>
      </div>
      <div v-else class="base-value text-one-line">
        <span v-if="item.showPhone" class="phone-item">
          <i class="wk wk-circle-iphone" /> {{ item.value }}
        </span>
        <el-tooltip v-else :disabled="!item.value" :content="item.value" class="text-one-line" effect="dark" placement="top">
          <span><span v-if="item.showIcon" :class="item.icon" style="margin-right: 4px;" /><span>{{ item.value }}</span></span>
        </el-tooltip>
      </div>
    </div>
  </flexbox>
</template>

<script>
export default {
  // 详情头base
  name: 'DetailHeadBase',

  components: {},

  props: {
    list: Array
  },

  data() {
    return {
    }
  },

  computed: {},

  watch: {},

  created() {},

  mounted() {},

  beforeDestroy() {},

  methods: {
    handleClick(type) {
      this.$emit('action', type)
      console.log(type)
    }
  }
}
</script>

<style lang="scss" scoped>
.detail-head-base {
  position: relative;

  .base-item {
    flex: 0 0 20%;
    overflow: hidden;

    & + & {
      padding-left: $--interval-base;
    }
  }

  .base-title {
    color: $--color-text-secondary;
  }

  .base-value {
    min-height: 14px;
    margin-top: #{$--interval-base};
  }

  .phone-item {
    color: $--color-g300;

    i {
      margin-right: #{$--interval-base / 2};
    }
  }
}
</style>
