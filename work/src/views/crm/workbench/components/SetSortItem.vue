<template>
  <div class="data-statistics card">
    <flexbox class="card-title">
      <div class="card-title-left">
        <span
          :class="icon"
          :style="{ color: iconColor }"
          class="icon" />
        <span class="text">{{ title }}</span>
      </div>
      <slot name="header" />
    </flexbox>
    <div class="content">
      <img :src="img">
    </div>
  </div>
</template>

<script>
export default {
  name: 'SetSortItem',
  props: {
    title: String,
    icon: String,
    iconColor: String,
    img: String
  },
  data() {
    return {}
  },
  methods: {}
}
</script>

<style scoped lang="scss">
.card {
  padding: 10px;
  background-color: white;
  border: 1px solid #e6e6e6;
  border-radius: $--border-radius-base;

  &:hover {
    cursor: move;
    box-shadow: 0 0 16px 0 rgba(0, 0, 0, 0.08);
  }

  &-title {
    position: relative;

    &-left {
      .icon {
        font-size: 13px;
        color: #4983ef;
      }

      .text {
        margin-left: 5px;
        font-size: 14px;
        font-weight: bold;
      }
    }
  }
}

.content {
  height: 60px;
  padding-top: 8px;
  overflow: hidden;
  text-align: center;

  img {
    max-width: 100%;
    height: 100%;
  }
}
</style>
