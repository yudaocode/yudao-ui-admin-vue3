<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-button
      type="primary"
      plain
      @click="openForm('create')"
      v-hasPermi="['point:sign-in-config:create']"
    >
      <Icon icon="ep:plus" class="mr-5px" /> 新增
    </el-button>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list">
      <el-table-column
        label="签到天数"
        align="center"
        prop="day"
        :formatter="(_, __, cellValue) => ['第', cellValue, '天'].join(' ')"
      />
      <el-table-column label="获得积分" align="center" prop="point" />
      <el-table-column label="是否开启" align="center">
        <template #default="scope">
          <div>
            <el-switch
              v-model="scope.row.isEnable"
              @change="handleSwitchChange(scope.row.id, $event)"
              inline-prompt
              active-text="开启"
              inactive-text="关闭"
            />
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['point:sign-in-config:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['point:sign-in-config:delete']"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </ContentWrap>

  <!-- 表单弹窗：添加/修改 -->
  <SignInConfigForm ref="formRef" @success="getList" />
</template>

<script lang="ts" setup>
import * as SignInConfigApi from '@/api/point/signInConfig'
import SignInConfigForm from './SignInConfigForm.vue'
import { SignInConfigVO } from '@/api/point/signInConfig'

defineOptions({ name: 'SignInConfig' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref([]) // 列表的数据

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await SignInConfigApi.getSignInConfigPage()
    console.log(data)
    list.value = data
  } finally {
    loading.value = false
  }
}

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await SignInConfigApi.deleteSignInConfig(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

const handleSwitchChange = async (id, e) => {
  console.log('开关状态变更，id:', id, '新状态：', e)
  // 创建对象
  const signInConfig: SignInConfigVO = {
    id: id,
    day: null,
    point: null,
    isEnable: e
  }
  await SignInConfigApi.updateSignInConfig(signInConfig)
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
