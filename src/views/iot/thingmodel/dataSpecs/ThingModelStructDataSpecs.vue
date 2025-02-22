<!-- dataType：struct 数组类型 -->
<template>
  <!-- struct 数据展示 -->
  <el-form-item
    :rules="[{ required: true, validator: validateList, trigger: 'change' }]"
    label="JSON 对象"
  >
    <div
      v-for="(item, index) in dataSpecsList"
      :key="index"
      class="w-1/1 struct-item flex justify-between px-10px mb-10px"
    >
      <span>参数名称：{{ item.name }}</span>
      <div class="btn">
        <el-button link type="primary" @click="openStructForm(item)">编辑</el-button>
        <el-divider direction="vertical" />
        <el-button link type="danger" @click="deleteStructItem(index)">删除</el-button>
      </div>
    </div>
    <el-button link type="primary" @click="openStructForm(null)">+新增参数</el-button>
  </el-form-item>

  <!-- struct 表单 -->
  <Dialog v-model="dialogVisible" :title="dialogTitle" append-to-body>
    <el-form
      ref="structFormRef"
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
      <ThingModelProperty v-model="formData.property" is-struct-data-specs />
    </el-form>

    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { useVModel } from '@vueuse/core'
import ThingModelProperty from '../ThingModelProperty.vue'
import { DataSpecsDataType, ThingModelFormRules } from '../config'
import { isEmpty } from '@/utils/is'

/** Struct 型的 dataSpecs 配置组件 */
defineOptions({ name: 'ThingModelStructDataSpecs' })

const props = defineProps<{ modelValue: any }>()
const emits = defineEmits(['update:modelValue'])
const dataSpecsList = useVModel(props, 'modelValue', emits) as Ref<any[]>
const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('新增参数') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const structFormRef = ref() // 表单 ref
const formData = ref<any>({
  property: {
    dataType: DataSpecsDataType.INT,
    dataSpecs: {
      dataType: DataSpecsDataType.INT
    }
  }
})

/** 打开 struct 表单 */
const openStructForm = (val: any) => {
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
      dataType: val.childDataType,
      dataSpecs: val.dataSpecs,
      dataSpecsList: val.dataSpecsList
    }
  }
}

/** 删除 struct 项 */
const deleteStructItem = (index: number) => {
  dataSpecsList.value.splice(index, 1)
}

/** 添加参数 */
const submitForm = async () => {
  await structFormRef.value.validate()

  try {
    const data = unref(formData)
    // 构建数据对象
    const item = {
      identifier: data.identifier,
      name: data.name,
      description: data.description,
      dataType: DataSpecsDataType.STRUCT,
      childDataType: data.property.dataType,
      dataSpecs:
        !!data.property.dataSpecs && Object.keys(data.property.dataSpecs).length > 1
          ? data.property.dataSpecs
          : undefined,
      dataSpecsList: isEmpty(data.property.dataSpecsList) ? undefined : data.property.dataSpecsList
    }

    // 查找是否已有相同 identifier 的项
    const existingIndex = dataSpecsList.value.findIndex(
      (spec) => spec.identifier === data.identifier
    )
    if (existingIndex > -1) {
      // 更新已有项
      dataSpecsList.value[existingIndex] = item
    } else {
      // 添加新项
      dataSpecsList.value.push(item)
    }
  } finally {
    // 隐藏对话框
    dialogVisible.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    property: {
      dataType: DataSpecsDataType.INT,
      dataSpecs: {
        dataType: DataSpecsDataType.INT
      }
    }
  }
  structFormRef.value?.resetFields()
}

/** 校验 struct 不能为空 */
const validateList = (_: any, __: any, callback: any) => {
  if (isEmpty(dataSpecsList.value)) {
    callback(new Error('struct 不能为空'))
    return
  }
  callback()
}

/** 组件初始化 */
onMounted(async () => {
  await nextTick()
  // 预防 dataSpecsList 空指针
  isEmpty(dataSpecsList.value) && (dataSpecsList.value = [])
})
</script>

<style lang="scss" scoped>
.struct-item {
  background-color: #e4f2fd;
}
</style>
