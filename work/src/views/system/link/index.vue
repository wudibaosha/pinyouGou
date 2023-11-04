<template>
  <div class="link-wrapper">
    <div class="container">
      <img class="logo" src="https://file.72crm.com/static/pc/images/logo-yun.png">
      <img
        class="pic"
        :src="img"
        alt="">
      <div class="title" :class="{ 'is-primary': isPrimary }">{{ title }}</div>
      <div v-if="showDesc" class="desc">{{ desc }}</div>
      <el-button
        v-if="showButton"
        type="primary"
        @click="goClick">立即跳转</el-button>
    </div>
  </div>
</template>

<script>
import { getAuth } from '@/utils/auth'

export default {
  // 链接跳转 内置 验证成功 query  type email k 参数
  name: 'Link',

  components: {
  },

  props: {},

  data() {
    return {
      title: '',
      isPrimary: false, // 标题变蓝
      desc: '',
      showDesc: false,
      count: 5, // 默认秒数
      showCountdown: false, // 展示倒计时
      intervalId: null, // 定时器
      showButton: true,
      img: require('./img/success.png')
    }
  },

  computed: {},

  watch: {},

  created() {},

  mounted() {
  },

  beforeDestroy() {},

  methods: {
    /**
     * @description: 立即跳转
     * @param {*}
     * @return {*}
     */
    goClick() {
      getAuth().then(res => {
        this.$router.push('/')
      }).catch(() => {
        this.$router.push('/login')
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.link-wrapper {
  position: relative;
  background-color: $--background-color-base;

  .container {
    position: absolute;
    top: 40%;
    left: 50%;
    width: 86%;
    max-width: 624px;
    padding: 40px;
    text-align: center;
    background-color: $--color-white;
    border: $--border-base;
    border-radius: $--border-radius-base;
    box-shadow: $--box-shadow-base;
    transform: translate(-50%, -50%);

    .logo {
      position: absolute;
      top: -56px;
      left: 50%;
      width: 136px;
      height: 42px;
      transform: translateX(-50%);
    }

    .pic {
      width: 114px;
      height: 114px;
    }

    .title {
      margin-top: 32px;
      font-size: 22px;

      &.is-primary {
        color: $--color-primary;
      }
    }

    .desc {
      margin-top: 5px;
      color: $--color-text-secondary;

      .is-red {
        margin: 0 4px;
        color: $--color-r400;
      }
    }

    .el-button {
      margin-top: 64px;
    }
  }
}
</style>
