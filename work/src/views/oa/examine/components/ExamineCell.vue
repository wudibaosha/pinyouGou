<template>
  <div class="list">
    <div class="list-content">
      <flexbox class="header">
        <template v-if="data.createUser">
          <xr-avatar
            :name="data.createUser.realname"
            :size="34"
            :src="data.createUser.img" />
          <div class="name-time">
            <span class="name">{{ data.createUser.realname }}</span>
            <span class="time">{{ data.createtime }}</span>
          </div>
        </template>
        <div class="rt-setting">
          <span
            :style="{ 'background-color': getStatusColor(data.examineStatus) }"
            class="bg-color" />
          <span class="dep">
            <span>{{ data.categoryTitle }} - </span>
            <span>{{ getStatusName(data.examineStatus) }}</span>
          </span>
          <!-- 编辑 -->
          <el-dropdown
            v-if="showHandle && data.permission && (data.permission.isCheck || data.permission.isUpdate || data.permission.isDelete)"
            trigger="click"
            @command="handleCommand">
            <i
              style="color: #cdcdcd; cursor: pointer;"
              class="el-icon-arrow-down el-icon-more" />
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item
                v-if="data.permission && data.permission.isCheck"
                command="withdraw">撤回</el-dropdown-item>
              <el-dropdown-item
                v-if="data.permission && data.permission.isUpdate"
                command="edit">编辑</el-dropdown-item>
              <el-dropdown-item
                v-if="data.permission && data.permission.isDelete"
                command="delete">删除</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
      </flexbox>
      <div
        class="row"
        @click="checkDetail(data)">
        <p
          v-if="data.content"
          class="text">{{ data.content }}</p>
        <p
          v-if="data.causeTitle"
          class="title">{{ data.causeTitle }}</p>
      </div>
      <div
        v-if="(data.file && data.file.length > 0) || (data.img && data.img.length > 0)"
        class="accessory">
        <!-- 图片 -->
        <div class="upload-img-box">
          <div
            v-for="(imgItem, k) in data.img"
            :key="k"
            class="img-list"
            @click="imgZoom(data.img, k)">
            <img v-src="imgItem.url">
          </div>
        </div>
        <!-- 附件 -->
        <file-cell :file-list="data.file" />
      </div>
      <!-- 相关信息 -->
      <div
        v-if="relatedListData.contacts.length > 0 || relatedListData.customer.length > 0 || relatedListData.business.length > 0 || relatedListData.contract.length > 0"
        class="related-business">
        <div class="label">相关信息</div>
        <div
          v-for="(items, key) in relatedListData"
          :key="key">
          <related-business-cell
            v-for="(item, itemIndex) in items"
            :key="itemIndex"
            :data="item"
            :cell-index="itemIndex"
            :type="key"
            :show-foot="false" />
        </div>
      </div>
    </div>
  </div>
</template>
<script type="text/javascript">
import RelatedBusinessCell from '@/components/RelatedBusinessCell'
import FileCell from '@/components/FileCell'
import CheckStatusMixin from '@/mixins/CheckStatusMixin'

export default {
  name: 'ExamineCell', // 审批cell
  components: {
    RelatedBusinessCell,
    FileCell
  },
  mixins: [CheckStatusMixin],
  props: {
    data: Object,
    showHandle: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {}
  },
  computed: {
    relatedListData() {
      return {
        contacts: (this.data.contactsList || []).map(item => {
          if (item.id) {
            item.contactsId = item.id
          }
          return item
        }),
        customer: (this.data.customerList || []).map(item => {
          if (item.id) {
            item.customerId = item.id
          }
          return item
        }),
        business: (this.data.businessList || []).map(item => {
          if (item.id) {
            item.businessId = item.id
          }
          return item
        }),
        contract: (this.data.contractList || []).map(item => {
          if (item.id) {
            item.contractId = item.id
          }
          return item
        })
      }
    }
  },
  watch: {},
  mounted() {},
  methods: {
    // 放大图片
    imgZoom(images, k) {
      this.$wkPreviewFile.preview({
        index: k,
        data: images
      })
    },
    // 编辑 删除 撤回
    handleCommand(command) {
      this.$emit('on-handle', { type: command, data: { item: this.data }})
    },
    // 查看详情
    checkDetail(data) {
      this.$emit('on-handle', { type: 'view', data: { item: this.data }})
    }
  }
}
</script>
<style lang="scss" scoped>
@import "../../styles/content.scss";

.list {
  margin-bottom: 20px;
  vertical-align: middle;

  .list-content {
    padding: 0 10px 10px 0;

    .header {
      margin-bottom: 15px;

      @include color9;

      font-size: 12px;

      .name-time {
        display: inline-block;
        flex: 1;
        margin-left: 13px;

        .name {
          display: block;
          margin-bottom: 5px;
          font-size: 15px;
          color: $--color-text-primary;
        }
      }

      .rt-setting {
        float: right;
        line-height: 30px;

        .dep {
          margin-right: 20px;
          color: $--color-text-primary;
        }

        img {
          width: 16px;

          @include cursor;
          @include v-align;
        }

        .bg-color {
          display: inline-block;
          width: 10px;
          height: 10px;
          margin-right: 5px;
          border-radius: 50%;
        }
      }
    }

    .row {
      line-height: 18px;
      color: #2362fb;
      letter-spacing: 0.5px;
      word-wrap: break-word;
      white-space: pre-wrap;
      cursor: pointer;

      .text {
        padding-bottom: 10px;
      }

      .title {
        @include color9;

        padding-bottom: 10px;
        font-size: 13px;
      }
    }

    .accessory {
      .upload-img-box {
        margin: 10px 0;

        .img-list {
          position: relative;
          display: inline-block;
          width: 80px;
          height: 60px;
          margin-right: 8px;
          margin-bottom: 8px;
          line-height: 60px;
          cursor: pointer;

          img {
            width: 80px;
            height: 60px;
          }

          .img-hover {
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            display: none;
            font-size: 12px;
            color: #fff;
            text-align: center;
            background-color: rgba(0, 0, 0, 0.5);

            span {
              @include cursor;

              display: inline-block;
            }
          }
        }

        .img-list:hover {
          .img-hover {
            display: inline-block;
          }
        }
      }
    }

    .related-business {
      margin: 15px 0;

      .label {
        margin-bottom: 7px;
        font-size: 13px;
        color: $--color-text-regular;
      }
    }
  }
}

.list:not(:last-child) {
  .list-content {
    border-bottom: 1px solid #e6e6e6;
  }
}
</style>
