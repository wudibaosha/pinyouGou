<template>
  <flexbox
    :gutter="gutter"
    align="stretch"
    class="wk-base-detail-section"
    wrap="wrap">
    <flexbox-item
      v-for="(item, index) in list"
      :key="index"
      :span="item.span ? item.span : 0.5">
      <flexbox
        align="stretch"
        class="wk-base-detail-section__item">
        <div class="item-name">{{ item.label }}</div>
        <div class="item-value">{{ item.value }}</div>
      </flexbox>
    </flexbox-item>
    <el-dropdown
      v-if="dropdownItems && dropdownItems.length > 0"
      trigger="hover"
      class="wk-base-detail-section__more"
      @command="handleTypeClick">
      <i
        style="cursor: pointer;"
        class="el-icon-more" />
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item
          v-for="(item, index) in dropdownItems"
          :key="index"
          :icon="item.icon"
          :command="item.command">{{ item.label }}</el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
    <slot />
  </flexbox>
</template>

<script>

export default {
  name: 'WkBaseDetailSection',
  components: {},
  props: {
    list: Array,
    gutter: {
      type: Number,
      default: 0
    },
    dropdownItems: Array
  },
  data() {
    return {}
  },
  computed: {},
  watch: {},
  mounted() {},

  beforeDestroy() {},
  methods: {
    handleTypeClick(type) {
      this.$emit('command-select', type)
    }
  }
}
</script>

<style lang="scss" scoped>
.wk-base-detail-section {
  position: relative;

  &__item {
    width: auto;
    padding: 8px;

    .item-name {
      flex-shrink: 0;
      width: 100px;
      margin-right: 12px;
      line-height: 1.5;
      color: $--color-text-regular;
    }

    .item-value {
      overflow: hidden;
      line-height: 1.5;
      word-break: break-all;
      word-wrap: break-word;
      white-space: pre-wrap;
    }
  }

  &__more {
    position: absolute;
    top: 0;
    right: 0;
  }
}
</style>
