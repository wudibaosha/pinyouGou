<template>
  <flexbox class="fav-list">
    <el-button
      :class="{'is-fav': isFavour}"
      class="good-btn"
      type="icon"
      icon="wk wk-good"
      @click="faveClick" />
    <template v-if="data && data.length > 0">
      <div class="fav-user">
        <el-popover
          v-for="(user, index) in data"
          :key="index"
          v-model="user.show"
          placement="bottom"
          width="250"
          trigger="click"
          popper-class="no-padding-popover">
          <xr-user-view
            v-if="user.show"
            :id="user.userId"
            :data="user" />
          <span slot="reference" class="can-visit--underline">{{ user.realname }}{{ data.length -1 === index ? '' : '、' }}</span>
        </el-popover>
      </div>
      <span v-if="data.length > 10" class="fav-total">等<el-popover
        v-model="contentVisible"
        popper-class="no-padding-popover"
        placement="top"
        width="200"
        trigger="click">
        <div v-if="contentVisible" class="fav-users">
          <flexbox class="fav-users__header">
            <div class="title">{{ `共${data.length}人点赞` }}</div>
            <i class="el-icon-close" @click="contentVisible = false" />
          </flexbox>
          <div class="fav-users__body">
            <flexbox
              v-for="(user, index) in data"
              :key="index"
              class="user">
              <el-popover
                v-model="user.favShow"
                placement="bottom"
                width="250"
                trigger="click">
                <xr-user-view
                  v-if="user.favShow"
                  :id="user.userId"
                  :data="user" />
                <xr-avatar
                  slot="reference"
                  :src="user.img"
                  :name="user.realname"
                  :size="34"
                  class="user__img" />
              </el-popover>
              <div class="text-one-line user__name">{{ user.realname }}</div>
            </flexbox>
          </div>
        </div>
        <span slot="reference">{{ data.length }}</span>
      </el-popover>人点赞</span>
    </template>
  </flexbox>
</template>

<script>

export default {
  // 点赞列表
  name: 'FavList',

  components: {
    XrUserView: () => import('@/components/XrUserView')
  },

  props: {
    isFavour: Boolean,
    data: Array
  },

  data() {
    return {
      contentVisible: false
    }
  },

  computed: {},

  watch: {},

  created() {},

  mounted() {},

  beforeDestroy() {},

  methods: {
    faveClick() {
      this.$emit('fav', this.data)
    }
  }
}
</script>

<style lang="scss" scoped>
.fav-list {
  padding-right: 8px;
  font-size: 13px;

  .fav-user {
    flex: 1;
    width: 0;
    overflow: hidden;
    color: $--color-text-regular;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .fav-total {
    flex-shrink: 0;
    margin-left: 8px;

    span {
      color: $--color-primary;
      cursor: pointer;
    }
  }
}

.fav-users {
  &__header {
    padding: 10px 20px;

    .title {
      flex: 1;
    }

    .el-icon-close {
      font-size: 17px;
      color: #909399;
      cursor: pointer;

      &:hover {
        color: $--color-primary;
      }
    }

    border-bottom: 1px solid $--border-color-base;
  }

  &__body {
    height: 300px;
    overflow-y: auto;
  }
}

.user {
  padding: 8px 20px;

  &__img {
    margin-right: 10px;
  }

  &__name {
    flex: 1;
  }
}

.good-btn {
  padding: 0;
  margin-right: $--interval-base;

  &.is-fav {
    color: $--color-primary;
  }
}
</style>
