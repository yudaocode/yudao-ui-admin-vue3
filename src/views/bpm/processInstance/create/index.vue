<template>
  <!-- 第一步，通过流程定义的列表，选择对应的流程 -->
  <template v-if="!selectProcessDefinition">
    <el-input
      v-model="currentSearchKey"
      class="!w-50% mb-15px"
      placeholder="请输入流程名称"
      clearable
      @keyup.enter="handleQuery"
      @clear="handleClear"
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
          <el-scrollbar ref="scrollWrapper" height="700">
            <div
              class="mb-20px pl-10px"
              v-for="(definitions, title) in processDefinitionGroup"
              :key="title"
              :ref="`category-${title}`"
            >
              <h3 class="text-18px font-bold mb-10px mt-5px">{{ title }}</h3>
              <div class="grid grid-cols-3 gap3">
                <el-tooltip
                  v-for="definition in definitions"
                  :key="definition.id"
                  :content="definition.description"
                  placement="top"
                >
                  <el-card
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
import { CategoryApi } from '@/api/bpm/category'
import ProcessDefinitionDetail from './ProcessDefinitionDetail.vue'
import { groupBy } from 'lodash-es'

defineOptions({ name: 'BpmProcessInstanceCreate' })

const { proxy } = getCurrentInstance() as any
const route = useRoute() // 路由
const message = useMessage() // 消息
const currentSearchKey = ref('') // 当前搜索关键字
const processInstanceId: any = route.query.processInstanceId
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
    await getDefinitionList()

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

// 获取所有流程分类数据
const getCategoryList = async () => {
  try {
    // 流程分类
    categoryList.value = await CategoryApi.getCategorySimpleList()
    if (categoryList.value.length > 0) {
      categoryActive.value = categoryList.value[0]
    }
  } finally {
  }
}

// 获取所有流程定义数据
const getDefinitionList = async () => {
  try {
    // 流程定义
    processDefinitionList.value = await DefinitionApi.getProcessDefinitionList({
      suspensionState: 1
    })
    /* 测试数据 */
    // processDefinitionList.value = [
    //   {
    //     id: 'business:3:fab1dceb-95be-11ef-8c7d-00a6181404fd',
    //     version: 3,
    //     name: '商务管理',
    //     key: 'business',
    //     icon: 'https://picsum.photos/200?r=2',
    //     description: '商务管理',
    //     category: 'test0',
    //     categoryName: '分类0',
    //     formType: 10,
    //     formId: 27,
    //     formName: null,
    //     formConf:
    //       '{"form":{"inline":false,"hideRequiredAsterisk":false,"labelPosition":"right","size":"default","labelWidth":"100px"},"resetBtn":{"show":false,"innerText":"重置"},"submitBtn":{"show":false,"innerText":"提交"}}',
    //     formFields: [
    //       '{"type":"input","field":"F1yrm2sosxgeabc","title":"请假原因","info":"","$required":false,"props":{"type":"text","placeholder":"请输入123"},"_fc_id":"id_Fhrbm2sosxgeacc","name":"ref_Festm2sosxgeadc","display":true,"hidden":false,"_fc_drag_tag":"input"}',
    //       '{"type":"radio","field":"F9r3m2sp1b34aec","title":"请假类型","info":"","$required":false,"props":{"_optionType":2},"_fc_id":"id_F4nwm2sp1b34afc","name":"ref_Fkodm2sp1b34agc","display":true,"hidden":false,"_fc_drag_tag":"radio","options":[{"label":"事假","value":"1"},{"label":"婚假","value":"2"},{"label":"丧假","value":"3"}]}',
    //       '{"type":"datePicker","field":"Finom2tsbwbpadc","title":"请假时间段","info":"","$required":false,"props":{"type":"datetimerange"},"_fc_id":"id_F028m2tsbwbpaec","name":"ref_F0okm2tsbwbpafc","display":true,"hidden":false,"_fc_drag_tag":"dateRange"}'
    //     ],
    //     formCustomCreatePath: '',
    //     formCustomViewPath: '',
    //     suspensionState: 1,
    //     deploymentTime: null,
    //     bpmnXml: null,
    //     startUserSelectTasks: null
    //   },
    //   {
    //     id: 'oa_leave:1:6e5ac269-5f87-11ef-bdb6-00a6181404fd',
    //     version: 1,
    //     name: 'oa_leave',
    //     key: 'oa_leave',
    //     icon: null,
    //     description: 'oa_leave',
    //     category: 'etst',
    //     categoryName: '分类1',
    //     formType: 20,
    //     formId: null,
    //     formName: null,
    //     formConf: null,
    //     formFields: null,
    //     formCustomCreatePath: '/bpm/oa/leave/create',
    //     formCustomViewPath: '/bpm/oa/leave/detail',
    //     suspensionState: 1,
    //     deploymentTime: null,
    //     bpmnXml: null,
    //     startUserSelectTasks: null
    //   },
    //   {
    //     id: 'oa_leave:3:c9d06889-94fd-11ef-bf08-00a6181404fd',
    //     version: 3,
    //     name: '请假流程',
    //     key: 'oa_leave',
    //     icon: 'https://picsum.photos/200?r=1',
    //     description: '请假流程',
    //     category: 'test3',
    //     categoryName: '分类3',
    //     formType: 10,
    //     formId: 27,
    //     formName: null,
    //     formConf:
    //       '{"form":{"inline":false,"hideRequiredAsterisk":false,"labelPosition":"right","size":"default","labelWidth":"100px"},"resetBtn":{"show":false,"innerText":"重置"},"submitBtn":{"show":true,"innerText":"提交"}}',
    //     formFields: [
    //       '{"type":"input","field":"F1yrm2sosxgeabc","title":"请假原因","info":"","$required":false,"props":{"type":"text","placeholder":"请输入123"},"_fc_id":"id_Fhrbm2sosxgeacc","name":"ref_Festm2sosxgeadc","display":true,"hidden":false,"_fc_drag_tag":"input"}',
    //       '{"type":"radio","field":"F9r3m2sp1b34aec","title":"请假类型","info":"","$required":false,"props":{"_optionType":2},"_fc_id":"id_F4nwm2sp1b34afc","name":"ref_Fkodm2sp1b34agc","display":true,"hidden":false,"_fc_drag_tag":"radio","options":[{"label":"事假","value":"1"},{"label":"婚假","value":"2"},{"label":"丧假","value":"3"}]}'
    //     ],
    //     formCustomCreatePath: 'bpm/oa/leave/create',
    //     formCustomViewPath: 'bpm/oa/leave/create',
    //     suspensionState: 1,
    //     deploymentTime: null,
    //     bpmnXml: null,
    //     startUserSelectTasks: null
    //   }
    // ]
    /* 测试数据 */
    // processDefinitionList.value = [
    //   ...processDefinitionList.value,
    //   ...processDefinitionList.value,
    //   ...processDefinitionList.value,
    //   ...processDefinitionList.value,
    //   ...processDefinitionList.value,
    //   ...processDefinitionList.value,
    //   ...processDefinitionList.value,
    //   ...processDefinitionList.value,
    //   ...processDefinitionList.value,
    //   ...processDefinitionList.value,
    //   ...processDefinitionList.value,
    //   ...processDefinitionList.value,
    //   ...processDefinitionList.value,
    //   ...processDefinitionList.value,
    //   ...processDefinitionList.value,
    //   ...processDefinitionList.value
    // ]
    // 初始化过滤列表为全部流程定义
    filteredProcessDefinitionList.value = processDefinitionList.value
  } finally {
  }
}

const filteredProcessDefinitionList = ref([]) // 用于存储搜索过滤后的流程定义
// 直接进行前端搜索
const handleQuery = () => {
  if (currentSearchKey.value.trim()) {
    // 如果有搜索关键字，进行过滤
    filteredProcessDefinitionList.value = processDefinitionList.value.filter(
      (definition: any) =>
        definition.name.toLowerCase().includes(currentSearchKey.value.toLowerCase()) // 假设搜索依据是流程定义的名称
    )
  } else {
    // 如果没有搜索关键字，恢复所有数据
    filteredProcessDefinitionList.value = processDefinitionList.value
  }
}

// 监听input `clearable` 事件
const handleClear = () => {
  filteredProcessDefinitionList.value = processDefinitionList.value
}

// 流程定义的分组
const processDefinitionGroup: any = computed(() => {
  if (!processDefinitionList.value?.length) return {}
  return groupBy(filteredProcessDefinitionList.value, 'categoryName')
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
const handleCategoryClick = (category) => {
  categoryActive.value = category
  const categoryRef = proxy.$refs[`category-${category.name}`] // 获取点击分类对应的 DOM 元素
  if (categoryRef?.length) {
    const scrollWrapper = proxy.$refs.scrollWrapper // 获取右侧滚动容器
    const categoryOffsetTop = categoryRef[0].offsetTop

    // 滚动到对应位置
    scrollWrapper.scrollTo({ top: categoryOffsetTop, behavior: 'smooth' })
  }
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
