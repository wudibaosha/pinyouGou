<template>
  <flexbox
    :gutter="gutter"
    align="stretch"
    class="wk-base-detail-section"
    wrap="wrap">
    <flexbox-item
      v-for="(item, index) in list"
      :key="index"
      :class="[{'is-block': isBlockShowField(item)}, `is-${item.formType}`]">
      <flexbox
        align="stretch"
        class="wk-base-detail-section__item">
        <div class="item-name">{{ item.name }}</div>
        <div class="item-value">
          <wk-field-view
            :props="item"
            :form-type="item.formType"
            :value="item.value"
          >
            <template slot-scope="{ data }">
              <slot :data="data" name="data" />
            </template>
          </wk-field-view>
        </div>
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
import WkFieldView from '@/components/NewCom/WkForm/WkFieldView'

export default {
  name: 'WkBaseDetailSection',
  components: {
    WkFieldView
  },
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
    },

    /**
     * 是整行展示字段
     */
    isBlockShowField(item) {
      return [
        'file',
        'detail_table'].includes(item.formType)
    }
  }
}
</script>

<style lang="scss" scoped>
.wk-base-detail-section {
  position: relative;

  .vux-flexbox-item {
    flex: 0 0 50%;

    &.is-desc_text {
      .item-name {
        display: none;
      }
    }
  }

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
      flex: 1;
      overflow: hidden;
      line-height: 1.5;
      word-break: break-all;
      word-wrap: break-word;
      white-space: pre-wrap;
    }
  }

  .is-block {
    flex-basis: 100% !important;
  }

  &__more {
    position: absolute;
    top: 0;
    right: 0;
  }
}
</style>
