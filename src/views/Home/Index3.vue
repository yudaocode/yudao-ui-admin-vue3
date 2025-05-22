<template>
  <el-row class="mt-8px" :gutter="8" justify="center">
    <el-col
      :xl="16"
      :lg="20"
      :md="22"
      :sm="24"
      :xs="24"
      class="mb-8px"
      style="margin: 0 auto;"
    >
      <el-card shadow="never">
        <el-skeleton :loading="loading" animated>
          <el-row :gutter="16">
            <el-col
              v-for="(item, index) in projects"
              :key="`card-${index}`"
              :xl="8"
              :lg="8"
              :md="12"
              :sm="24"
              :xs="24"
            >
              <el-card
                shadow="hover"
                class="mt-5px cursor-pointer"
                style="margin-right: 5px;margin-bottom: 5px"
                @click="handleProjectClick(item.message)"
              >
                <div class="flex items-center">
                  <img :src="item.img" alt="icon" class="w-25px h-25px mr-8px" />
                  <span class="text-16px">{{ item.name }}</span>
                </div>
                <div class="mt-12px text-12px text-gray-400">{{ t(item.message) }}</div>
                <div class="mt-12px flex justify-between text-12px text-gray-400">
                  <span>{{ item.personal }}</span>
                  <span>{{ formatTime(item.time, 'yyyy-MM-dd') }}</span>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </el-skeleton>
      </el-card>
    </el-col>
  </el-row>

</template>
<script lang="ts" setup>
import { formatTime } from '@/utils'

import { useUserStore } from '@/store/modules/user'
import type { Project } from './types'
import { useRouter } from 'vue-router'

defineOptions({ name: 'Home' })

const { t } = useI18n()
const router = useRouter()
const userStore = useUserStore()
const loading = ref(true)
const avatar = userStore.getUser.avatar
const username = userStore.getUser.nickname

// 获取项目数
let projects = reactive<Project[]>([])
const getProject = async () => {
  const data = [
    {
      name: '花果山',
      img: 'https://spc.yuqm.asia/assets/monkey.png',
      message: 'spc.yuqm.asia',
      personal: '猴子的乐园',
    }
  ]
  projects = Object.assign(projects, data)
}

const getAllApi = async () => {
  await Promise.all([
    getProject(),
  ])
  loading.value = false
}

const handleProjectClick = (message: string) => {
  window.open(`https://${message}`, '_blank')
}

getAllApi()
</script>


