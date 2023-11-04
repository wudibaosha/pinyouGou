<template>
  <div class="box-wrapper">
    <div class="title">
      <span>{{ attr.isNull ? '*' : '' }}</span>{{ attr.name }}<span v-if="attr.inputTips">{{ '（'+attr.inputTips+'）' }}</span>
    </div>
    <ul class="table">
      <draggable
        :list="attr.formValue"
        :options="{name: 'list'}">
        <li
          v-for="(item, index) in attr.formValue"
          :key="index"
          :class="{'is-select': selectIndex === index}"
          class="table-item"
          @click.stop="selectItem(item, index)">
          <div class="table-item-head">{{ item.name }}</div>
          <div class="table-item-body" />
        </li>
      </draggable>
    </ul>
    <span
      v-if="isShow"
      class="el-icon-delete control"
      @click="handleDelete" />
  </div>
</template>

<script>
/**
 * 表格
 */
import mixins from './mixin'
import draggable from 'vuedraggable'

export default {
  name: 'TableForm',
  components: {
    draggable
  },
  mixins: [mixins],
  data() {
    return {
      selectIndex: -1 // 标示目前选中列
    }
  },
  computed: {},
  mounted() {},
  methods: {
    selectItem(item, index) {
      this.selectIndex = index
      this.$emit('select', { data: item, index: index })
    }
  }
}
</script>

<style scoped lang="scss">
@import "@/styles/mixin.scss";
@import "form.scss";

ul {
  display: block;
  min-height: 95px;
  overflow-x: auto;
  clear: both;
  list-style: none;
  border: 1px solid #e6e6e6;
}

li {
  display: list-item;
  float: left;
  min-width: 100px;
  font-size: 12px;
  text-align: -webkit-match-parent;
}

.table-item.is-select {
  background-color: white;
}

.table-item-head {
  min-height: 24px;
  padding: 5px;
  border-right: 1px solid #e6e6e6;
  border-bottom: 1px solid #e6e6e6;
}

.table-item-body {
  min-height: 90px;
  padding: 5px;
  border-right: 1px solid #e6e6e6;
  border-bottom: 1px solid #e6e6e6;
}
</style>
