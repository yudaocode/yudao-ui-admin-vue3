<template>
  <div class="flex flex-wrap items-center gap-8px">
    <div v-for="(spu, index) in productSpus" :key="spu.id" class="select-box spu-pic">
      <el-tooltip :content="spu.name">
        <div class="relative h-full w-full">
          <el-image :src="spu.picUrl" class="h-full w-full" />
          <Icon
            v-show="!disabled"
            class="del-icon"
            icon="ep:circle-close-filled"
            @click="handleRemoveSpu(index)"
          />
        </div>
      </el-tooltip>
    </div>
    <el-tooltip content="选择商品" v-if="canAdd">
      <div class="select-box" @click="openSpuTableSelect">
        <Icon icon="ep:plus" />
      </div>
    </el-tooltip>
  </div>
  <!-- 商品选择对话框（表格形式） -->
  <SpuTableSelect ref="spuTableSelectRef" :multiple="limit != 1" @change="handleSpuSelected" />
</template>
<script lang="ts" setup>
import * as ProductSpuApi from '@/api/mall/product/spu'
import SpuTableSelect from '@/views/mall/product/spu/components/SpuTableSelect.vue'
import { propTypes } from '@/utils/propTypes'
import { oneOfType } from 'vue-types'
import { isArray } from '@/utils/is'

// 商品橱窗，一般用于与商品建立关系时使用
// 提供功能：展示商品列表、添加商品、移除商品
defineOptions({ name: 'SpuShowcase' })

const props = defineProps({
  modelValue: oneOfType<number | Array<number>>([Number, Array]).isRequired,
  // 限制数量：默认不限制
  limit: propTypes.number.def(Number.MAX_VALUE),
  disabled: propTypes.bool.def(false)
})

// 计算是否可以添加
const canAdd = computed(() => {
  // 情况一：禁用时不可以添加
  if (props.disabled) return false
  // 情况二：未指定限制数量时，可以添加
  if (!props.limit) return true
  // 情况三：检查已添加数量是否小于限制数量
  return productSpus.value.length < props.limit
})

// 商品列表
const productSpus = ref<ProductSpuApi.Spu[]>([])

watch(
  () => props.modelValue,
  async () => {
    const ids = isArray(props.modelValue)
      ? // 情况一：多选
        props.modelValue
      : // 情况二：单选
        props.modelValue
        ? [props.modelValue]
        : []
    // 不需要返显
    if (ids.length === 0) {
      productSpus.value = []
      return
    }
    // 只有商品发生变化之后，才去查询商品
    if (productSpus.value.length === 0 || productSpus.value.some((spu) => !ids.includes(spu.id!))) {
      productSpus.value = await ProductSpuApi.getSpuDetailList(ids)
    }
  },
  { immediate: true }
)

/** 商品表格选择对话框 */
const spuTableSelectRef = ref()
// 打开对话框
const openSpuTableSelect = () => {
  spuTableSelectRef.value.open(productSpus.value)
}

/**
 * 选择商品后触发
 * @param spus 选中的商品列表
 */
const handleSpuSelected = (spus: ProductSpuApi.Spu | ProductSpuApi.Spu[]) => {
  productSpus.value = isArray(spus) ? spus : [spus]
  emitSpuChange()
}

/**
 * 删除商品
 * @param index 商品索引
 */
const handleRemoveSpu = (index: number) => {
  productSpus.value.splice(index, 1)
  emitSpuChange()
}
const emit = defineEmits(['update:modelValue', 'change'])
const emitSpuChange = () => {
  if (props.limit === 1) {
    const spu = productSpus.value.length > 0 ? productSpus.value[0] : null
    emit('update:modelValue', spu?.id || 0)
    emit('change', spu)
  } else {
    emit(
      'update:modelValue',
      productSpus.value.map((spu) => spu.id)
    )
    emit('change', productSpus.value)
  }
}
</script>

<style lang="scss" scoped>
.select-box {
  display: flex;
  width: 60px;
  height: 60px;
  border: 1px dashed var(--el-border-color-darker);
  border-radius: 8px;
  align-items: center;
  justify-content: center;
}

.spu-pic {
  position: relative;
}

.del-icon {
  position: absolute;
  top: -10px;
  right: -10px;
  z-index: 1;
  width: 20px !important;
  height: 20px !important;
}
</style>
