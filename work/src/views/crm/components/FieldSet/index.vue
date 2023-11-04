<template>
  <el-popover
    v-model="show"
    popper-class="no-padding-popover"
    placement="bottom-end"
    width="240"
    trigger="click"
    class="field-set-wrap">
    <div class="field-set">
      <el-input
        v-model="search"
        class="field-set__search"
        placeholder="搜索字段（拖拽字段进行排序）"
        @input="searchClick" />

      <div class="field-set__title">显示这些字段</div>
      <div v-loading="loading" class="field-set__content">
        <flexbox
          v-for="(item, index) in disabledFields"
          v-show="(poolConfig != 1 && item.fieldName !== 'poolDay') || poolConfig == 1"
          :key="index"
          class="field-set__content--item ">
          <el-checkbox v-model="item.check">
            <span v-if="item.center">{{ item.left }}<span class="input-word">{{ item.center }}</span>{{ item.right }}</span>
            <span v-else>{{ item.name }}</span>
          </el-checkbox>
        </flexbox>
        <draggable
          v-model="dragFields"
          :options="{
            filter: '.el-checkbox',
            handle: '.drag-handle'
          }">
          <flexbox
            v-for="(item, index) in dragFields"
            v-show="(poolConfig != 1 && item.fieldName !== 'poolDay') || poolConfig == 1"
            :key="index"
            class="field-set__content--item ">
            <el-checkbox v-model="item.check">
              <span v-if="item.center">{{ item.left }}<span class="input-word">{{ item.center }}</span>{{ item.right }}</span>
              <span v-else>{{ item.name }}</span>
            </el-checkbox>
            <div class="drag-handle">⋮⋮</div>
          </flexbox>
        </draggable>
      </div>

      <div class="field-set__ft">
        <el-button type="primary" size="medium" @click="save">保存</el-button>
        <el-button size="medium" type="text" @click="reSet">重置</el-button>
      </div>
    </div>
    <slot v-if="$slots.reference" slot="reference" @click="show = !show" />
    <el-button
      v-else
      slot="reference"
      :type="show ? 'selected' : ''"
      icon="wk wk-icon-config-line"
      class="set-btn"
      @click="show = !show" />
  </el-popover>
</template>

<script>
import {
  crmFieldConfigAPIIndexAPI,
  crmPoolFieldConfigIndexAPI,
  crmFieldConfigAPI,
  crmPoolFieldConfigAPI
} from '@/api/crm/common'
import crmTypeModel from '@/views/crm/model/crmTypeModel'
import { objDeepCopy } from '@/utils'
import Draggable from 'vuedraggable'

export default {
  /** 字段管理 */
  name: 'FieldSet',
  components: {
    Draggable
  },
  props: {
    crmType: String,

    isSeas: {
      type: Boolean,
      default: false
    },

    poolId: [String, Number]
  },
  data() {
    return {
      loading: false,
      show: false,
      poolConfig: 1, // 1 公海规则打开  0 未打开
      fields: [],
      disabledFields: [],
      dragFields: [],
      // 用于重置
      copyfields: [],
      search: ''
    }
  },
  computed: {
    // showFields() {
    //   if (this.search) {
    //     return this.fields.filter(item => {
    //       return item.name.indexOf(this.search) != -1
    //     })
    //   }
    //   return this.fields
    // }
  },
  watch: {
    show(val) {
      if (val) {
        this.getList()
      }
    },

    poolId() {
      this.fields = []
      if (this.show) {
        this.getList()
      }
    }
  },
  mounted() {},

  beforeDestroy() {},
  methods: {
    /**
     * 获取数据
     */
    getList() {
      this.loading = this.fields.length == 0
      let request = null
      const params = {}
      if (this.isSeas) {
        request = crmPoolFieldConfigIndexAPI
        params.poolId = this.poolId
      } else {
        request = crmFieldConfigAPIIndexAPI
        params.label = crmTypeModel[this.crmType]
      }

      request(params)
        .then(res => {
          const resData = res.data || {}
          this.poolConfig = resData.poolConfig
          const showList = (resData.value || []).map(item => {
            item.left = ''
            item.center = ''
            item.right = ''
            item.check = true
            return item
          })
          const hideList = (resData.hideValue || []).map(item => {
            item.left = ''
            item.center = ''
            item.right = ''
            item.check = false
            return item
          })
          this.fields = showList.concat(hideList)
          this.getShowFields(this.fields)
          this.copyfields = objDeepCopy(this.fields)
          this.loading = false
        })
        .catch(() => {
          this.loading = false
        })
    },

    /**
     * 获取展示数组
     */
    getShowFields(list) {
      let isDrag = false
      const disabledFields = []
      const dragFields = []
      list.forEach(item => {
        if (item.isLock !== 1) {
          isDrag = true
        }
        if (isDrag) {
          dragFields.push(item)
        } else {
          disabledFields.push(item)
        }
      })

      this.dragFields = dragFields
      this.disabledFields = disabledFields
    },

    /**
     * 搜索操作
     */
    searchClick() {
      this.fields = this.fields.map(item => {
        const index = item.name.indexOf(this.search)
        if (index != -1) {
          item.left = item.name.substr(0, index)
          item.center = item.name.substr(index, this.search.length)
          const rightIndex = index + this.search.length
          item.right = item.name.substr(rightIndex, item.name.length - rightIndex)
        } else {
          item.left = ''
          item.center = ''
          item.right = ''
        }
        return item
      })
    },

    /**
     * 保存更改
     */
    save() {
      const allFields = this.disabledFields.concat(this.dragFields)
      const noHideFields = allFields.filter(item => item.check)
      if (noHideFields.length < 2) {
        this.$message.error('至少要显示两列')
      } else {
        const hideFields = allFields.filter(item => !item.check)
        this.loading = true
        let request = null
        const params = {
          noHideFields: noHideFields
            .map(item => {
              return {
                id: item.id,
                fieldName: item.fieldName,
                style: item.style
              }
            }),
          hideFields: hideFields
            .map(item => {
              return {
                id: item.id,
                fieldName: item.fieldName,
                style: item.style
              }
            }) }
        if (this.isSeas) {
          request = crmPoolFieldConfigAPI
          params.poolId = this.poolId
        } else {
          request = crmFieldConfigAPI
          params.label = crmTypeModel[this.crmType]
        }

        request(params)
          .then(res => {
            this.$message.success('操作成功')
            this.show = false
            this.loading = false
            this.$emit('change')
          })
          .catch(() => {
            this.loading = false
          })
      }
    },

    /**
     * 重置
     */
    reSet() {
      this.fields = objDeepCopy(this.copyfields)
      this.getShowFields(this.fields)
    }
  }
}
</script>

<style lang="scss" scoped>
.field-set {
  &__search {
    padding: 8px 10px 0;
  }

  &__title {
    padding: 15px 15px 0;
    font-size: 12px;
    color: $--color-n200;
  }

  &__content {
    min-height: 100px;
    max-height: 250px;
    overflow: auto;

    &--item {
      padding: 0 15px;
      line-height: 34px;

      .el-checkbox {
        flex: 1;
      }

      .drag-handle {
        display: none;
        flex-shrink: 0;
        margin-left: 8px;
        font-weight: bold;
        cursor: move;
      }
    }

    &--item:hover {
      background-color: $--color-b50;

      .drag-handle {
        display: inline-block;
      }
    }
  }

  &__ft {
    padding: 8px;
    margin-top: 10px;
    overflow: hidden;
    overflow-y: overlay;
    font-size: 0;
    text-align: right;
  }
}

.set-btn {
  padding: 11px 8px;
  font-size: 16px;
}

// 搜索到的字
.input-word {
  color: white;
  background-color: $--color-primary;
}

// /deep/ .el-checkbox {
//   .el-checkbox__input.is-checked {
//     .el-checkbox__inner {
//       background-color: $--color-b300;
//       border-color: $--color-b300;
//     }
//   }
// }
</style>
