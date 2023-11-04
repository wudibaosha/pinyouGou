<template>
  <el-dialog
    :visible.sync="showDialog"
    :close-on-click-modal="false"
    title="新建审批"
    width="750px"
    @close="closeView">
    <div class="title">可拖拽图标调整显示顺序（管理后台可自定义配置审批类型）</div>
    <div
      v-loading="loading"
      class="categorys">
      <draggable
        v-model="categorys"
        :options="{ dragClass: 'sortable-drag', forceFallback: false }"
        style="flex-wrap: wrap;"
        class="vux-flexbox"
        @end="draggableEnd">
        <flexbox
          v-for="(item, index) in categorys"
          :key="index"
          class="category-item"
          @click.native="selectCategorys(item)">
          <div
            :style="{ backgroundColor: item.iconColor }"
            class="category-icon">
            <i :class="item.iconClass" />
          </div>
          <div class="category-label ">{{ item.categoryTitle }}</div>
        </flexbox>
      </draggable>
    </div>
  </el-dialog>
</template>

<script>
import { examinesQueryPartListAPI } from '@/api/examine'
import { oaAllExamineCategorySortAPI } from '@/api/oa/examine'

import Draggable from 'vuedraggable'

export default {
  name: 'ExamineCategorySelect',
  components: {
    Draggable
  },
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      loading: false,
      showDialog: false,
      categorys: []
    }
  },
  watch: {
    show: function(val) {
      this.showDialog = val
      if (this.categorys && this.categorys.length == 0) {
        this.getDetail()
      }
    }
  },
  mounted() {},
  methods: {
    /**
     * 审批类型列表
     */
    getDetail() {
      this.loading = true
      examinesQueryPartListAPI({
        pageType: 0,
        label: 0 // oa
      })
        .then(res => {
          this.loading = false
          const resData = res.data || {}
          const list = resData.list || []
          this.categorys = list.map(item => {
            const temps = item.examineIcon ? item.examineIcon.split(',') : []
            item.categoryTitle = item.examineName
            item.categoryId = item.examineId
            if (temps.length > 1) {
              item.iconClass = temps[0]
              item.iconColor = temps[1]
            } else {
              item.iconClass = 'wk wk-approve'
              item.iconColor = '#9376FF'
            }
            return item
          })
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 审批类型选择
     */
    selectCategorys(item) {
      this.$emit('select', item)
      this.$emit('close')
    },

    /**
     * 关闭操作
     */
    closeView() {
      this.$emit('close')
    },

    /**
     * 拖拽结束
     */
    draggableEnd() {
      oaAllExamineCategorySortAPI(this.categorys.map(item => {
        return { categoryId: item.categoryId }
      }))
        .then(res => {})
        .catch(() => {})
    }
  }
}
</script>

<style scoped lang="scss">
.title {
  position: absolute;
  top: 55px;
  left: 25px;
  font-size: 12px;
  color: #ccc;
}

.categorys {
  height: 250px;
  overflow-y: auto;

  .category-item {
    flex: 0 0 31%;
    padding: 10px;
    margin: 5px;
    text-align: center;
    cursor: pointer;
    background-color: #f6f6f6;
    border-radius: $--border-radius-base;
  }

  .category-item:hover {
    background-color: #eef1f8;
  }

  .category-icon {
    width: 40px;
    height: 40px;
    line-height: 40px;
    border-radius: $--border-radius-base;

    .wk {
      font-size: 24px;
      color: white;
    }
  }

  .category-label {
    display: box;
    flex: 1;
    padding-left: 10px;
    overflow: hidden;
    font-size: 14px;
    text-align: left;
    text-overflow: ellipsis;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
}
</style>
