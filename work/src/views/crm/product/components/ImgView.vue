<template>
  <div>
    <div
      v-if="src"
      class="img-popover adapter-image">
      <div class="img-wrapper img-core">
        <img :src="dataSrc" alt="" class="small-img">
      </div>
      <el-popover
        v-model="popoverVisible"
        placement="right"
        width="200"
        trigger="hover">
        <div class="middle-img img-wrapper">
          <img
            v-if="popoverVisible"
            :src="dataSrc"
            alt=""
            class="middle-img-core">
        </div>
        <div
          slot="reference"
          class="reference" />
      </el-popover>
    </div>
    <div
      v-else
      style="background-color: unset;"
      class="adapter-image img-wrapper"
      @click.stop />
  </div>
</template>

<script>
export default {
  name: 'ImgView',
  props: {
    src: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      popoverVisible: false
    }
  },
  computed: {
    dataSrc() {
      if (!this.src) return ''
      return process.env.VUE_APP_BASE_API + this.src
    }
  },
  methods: {}
}
</script>

<style scoped lang="scss">
.img-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
  background-color: white;
}

.adapter-image {
  width: 60px;
  height: 60px;
  margin: 8px auto;
}

.small-img {
  max-width: 60px;
  max-height: 60px;
  vertical-align: middle;
}

// popover
.img-popover {
  position: relative;

  .el-popover {
    padding: 10px;
  }

  .img-core {
    width: 100%;
    height: 100%;
    margin: 0;
    pointer-events: none;
  }

  .reference {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 0;
    width: 100%;
    height: 100%;
  }
}

.middle-img {
  width: 178px;
  height: 178px;

  .middle-img-core {
    max-width: 178px;
    max-height: 178px;
    vertical-align: middle;
  }
}
</style>
