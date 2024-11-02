<template>
  <!-- 第一步，通过流程定义的列表，选择对应的流程 -->
  <ContentWrap
    class="process-definition-container position-relative pb-20px"
    v-if="!selectProcessDefinition"
    v-loading="loading"
  >
    <el-row :gutter="20" class="!flex-nowrap">
      <el-col :span="5">
        <div class="flex flex-col">
          <div
            v-for="category in categoryList"
            :key="category.code"
            class="flex items-center p-10px cursor-pointer text-14px rounded-md"
            :class="categoryActive.code === category.code ? 'text-#3e7bff bg-#e8eeff' : ''"
            @click="handleCategoryClick(category)"
          >
            {{ category.name }}
          </div>
        </div>
      </el-col>
      <el-col :span="19">
        <h3 class="text-16px font-bold mb-10px mt-5px">{{ categoryActive.name }}</h3>
        <div class="grid grid-cols-3 gap3" v-if="categoryProcessDefinitionList.length">
          <el-card
            v-for="definition in categoryProcessDefinitionList"
            :key="definition.id"
            shadow="hover"
            class="cursor-pointer definition-item-card"
            @click="handleSelect(definition)"
          >
            <template #default>
              <div class="flex">
                <el-image :src="definition.icon" class="w-32px h-32px" />
                <el-text class="!ml-10px" size="large">{{ definition.name }}</el-text>
              </div>
            </template>
          </el-card>
        </div>
        <el-empty v-else />
      </el-col>
    </el-row>
  </ContentWrap>

  <!-- 第二步，填写表单，进行流程的提交 -->
  <ProcessDefinitionDetail
    v-else
    ref="processDefinitionDetailRef"
    :selectProcessDefinition="selectProcessDefinition"
    @cancel="selectProcessDefinition = undefined"
  />
</template>

<script lang="ts" setup>
import * as DefinitionApi from '@/api/bpm/definition'
import * as ProcessInstanceApi from '@/api/bpm/processInstance'
import { CategoryApi } from '@/api/bpm/category'
import ProcessDefinitionDetail from './ProcessDefinitionDetail.vue'

defineOptions({ name: 'BpmProcessInstanceCreate' })

const route = useRoute() // 路由
const message = useMessage() // 消息

const processInstanceId: any = route.query.processInstanceId
const loading = ref(true) // 加载中
const categoryList: any = ref([]) // 分类的列表
const categoryActive: any = ref({}) // 选中的分类
const processDefinitionList = ref([]) // 流程定义的列表
/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    // 流程分类
    categoryList.value = await CategoryApi.getCategorySimpleList()
    if (categoryList.value.length > 0) {
      categoryActive.value = categoryList.value[0]
    }
    // 流程定义
    processDefinitionList.value = await DefinitionApi.getProcessDefinitionList({
      suspensionState: 1
    })

    // 如果 processInstanceId 非空，说明是重新发起
    if (processInstanceId?.length > 0) {
      const processInstance = await ProcessInstanceApi.getProcessInstance(processInstanceId)
      if (!processInstance) {
        message.error('重新发起流程失败，原因：流程实例不存在')
        return
      }
      const processDefinition = processDefinitionList.value.find(
        (item: any) => item.key == processInstance.processDefinition?.key
      )
      if (!processDefinition) {
        message.error('重新发起流程失败，原因：流程定义不存在')
        return
      }
      await handleSelect(processDefinition, processInstance.formVariables)
    }
  } finally {
    loading.value = false
  }
}

/** 选中分类对应的流程定义列表 */
const categoryProcessDefinitionList: any = computed(() => {
  return processDefinitionList.value.filter(
    (item: any) => item.category == categoryActive.value.code
  )
})

// ========== 表单相关 ==========
const selectProcessDefinition = ref() // 选择的流程定义
const processDefinitionDetailRef = ref()

/** 处理选择流程的按钮操作 **/
const handleSelect = async (row, formVariables?) => {
  // 设置选择的流程
  selectProcessDefinition.value = row
  // 初始化流程定义详情
  await nextTick()
  processDefinitionDetailRef.value?.initProcessInfo(row, formVariables)
}
// 左侧分类切换
const handleCategoryClick = (val: number) => {
  categoryActive.value = val
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>

<style lang="scss" scoped>
.process-definition-container::before {
  content: '';
  border-left: 1px solid #e6e6e6;
  position: absolute;
  left: 20.8%;
  height: 100%;
}
:deep() {
  .definition-item-card {
    .el-card__body {
      padding: 14px;
    }
  }
}
</style>
