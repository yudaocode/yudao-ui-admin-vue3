<template>
  <el-form label-width="80px" :model="formData">
    <el-form-item label="选择模板" prop="swiperType">
      <el-radio-group v-model="formData.swiperType">
        <el-tooltip class="item" content="一行一个" placement="bottom">
          <el-radio-button :label="0">
            <Icon icon="icon-park-twotone:multi-picture-carousel" />
          </el-radio-button>
        </el-tooltip>
        <el-tooltip class="item" content="轮播海报" placement="bottom">
          <el-radio-button :label="1">
            <Icon icon="system-uicons:carousel" />
          </el-radio-button>
        </el-tooltip>
        <el-tooltip class="item" content="多图单行" placement="bottom">
          <el-radio-button :label="2">
            <Icon icon="icon-park-twotone:carousel" />
          </el-radio-button>
        </el-tooltip>
        <el-tooltip class="item" content="立体轮播" placement="bottom">
          <el-radio-button :label="3">
            <Icon icon="ic:round-view-carousel" />
          </el-radio-button>
        </el-tooltip>
      </el-radio-group>
    </el-form-item>

    <el-text tag="p">添加图片</el-text>
    <el-text type="info" size="small"> 拖动左上角的小圆点可对其排序 </el-text>

    <!-- 图片广告 -->
    <div v-if="formData.items[0]">
      <draggable
        :list="formData.items"
        :force-fallback="true"
        :animation="200"
        handle=".drag-icon"
        class="m-t-8px"
      >
        <template #item="{ element, index }">
          <div class="mb-4px flex flex-row gap-4px rounded bg-gray-100 p-8px">
            <div class="flex flex-col items-start justify-between">
              <Icon icon="ic:round-drag-indicator" class="drag-icon cursor-move" />
              <Icon
                icon="ep:delete"
                class="cursor-pointer text-red-5"
                @click="handleDeleteImage(index)"
                v-if="formData.items.length > 1"
              />
            </div>
            <div class="flex flex-1 flex-col items-center justify-between gap-8px">
              <UploadImg
                v-model="element.imgUrl"
                draggable="false"
                height="80px"
                width="100%"
                class="min-w-80px"
              />
              <!-- 标题 -->
              <el-input v-model="element.title" placeholder="标题，选填" />
              <!-- 输入链接 -->
              <el-input placeholder="链接，选填" v-model="element.link" />
            </div>
          </div>
        </template>
      </draggable>
    </div>
    <el-button @click="handleAddImage" type="primary" plain class="w-full"> 添加图片 </el-button>
    <el-form-item label="一行个数" prop="rowIndividual" v-show="formData.swiperType === 2">
      <!-- 单选框 -->
      <el-radio-group v-model="formData.rowIndividual">
        <el-radio :label="2">2个</el-radio>
        <el-radio :label="3">3个</el-radio>
        <el-radio :label="4">4个</el-radio>
        <el-radio :label="5">5个</el-radio>
        <el-radio :label="6">6个</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item label="分页类型" prop="pagingType">
      <el-radio-group v-model="formData.pagingType">
        <el-radio :label="0">不显示</el-radio>
        <el-radio label="bullets">样式一</el-radio>
        <el-radio label="fraction">样式二</el-radio>
        <el-radio label="progressbar">样式三</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item label="图片圆角" prop="borderRadius">
      <el-slider v-model="formData.borderRadius" :max="30" />
    </el-form-item>
    <el-form-item label="页面边距" prop="pageMargin" v-show="formData.swiperType === 0">
      <el-slider v-model="formData.pageMargin" :max="20" />
    </el-form-item>
    <el-form-item
      label="图片边距"
      prop="imageMargin"
      v-show="formData.swiperType === 0 || formData.swiperType === 2"
    >
      <el-slider v-model="formData.imageMargin" :max="20" />
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable' //拖拽组件
import { CarouselItemProperty, CarouselProperty } from './config'
import { usePropertyForm } from '@/components/DiyEditor/util'

// 轮播图属性面板
defineOptions({ name: 'CarouselProperty' })

const props = defineProps<{ modelValue: CarouselProperty }>()
const emit = defineEmits(['update:modelValue'])
const { formData } = usePropertyForm(props.modelValue, emit)

// 添加图片
const handleAddImage = () => {
  formData.value.items.push({} as CarouselItemProperty)
}
// 删除图片
const handleDeleteImage = (index) => {
  formData.value.items.splice(index, 1)
}
</script>

<style scoped lang="scss"></style>
