<template>
  <el-popover
    v-model="showPopover"
    width="335"
    popper-class="no-padding-popover"
    trigger="click">
    <div class="main">
      <div class="main__hd">审批流图标</div>
      <flexbox
        class="main__bd"
        wrap="wrap">
        <div
          v-for="(item, index) in iconList"
          :key="index"
          :class="{ 'is-select': currentIcon && currentIcon.icon == item.icon }"
          class="icon-list"
          @click="iconSelect(item)">
          <div
            :style="{ backgroundColor: item.color }"
            class="icon-list__item">
            <i :class="item.icon" />
          </div>
        </div>
      </flexbox>
      <div class="main__ft">
        <el-button
          type="primary"
          @click="sureClick">确定</el-button>
        <el-button @click="closeClick">取消</el-button>
      </div>
    </div>
    <slot
      slot="reference"
      name="reference" />
  </el-popover>

</template>

<script>
export default {
  // icon
  name: 'XhIconPopover',
  components: {},
  props: {
    selectIcon: Object,
    visible: Boolean
  },
  data() {
    return {
      showPopover: false,
      iconList: [],
      currentIcon: null
    }
  },
  computed: {},
  watch: {
    showPopover: {
      handler(value) {
        if (value) {
          this.currentIcon = this.selectIcon
        }

        this.$emit('update:visible', this.showPopover)
      },
      immediate: true
    }
  },
  mounted() {
    this.getIconList()
  },

  beforeDestroy() {

  },
  methods: {
    getIconList() {
      const keys = [
        'l-record',
        'leave',
        'trip',
        'overtime',
        'reimbursement',
        'go-out'
      ]
      for (let index = 1; index <= 20; index++) {
        keys.push(`approval-${index}`)
      }

      const colors = [
        '#0052CC',
        '#0052CC',
        '#0052CC',
        '#0052CC',
        '#0052CC',
        '#0052CC'
      ]
      const iconList = []
      for (let index = 0; index < keys.length; index++) {
        const key = keys[index]
        const item = { icon: `wk wk-${key}` }
        item.color = colors[index % 6]
        iconList.push(item)
      }

      this.iconList = iconList
    },

    closeClick() {
      this.showPopover = false
    },

    sureClick() {
      if (this.currentIcon) {
        this.showPopover = false
        this.$emit('select', this.currentIcon.icon, this.currentIcon.color)
      }
    },

    iconSelect(item) {
      this.currentIcon = item
    }
  }
}
</script>

<style lang="scss" scoped>
.main {
  &__hd {
    position: relative;
    padding: 15px;
    padding-bottom: 10px;
    font-size: 18px;
    font-weight: 600;
    line-height: 1;
    color: $--color-text-primary;
  }

  &__bd {
    padding: 10px 15px 20px;
  }

  &__ft {
    padding: 8px 15px;
    text-align: right;
    background-color: #f7f8fa;
    border-top: 1px solid #e6e6e6;
  }
}

.icon-list {
  padding: 10px;
  cursor: pointer;

  &__item {
    display: inline-block;
    width: 40px;
    height: 40px;
    line-height: 40px;
    text-align: center;
    border-radius: $--border-radius-base;

    .wk {
      font-size: 26px;
      color: white;
    }
  }

  &:hover {
    background-color: #ecf2ff;
  }
}

.icon-list.is-select {
  background-color: #ecf2ff;
}
</style>
