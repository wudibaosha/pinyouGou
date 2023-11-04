<template>
  <div>
    <div
      v-for="(item, index) in mainList"
      :key="index"
      class="expense-item">
      <flexbox class="expense-item-head">
        <div class="expense-item-head-title">报销费用明细（{{ index+1 }}）</div>
        <el-button
          v-if="index != 0"
          type="text"
          class="el-icon-delete expense-item-head-delete"
          @click="deleteItems(index)" />
      </flexbox>
      <flexbox
        wrap="wrap"
        align="stretch"
        class="clauses">
        <flexbox-item
          v-for="(subItem, subIndex) in showItems"
          :key="subIndex"
          :span="1/2"
          class="clauses-item">
          <div class="clauses-item-title">
            {{ subItem.name }}
          </div>
          <el-date-picker
            v-if="subItem.formType == 'datetime'"
            v-model="item[subItem.field]"
            type="datetime"
            value-format="yyyy-MM-dd HH:mm:ss"
            placeholder="选择日期"
            @change="valueChange" />
          <el-input-number
            v-else-if="subItem.formType == 'number'"
            v-model="item[subItem.field]"
            :controls="false"
            :precision="2"
            :min="0"
            @input="calculateValueChange(index, subIndex)" />
          <el-input
            v-else
            v-model="item[subItem.field]"
            :maxlength="100"
            type="text"
            @input="calculateValueChange(index, subIndex)" />
        </flexbox-item>
        <flexbox-item
          :span="1/2"
          class="clauses-item">
          <div class="sub-total">
            合计（元）：<span>{{ item['money'] }}</span>
          </div>
        </flexbox-item>
      </flexbox>
      <div class="description">
        <div class="description-title">费用明细描述</div>
        <el-input
          v-model="item['description']"
          :rows="3"
          :maxlength="300"
          type="textarea"
          resize="none"
          show-word-limit
          @input="valueChange" />
      </div>
      <div class="files">
        <el-button
          type="text"
          class="add-files"
          @click="addFiles(index)">上传发票图片</el-button>
        <flexbox wrap="wrap">
          <div
            v-for="(imgItem, imgIndex) in item['imgList']"
            :key="imgIndex"
            v-src:background-image="imgItem.url"
            class="img-item"
            @mouseover="mouseImgOver(imgItem, imgIndex, item['imgList'])"
            @mouseleave="mouseImgLeave(imgItem, imgIndex, item['imgList'])">
            <div
              v-if="imgItem.showDelete"
              class="img-delete"
              @click="deleteFile(imgItem, imgIndex, item['imgList'])">×</div>
          </div>
        </flexbox>
      </div>
    </div>
    <div class="handle-bar">
      <el-button
        class="handle-bar-button"
        type="text"
        @click="addItems(index)">添加事项</el-button>
        <!-- <div class="handle-bar-total">
        合计（元）：<span>{{totalMoney}}</span>
      </div> -->
    </div>
    <input
      id="image-file-input"
      type="file"
      accept="image/*"
      multiple
      @change="uploadImageFile">
  </div>
</template>
<script type="text/javascript">
import { crmFileSaveAPI, crmFileDeleteAPI } from '@/api/common'
import ObjMixin from '@/components/CreateCom/ObjMixin'
import { guid, floatAdd } from '@/utils'

export default {
  name: 'XhExpenses', // 差旅报销事项
  components: {},
  mixins: [ObjMixin],
  props: {},
  data() {
    return {
      mainList: [],
      imageIndex: -1,
      totalMoney: '0', // 合计
      showItems: [
        {
          field: 'startAddress',
          name: '出发城市',
          formType: 'text'
        },
        {
          field: 'endAddress',
          name: '目的城市',
          formType: 'text'
        },
        {
          field: 'startTime',
          name: '开始时间',
          formType: 'datetime'
        },
        {
          field: 'endTime',
          name: '结束时间',
          formType: 'datetime'
        },
        {
          field: 'traffic',
          name: '交通费（元）',
          formType: 'number'
        },
        {
          field: 'stay',
          name: '住宿费（元）',
          formType: 'number'
        },
        {
          field: 'diet',
          name: '餐饮费（元）',
          formType: 'number'
        },
        {
          field: 'other',
          name: '其他费用（元）',
          formType: 'number'
        }
      ]
    }
  },
  computed: {},
  watch: {
    value: function(val) {
      this.dataValue = val
      if (val.list && val.list.length > 0) {
        this.mainList = val.list
      } else {
        this.mainList.push(this.getValueItem())
      }
    }
  },
  mounted() {
    if (this.dataValue.list && this.dataValue.list.length > 0) {
      this.mainList = this.dataValue.list
    } else {
      this.mainList.push(this.getValueItem())
    }
  },
  methods: {
    addFiles(index) {
      this.imageIndex = index
      document.getElementById('image-file-input').click()
    },
    /** 图片选择出发 */
    uploadImageFile(event) {
      var files = event.target.files

      for (let index = 0; index < files.length; index++) {
        const file = files[index]
        crmFileSaveAPI({
          type: 'img',
          file: file,
          batchId: this.mainList[this.imageIndex].batchId
        })
          .then(res => {
            if (res) {
              this.mainList[this.imageIndex].imgList.push(res.data || {})
              this.submitValueChange()
            }
          })
          .catch(() => {})
      }
      event.target.value = ''
    },
    /** 鼠标移入和移除 图片区域 */
    mouseImgOver(item, index, items) {
      item.showDelete = true
      this.$set(items, index, item)
    },
    mouseImgLeave(item, index, items) {
      item.showDelete = false
      this.$set(items, index, item)
    },
    deleteFile(item, index, items) {
      this.$confirm('您确定要删除该文件吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          crmFileDeleteAPI({
            id: item.fileId
          })
            .then(res => {
              items.splice(index, 1)
              this.$message.success('操作成功')
            })
            .catch(() => {})
        })
        .catch(() => {})
    },
    deleteItems(index) {
      this.mainList.splice(index, 1)
      // 更新合计值
      this.updateTotalValue()
      this.submitValueChange(true)
    },
    addItems() {
      this.mainList.push(this.getValueItem())
    },
    valueChange() {
      this.submitValueChange(false)
    },
    // 值更新的回调
    calculateValueChange(mainIndex, subIndex) {
      if (subIndex < 2) {
        this.submitValueChange(false)
        return
      }
      var subTotal = 0
      const calculateFields = ['traffic', 'stay', 'diet', 'other']
      const mainItem = this.mainList[mainIndex]
      calculateFields.forEach(field => {
        subTotal = floatAdd(
          subTotal,
          parseFloat(mainItem[field] ? mainItem[field] : 0)
        )
      })
      mainItem.money = subTotal

      // 更新合计值
      this.updateTotalValue()

      this.submitValueChange(true)
    },

    /**
     * 更新合计
     */
    updateTotalValue() {
      let total = 0
      for (let index = 0; index < this.mainList.length; index++) {
        const element = this.mainList[index]
        total = floatAdd(
          total,
          parseFloat(element.money ? element.money : 0)
        )
      }
      this.totalMoney = total
    },

    submitValueChange(update) {
      this.$emit('value-change', {
        index: this.index,
        value: {
          list: this.mainList,
          update: update, // 是否更新总数
          money: this.totalMoney
        }
      })
    },
    getValueItem() {
      return {
        startAddress: '',
        endAddress: '',
        startTime: '',
        endTime: '',
        traffic: '',
        stay: '',
        diet: '',
        other: '',
        money: '0',
        description: '',
        imgList: [],
        batchId: guid()
      }
    }
  }
}
</script>
<style lang="scss" scoped>
.expense-item {
  padding-bottom: 15px;
  margin-bottom: 10px;
  border: $--border-width-medium solid $--border-color-base;
  border-radius: 2px;

  &-head {
    padding: 10px 20px;
    background-color: #f5f5f5;

    &-title {
      flex: 1;
      height: auto;
      line-height: normal;
    }

    &-delete {
      padding: 0 10px;
      cursor: pointer;
    }
  }
}

.clauses {
  padding: 10px;

  &-item {
    display: flex;
    padding: 0 10px 8px;
    margin-left: 0 !important;

    &-title {
      flex-shrink: 0;
      width: 90px;
    }

    .el-date-editor,
    .el-select {
      width: 100%;
    }

    .el-input-number {
      width: 100%;

      /deep/ .el-input__inner {
        padding: 0 8px;
        text-align: left;
      }
    }
  }
}

.sub-total {
  font-size: 12px;
}

.description {
  padding: 0 20px;

  &-title {
  }
}

.el-input /deep/ .el-input__inner {
  border-color: #ddd !important;
}

.el-select /deep/ .el-input__inner {
  border-color: #ddd !important;
}

.el-textarea /deep/ .el-textarea__inner {
  border-color: #ddd !important;
}

.el-input-number /deep/ .el-input__inner {
  border-color: #ddd !important;
}

.handle-bar {
  height: 29px;
  text-align: right;

  &-button {
    padding-right: 0;
    border: none;
  }

  &-total {
    margin-top: 10px;
    font-size: 13px;
    text-align: left;

    span {
      color: $--color-text-regular;
    }
  }
}

.files {
  padding: 0 20px;

  .add-files {
    padding-left: 0;
  }
}

.img-item {
  position: relative;
  display: inline-block;
  width: 98px;
  height: 98px;
  margin: 0 4px 4px 0;
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  border: 1px solid #ccc;

  .img-delete {
    position: absolute;
    top: 0;
    right: 0;
    width: 20px;
    height: 20px;
    font-size: 17px;
    line-height: 20px;
    color: white;
    text-align: center;
    cursor: pointer;
    background-color: $--color-text-regular;
  }
}

#image-file-input {
  display: none;
}
</style>
