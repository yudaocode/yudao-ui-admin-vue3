<template>
  <!-- 第一步，通过流程定义的列表，选择对应的流程 -->
  <template v-if="!selectProcessDefinition">
    <el-input
      v-model="searchName"
      class="!w-50% mb-15px"
      placeholder="请输入流程名称"
      clearable
      @input="handleQuery"
      @clear="handleQuery"
    >
      <template #prefix>
        <Icon icon="ep:search" />
      </template>
    </el-input>
    <ContentWrap
      :class="{ 'process-definition-container': filteredProcessDefinitionList?.length }"
      class="position-relative pb-20px h-700px"
      v-loading="loading"
    >
      <el-row v-if="filteredProcessDefinitionList?.length" :gutter="20" class="!flex-nowrap">
        <el-col :span="5">
          <div class="flex flex-col">
            <div
              v-for="category in availableCategories"
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
          <el-scrollbar ref="scrollWrapper" height="700" @scroll="handleScroll">
            <div
              class="mb-20px pl-10px"
              v-for="(definitions, categoryCode) in processDefinitionGroup"
              :key="categoryCode"
              :ref="`category-${categoryCode}`"
            >
              <h3 class="text-18px font-bold mb-10px mt-5px">
                {{ getCategoryName(categoryCode as any) }}
              </h3>
              <div class="grid grid-cols-3 gap3">
                <el-tooltip
                  v-for="definition in definitions"
                  :key="definition.id"
                  :content="definition.description"
                  :disabled="!definition.description || definition.description.trim().length === 0"
                  placement="top"
                >
                  <el-card
                    shadow="hover"
                    class="cursor-pointer definition-item-card"
                    @click="handleSelect(definition)"
                  >
                    <template #default>
                      <div class="flex">
                        <el-image
                          v-if="definition.icon"
                          :src="definition.icon"
                          class="w-32px h-32px"
                        />
                        <div v-else class="flow-icon">
                          <span style="font-size: 12px; color: #fff">
                            {{ subString(definition.name, 0, 2) }}
                          </span>
                        </div>
                        <el-text class="!ml-10px" size="large">{{ definition.name }}</el-text>
                      </div>
                    </template>
                  </el-card>
                </el-tooltip>
              </div>
            </div>
          </el-scrollbar>
        </el-col>
      </el-row>
      <el-empty class="!py-200px" :image-size="200" description="没有找到搜索结果" v-else />
    </ContentWrap>
  </template>

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
import { CategoryApi, CategoryVO } from '@/api/bpm/category'
import ProcessDefinitionDetail from './ProcessDefinitionDetail.vue'
import { groupBy } from 'lodash-es'
import { subString } from '@/utils/index'

defineOptions({ name: 'BpmProcessInstanceCreate' })

const { proxy } = getCurrentInstance() as any
const route = useRoute() // 路由
const message = useMessage() // 消息

const searchName = ref('') // 当前搜索关键字
const processInstanceId: any = route.query.processInstanceId // 流程实例编号。场景：重新发起时
const loading = ref(true) // 加载中
const categoryList: any = ref([]) // 分类的列表
const categoryActive: any = ref({}) // 选中的分类
const processDefinitionList = ref([]) // 流程定义的列表

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    // 所有流程分类数据
    await getCategoryList()
    // 所有流程定义数据
    await getProcessDefinitionList()

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

/** 获取所有流程分类数据 */
const getCategoryList = async () => {
  try {
    // 流程分类
    categoryList.value = await CategoryApi.getCategorySimpleList()
  } finally {
  }
}

/** 获取所有流程定义数据 */
const getProcessDefinitionList = async () => {
  try {
    // 流程定义
    processDefinitionList.value = await DefinitionApi.getProcessDefinitionList({
      suspensionState: 1
    })
    // 初始化过滤列表为全部流程定义
    filteredProcessDefinitionList.value = processDefinitionList.value

    // 在获取完所有数据后，设置第一个有效分类为激活状态
    if (availableCategories.value.length > 0 && !categoryActive.value?.code) {
      categoryActive.value = availableCategories.value[0]
    }
  } finally {
  }
}

/** 搜索流程 */
const filteredProcessDefinitionList = ref([]) // 用于存储搜索过滤后的流程定义
const handleQuery = () => {
  if (searchName.value.trim()) {
    // 如果有搜索关键字，进行过滤
    filteredProcessDefinitionList.value = processDefinitionList.value.filter(
      (definition: any) => definition.name.toLowerCase().includes(searchName.value.toLowerCase()) // 假设搜索依据是流程定义的名称
    )
  } else {
    // 如果没有搜索关键字，恢复所有数据
    filteredProcessDefinitionList.value = processDefinitionList.value
  }
}

/** 流程定义的分组 */
const processDefinitionGroup: any = computed(() => {
  if (!processDefinitionList.value?.length) {
    return {}
  }

  const grouped = groupBy(filteredProcessDefinitionList.value, 'category')
  // 按照 categoryList 的顺序重新组织数据
  const orderedGroup = {}
  categoryList.value.forEach((category: any) => {
    if (grouped[category.code]) {
      orderedGroup[category.code] = grouped[category.code]
    }
  })
  return orderedGroup
})

/** 左侧分类切换 */
const handleCategoryClick = (category: any) => {
  categoryActive.value = category
  const categoryRef = proxy.$refs[`category-${category.code}`] // 获取点击分类对应的 DOM 元素
  if (categoryRef?.length) {
    const scrollWrapper = proxy.$refs.scrollWrapper // 获取右侧滚动容器
    const categoryOffsetTop = categoryRef[0].offsetTop

    // 滚动到对应位置
    scrollWrapper.scrollTo({ top: categoryOffsetTop, behavior: 'smooth' })
  }
}

/** 通过分类 code 获取对应的名称 */
const getCategoryName = (categoryCode: string) => {
  return categoryList.value?.find((ctg: any) => ctg.code === categoryCode)?.name
}

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

/** 处理滚动事件，和左侧分类联动 */
const handleScroll = (e: any) => {
  // 直接使用事件对象获取滚动位置
  const scrollTop = e.scrollTop

  // 获取所有分类区域的位置信息
  const categoryPositions = categoryList.value
    .map((category: CategoryVO) => {
      const categoryRef = proxy.$refs[`category-${category.code}`]
      if (categoryRef?.[0]) {
        return {
          code: category.code,
          offsetTop: categoryRef[0].offsetTop,
          height: categoryRef[0].offsetHeight
        }
      }
      return null
    })
    .filter(Boolean)

  // 查找当前滚动位置对应的分类
  let currentCategory = categoryPositions[0]
  for (const position of categoryPositions) {
    // 为了更好的用户体验，可以添加一个缓冲区域（比如 50px）
    if (scrollTop >= position.offsetTop - 50) {
      currentCategory = position
    } else {
      break
    }
  }

  // 更新当前 active 的分类
  if (currentCategory && categoryActive.value.code !== currentCategory.code) {
    categoryActive.value = categoryList.value.find(
      (c: CategoryVO) => c.code === currentCategory.code
    )
  }
}

/** 过滤出有流程的分类列表。目的：只展示有流程的分类 */
const availableCategories = computed(() => {
  if (!categoryList.value?.length || !processDefinitionGroup.value) {
    return []
  }

  // 获取所有有流程的分类代码
  const availableCategoryCodes = Object.keys(processDefinitionGroup.value)

  // 过滤出有流程的分类
  return categoryList.value.filter((category: CategoryVO) =>
    availableCategoryCodes.includes(category.code)
  )
})

/** 初始化 */
onMounted(() => {
  getList()
})
</script>

<style lang="scss" scoped>
.flow-icon {
  display: flex;
  width: 32px;
  height: 32px;
  margin-right: 10px;
  background-color: var(--el-color-primary);
  border-radius: 0.25rem;
  align-items: center;
  justify-content: center;
}

.process-definition-container::before {
  position: absolute;
  left: 20.8%;
  height: 100%;
  border-left: 1px solid #e6e6e6;
  content: '';
}

:deep() {
  .definition-item-card {
    .el-card__body {
      padding: 14px;
    }
  }
}
</style>
