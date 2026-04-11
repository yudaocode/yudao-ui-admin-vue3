<template>
  <div class="relative" style="width: 100%; height: 700px">
    <Tinyflow
      v-if="workflowData"
      ref="tinyflowRef"
      :className="'custom-class'"
      :style="{ width: '100%', height: '100%' }"
      :data="workflowData"
      :provider="provider"
    />
    <div class="absolute top-30px right-30px">
      <el-button @click="testWorkflowModel" type="primary" v-hasPermi="['ai:workflow:test']">
        测试
      </el-button>
    </div>

    <!-- 测试窗口 -->
    <el-drawer v-model="showTestDrawer" title="工作流测试" :modal="false">
      <fieldset>
        <legend class="ml-15px"><h3>运行参数配置</h3></legend>
        <div class="p-20px">
          <div
            class="flex justify-around mb-10px"
            v-for="(param, index) in params4Test"
            :key="index"
          >
            <el-select class="w-200px!" v-model="param.key" placeholder="参数名">
              <el-option
                v-for="(value, key) in paramsOfStartNode"
                :key="key"
                :label="value?.description || key"
                :value="key"
                :disabled="!!value?.disabled"
              />
            </el-select>
            <el-input class="w-200px!" v-model="param.value" placeholder="参数值" />
            <el-button type="danger" plain :icon="Delete" circle @click="removeParam(index)" />
          </div>
          <!-- TODO @lesan：是不是不用添加和删除参数，直接把必填和选填列出来，然后加上参数校验？ -->
          <el-button type="primary" plain @click="addParam">添加参数</el-button>
        </div>
      </fieldset>
      <fieldset class="mt-20px bg-#f8f9fa">
        <legend class="ml-15px"><h3>运行结果</h3></legend>
        <div class="p-20px">
          <div v-if="loading"> <el-text type="primary">执行中...</el-text></div>
          <div v-else-if="error">
            <el-text type="danger">{{ error }}</el-text>
          </div>
          <pre v-else-if="testResult" class="result-content"
            >{{ JSON.stringify(testResult, null, 2) }}
          </pre>
          <div v-else> <el-text type="info">点击运行查看结果</el-text> </div>
        </div>
      </fieldset>
      <el-button class="mt-20px w-100%" size="large" type="success" @click="goRun">
        运行流程
      </el-button>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import Tinyflow from '@/components/Tinyflow/Tinyflow.vue'
import * as WorkflowApi from '@/api/ai/workflow'
// TODO @lesan：要不使用 ICon 哪个组件哈
import { Delete } from '@element-plus/icons-vue'

defineProps<{
  provider: any
}>()

const tinyflowRef = ref()
const workflowData = inject('workflowData') as Ref
const showTestDrawer = ref(false)
const params4Test = ref([])
const paramsOfStartNode = ref({})
const testResult = ref(null)
const loading = ref(false)
const error = ref(null)

/** 展示工作流测试抽屉 */
const testWorkflowModel = () => {
  showTestDrawer.value = !showTestDrawer.value
}

/** 运行流程 */
const goRun = async () => {
  try {
    const val = tinyflowRef.value.getData()
    loading.value = true
    error.value = null
    testResult.value = null
    /// 查找start节点
    const startNode = getStartNode()

    // 获取参数定义
    const parameters = startNode.data?.parameters || []
    const paramDefinitions = {}
    parameters.forEach((param) => {
      paramDefinitions[param.name] = param.dataType
    })

    // 参数类型转换
    const convertedParams = {}
    for (const { key, value } of params4Test.value) {
      const paramKey = key.trim()
      if (!paramKey) continue

      let dataType = paramDefinitions[paramKey]
      if (!dataType) {
        dataType = 'String'
      }

      try {
        convertedParams[paramKey] = convertParamValue(value, dataType)
      } catch (e) {
        throw new Error(`参数 ${paramKey} 转换失败: ${e.message}`)
      }
    }

    const data = {
      graph: JSON.stringify(val),
      params: convertedParams
    }

    const response = await WorkflowApi.testWorkflow(data)
    testResult.value = response
  } catch (err) {
    error.value = err.response?.data?.message || '运行失败，请检查参数和网络连接'
  } finally {
    loading.value = false
  }
}

/** 监听测试抽屉的开启，获取开始节点参数列表 */
watch(showTestDrawer, (value) => {
  if (!value) return

  /// 查找start节点
  const startNode = getStartNode()

  // 获取参数定义
  const parameters = startNode.data?.parameters || []
  const paramDefinitions = {}

  // 加入参数选项方便用户添加非必须参数
  parameters.forEach((param) => {
    paramDefinitions[param.name] = param
  })

  function mergeIfRequiredButNotSet(target) {
    let needPushList = []
    for (let key in paramDefinitions) {
      let param = paramDefinitions[key]

      if (param.required) {
        let item = target.find((item) => item.key === key)

        if (!item) {
          needPushList.push({ key: param.name, value: param.defaultValue || '' })
        }
      }
    }
    target.push(...needPushList)
  }
  // 自动装载需必填的参数
  mergeIfRequiredButNotSet(params4Test.value)

  paramsOfStartNode.value = paramDefinitions
})

/** 获取开始节点 */
const getStartNode = () => {
  const val = tinyflowRef.value.getData()
  const startNode = val.nodes.find((node) => node.type === 'startNode')
  if (!startNode) {
    throw new Error('流程缺少开始节点')
  }
  return startNode
}

/** 添加参数项 */
const addParam = () => {
  params4Test.value.push({ key: '', value: '' })
}

/** 删除参数项 */
const removeParam = (index) => {
  params4Test.value.splice(index, 1)
}

/** 类型转换函数 */
const convertParamValue = (value, dataType) => {
  if (value === '') return null // 空值处理

  switch (dataType) {
    case 'String':
      return String(value)
    case 'Number':
      const num = Number(value)
      if (isNaN(num)) throw new Error('非数字格式')
      return num
    case 'Boolean':
      if (value.toLowerCase() === 'true') return true
      if (value.toLowerCase() === 'false') return false
      throw new Error('必须为 true/false')
    case 'Object':
    case 'Array':
      try {
        return JSON.parse(value)
      } catch (e) {
        throw new Error(`JSON格式错误: ${e.message}`)
      }
    default:
      throw new Error(`不支持的类型: ${dataType}`)
  }
}

/** 表单校验 */
const validate = async () => {
  try {
    // 获取最新的流程数据
    if (!workflowData.value) {
      throw new Error('请设计流程')
    }
    workflowData.value = tinyflowRef.value.getData()
    return true
  } catch (error) {
    throw error
  }
}
defineExpose({
  validate
})
</script>

<style lang="css" scoped>
.result-content {
  background: white;
  padding: 12px;
  border-radius: 4px;
  max-height: 300px;
  overflow: auto;
  font-family: Monaco, Consolas, monospace;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
}
</style>
