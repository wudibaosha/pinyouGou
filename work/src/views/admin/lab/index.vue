<template>
  <flexbox
    class="main"
    direction="column"
    align="stretch">
    <xr-header>
      <template slot="label">实验室<i
        class="wk wk-icon-fill-help wk-help-tips"
        data-type="20"
        data-id="168"
        @click.stop="" /></template>
    </xr-header>
    <div
      v-loading="loading"
      class="body">
      <div
        v-for="(bigItem, bigIndex) in allList"
        :key="bigIndex"
        class="section">
        <flexbox class="section-header">
          {{ bigItem.name }}
        </flexbox>
        <flexbox
          wrap="wrap"
          class="section-body">
          <flexbox
            v-for="(item, index) in bigItem.sublist"
            :key="index"
            class="section-item">
            <img
              :src="getModuleIcon(item.status, item.module)"
              class="item-icon">
            <span class="item-name">{{ item.name }}</span>
            <!-- <el-tag class="more-menu">正在优化中</el-tag> -->

            <div class="item-mark"><img src="@/assets/img/launch.png"><span>正在优化中</span></div>
          </flexbox>
        </flexbox>
      </div>
    </div>
  <!-- </div> -->
  </flexbox>
</template>

<script>
import XrHeader from '@/components/XrHeader'

export default {
  // 实验室
  name: 'Lab',
  components: {
    XrHeader
  },
  mixins: [],
  data() {
    return {
      loading: false,
      allList: [
        {
          name: '敬请期待',
          type: 1,
          status: 1,
          sublist: [
            { 'module': 'knowledge', 'status': 1, 'type': '1', 'name': '知识库', 'canEdit': true },
            { 'module': 'email', 'status': 1, 'type': '1', 'name': '邮箱', 'canEdit': true }
          ]
        }
      ]
    }
  },
  computed: {
  },
  mounted() {
  },
  methods: {
    getModuleIcon(status, moduleType) {
      if (moduleType == 'call') {
        return require('@/assets/img/system/app/call_enable.png')
      } else {
        const allModule = {
          oa: {
            disable: require('@/assets/img/system/app/oa_disable.png'),
            enable: require('@/assets/img/system/app/oa_enable.png')
          },
          crm: {
            disable: require('@/assets/img/system/app/crm_disable.png'),
            enable: require('@/assets/img/system/app/crm_enable.png')
          },
          project: {
            disable: require('@/assets/img/system/app/project_disable.png'),
            enable: require('@/assets/img/system/app/project_enable.png')
          },
          log: {
            disable: require('@/assets/img/system/app/log_disable.png'),
            enable: require('@/assets/img/system/app/log_enable.png')
          },
          book: {
            disable: require('@/assets/img/system/app/book_disable.png'),
            enable: require('@/assets/img/system/app/book_enable.png')
          },
          taskExamine: {
            disable: require('@/assets/img/system/app/oa_disable.png'),
            enable: require('@/assets/img/system/app/oa_enable.png')
          },
          bi: {
            disable: require('@/assets/img/system/app/bi_disable.png'),
            enable: require('@/assets/img/system/app/bi_enable.png')
          },
          applet: {
            disable: require('@/assets/img/system/app/mp_enable.png'),
            enable: require('@/assets/img/system/app/mp_disable.png')
          },
          calendar: {
            disable: require('@/assets/img/system/app/ce_disable.png'),
            enable: require('@/assets/img/system/app/ce_enable.png')
          },
          email: {
            disable: require('@/assets/img/system/app/email_disable.png'),
            enable: require('@/assets/img/system/app/email_enable.png')
          },
          knowledge: {
            disable: require('@/assets/img/system/app/knowledge_disable.png'),
            enable: require('@/assets/img/system/app/knowledge_enable.png')
          },
          hrm: {
            disable: require('@/assets/img/system/app/hrm_disable.png'),
            enable: require('@/assets/img/system/app/hrm_enable.png')
          }
        }

        if (allModule[moduleType]) {
          return allModule[moduleType][status == 1 ? 'enable' : 'disable']
        } else {
          return {
            disable: require('@/assets/img/system/app/other_disable.png'),
            enable: require('@/assets/img/system/app/other_enable.png')
          }[status == 1 ? 'enable' : 'disable']
        }
      }
    }

  }
}
</script>

<style lang="scss" scoped>
@import '../styles/index.scss';

.section-header {
}

.section-body {
  margin-top: #{$--interval-base * 2};
  .section-item {
    width: auto;
    min-width: 240px;
    position: relative;
    padding: #{$--interval-base * 2};
    border: $--border-base;
    border-radius: $--border-radius-base;
    margin-right: #{$--interval-base * 2};
    margin-bottom: #{$--interval-base * 2};
    vertical-align: middle;
    .item-icon {
      width: 40px;
      height: 40px;
      margin-right: 12px;
    }
    // .item-name {
    //   color: $--color-primary;
    // }

    .item-mark {
      position: absolute;
      top: -5px;
      right: -7px;
      width: 108px;
      height: 36px;
      line-height: 34px;
      font-size: $--font-size-small;
      text-align: center;
      color: $--color-primary;
      background-repeat: no-repeat;
      background-size: 100%;
      background-image: url('~@/assets/img/identify-1.png');

      img {
        width: 12px;
        margin-right: 2px;
      }
    }
  }
}

.el-icon-more {
  transform: rotate(90deg);
  cursor: pointer;
}

.more-menu {
  position: absolute;
  top: 8px;
  right: 8px;
}

.detail-button {
  position: absolute;
  top: 0px;
  right: 8px;
  font-size: 12px;
}

.more-mark {
  color: #b3884f;
  font-size: 12px;
  background: linear-gradient(to right, #f9f3ed, #f8e1be);
  padding: 5px;
  border-radius: 2px;
  transform: scale(0.8);
  position: absolute;
  top: 6px;
  right: 4px;
}

.el-tag--light {
  line-height: 24px;
  height: 24px;
}

</style>
