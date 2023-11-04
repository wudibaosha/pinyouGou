<template>
  <el-dialog
    :visible.sync="visible"
    :append-to-body="true"
    :close-on-click-modal="false"
    :before-close="handleClose"
    width="700px">
    <div class="position-relative">
      <div class="detail">通过市场活动功能以及小程序获客户名片，为市场部门提供线上线下智能营销与分析平台，您可以联系悟空官方开通微信小程序服务。开通后可</div>
      <div class="main">一、提高销售转化率</div>
      <div class="detail is-block">个人信息全面展示，让每一次商务社交都成为个人与品牌的最佳展示机会</div>
      <div class="main">二、增加获客渠道</div>
      <div class="detail is-block">企业官网、企业产品多维度展示，输出专业企业形象，赋能销售获客推广</div>
      <div class="main">三、提高签单成功率</div>
      <div class="detail is-block">商机、客户浏览时间实时记录，避免低质商机打扰，让销售专注高质量客户</div>
      <div class="code-detail">
        <img src="@/assets/img/card-code.jpg">
        <p>您可以通过扫描上方二维码，立即体验</p>
        <p>小程序悟空智慧名片</p>
      </div>
    </div>
    <span
      slot="footer"
      class="dialog-footer">
      <el-button
        type="primary"
        @click="handleClose">确定</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: 'CardDetail',
  components: {},
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
    }
  },
  computed: {},
  mounted() {},
  methods: {
    handleClose() {
      this.$emit('update:visible', false)
    }
  }
}
</script>

<style scoped lang="scss">
.position-relative {
  position: relative;
  font-size: 14px;
  line-height: 1.5;
}

.detail {
  margin-bottom: 15px;
  color: $--color-text-regular;
}

.detail.is-block {
  padding-left: 25px;
}

.main {
  font-weight: bold;
  color: $--color-text-primary;
}

.code-detail {
  font-size: 12px;
  color: $--color-text-secondary;
  text-align: center;

  img {
    width: 120px;
    margin: 10px 0;
  }
}
</style>
