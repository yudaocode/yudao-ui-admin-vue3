<!-- 产品的物模型表单（event、service 项里的参数） -->
<template>
  <div
    v-for="(item, index) in thingModelParams"
    :key="index"
    class="w-1/1 param-item flex justify-between px-10px mb-10px"
  >
    <span>参数名称：{{ item.name }}</span>
    <div class="btn">
      <el-button link type="primary" @click="openParamForm(item)">编辑</el-button>
      <el-divider direction="vertical" />
      <el-button link type="danger" @click="deleteParamItem(index)">删除</el-button>
    </div>
  </div>
  <el-button link type="primary" @click="openParamForm(null)">+新增参数</el-button>

  <!-- param 表单 -->
  <Dialog v-model="dialogVisible" :title="dialogTitle" append-to-body>
    <el-form
      ref="paramFormRef"
      v-loading="formLoading"
      :model="formData"
      :rules="ThingModelFormRules"
      label-width="100px"
    >
      <el-form-item label="参数名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入功能名称" />
      </el-form-item>
      <el-form-item label="标识符" prop="identifier">
        <el-input v-model="formData.identifier" placeholder="请输入标识符" />
      </el-form-item>
      <!-- 属性配置 -->
      <ThingModelProperty v-model="formData.property" is-params />
    </el-form>

    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { useVModel } from '@vueuse/core'
import ThingModelProperty from './ThingModelProperty.vue'
import { DataSpecsDataType, ThingModelFormRules } from './config'
import { isEmpty } from '@/utils/is'

/** 输入输出参数配置组件 */
defineOptions({ name: 'ThingModelInputOutputParam' })

const props = defineProps<{ modelValue: any; direction: string }>()
const emits = defineEmits(['update:modelValue'])
const thingModelParams = useVModel(props, 'modelValue', emits) as Ref<any[]>
const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('新增参数') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const paramFormRef = ref() // 表单 ref
const formData = ref<any>({
  dataType: DataSpecsDataType.INT,
  property: {
    dataType: DataSpecsDataType.INT,
    dataSpecs: {
      dataType: DataSpecsDataType.INT
    }
  }
})

/** 打开 param 表单 */
const openParamForm = (val: any) => {
  dialogVisible.value = true
  resetForm()
  if (isEmpty(val)) {
    return
  }
  // 编辑时回显数据
  formData.value = {
    identifier: val.identifier,
    name: val.name,
    description: val.description,
    property: {
      dataType: val.dataType,
      dataSpecs: val.dataSpecs,
      dataSpecsList: val.dataSpecsList
    }
  }
}

/** 删除 param 项 */
const deleteParamItem = (index: number) => {
  thingModelParams.value.splice(index, 1)
}

/** 添加参数 */
const submitForm = async () => {
  // 初始化参数列表
  if (isEmpty(thingModelParams.value)) {
    thingModelParams.value = []
  }
  // 校验参数
  await paramFormRef.value.validate()
  try {
    const data = unref(formData)
    // 构建数据对象
    const item = {
      identifier: data.identifier,
      name: data.name,
      description: data.description,
      dataType: data.property.dataType,
      paraOrder: 0, // TODO @puhui999: 先写死默认看看后续
      direction: props.direction,
      dataSpecs:
        !!data.property.dataSpecs && Object.keys(data.property.dataSpecs).length > 1
          ? data.property.dataSpecs
          : undefined,
      dataSpecsList: isEmpty(data.property.dataSpecsList) ? undefined : data.property.dataSpecsList
    }

    // 查找是否已有相同 identifier 的项
    const existingIndex = thingModelParams.value.findIndex(
      (spec) => spec.identifier === data.identifier
    )
    if (existingIndex > -1) {
      // 更新已有项
      thingModelParams.value[existingIndex] = item
    } else {
      // 添加新项
      thingModelParams.value.push(item)
    }
  } finally {
    // 隐藏对话框
    dialogVisible.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    dataType: DataSpecsDataType.INT,
    property: {
      dataType: DataSpecsDataType.INT,
      dataSpecs: {
        dataType: DataSpecsDataType.INT
      }
    }
  }
  paramFormRef.value?.resetFields()
}
</script>

<style lang="scss" scoped>
.param-item {
  background-color: #e4f2fd;
}
</style>
