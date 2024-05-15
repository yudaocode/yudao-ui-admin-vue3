<template>
  <div class="card-list">
    <el-card class="card" body-class="card-body" v-for="role in roleList" :key="role.id">
      <div>
        <img class="avatar" :src="role.avatar"/>
      </div>
      <div class="right-container">
        <div class="content-container">
          <div class="title">{{ role.name }}</div>
          <div class="description">{{ role.description }}</div>
        </div>
        <div class="btn-container">
          <el-button type="primary" size="small">使用</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import {ChatRoleVO} from '@/api/ai/model/chatRole'
import {PropType} from "vue";

// 定义属性
const props = defineProps({
  roleList: {
    type: Array as PropType<ChatRoleVO[]>,
    required: true
  }
})

onMounted(() => {
  console.log('props', props.roleList)
})

</script>

<style lang="scss">
// 重写 card 组件 body 样式
.card-body {
  width: auto;
  max-width: 300px;
  padding: 15px;

  display: flex;
  flex-direction: row;
  justify-content: flex-start;

}
</style>
<style scoped lang="scss">

// 卡片列表
.card-list {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;

  .card {
    margin-right: 20px;
    border-radius: 10px;

    .avatar {
      width: 40px;
      border-radius: 10px;
      overflow: hidden;
    }

    .right-container {
      margin-left: 10px;

      .content-container {
        .title {
          font-size: 18px;
          font-weight: bold;
          color: #3e3e3e;
        }

        .description {
          margin-top: 10px;
          font-size: 14px;
          color: #6a6a6a;
        }
      }

      .btn-container {
        display: flex;
        flex-direction: row-reverse;
        margin-top: 15px;
      }
    }

  }

}

</style>
