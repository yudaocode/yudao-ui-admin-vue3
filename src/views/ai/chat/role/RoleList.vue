<template>
  <div class="card-list">
    <el-card class="card" body-class="card-body" v-for="role in roleList" :key="role.id">
      <!--  更多 -->
      <div class="more-container">
        <el-dropdown @command="handleMoreClick">
          <span class="el-dropdown-link">
             <el-button type="text" >
                <el-icon><More /></el-icon>
              </el-button>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item :command="['edit', role]" >
                <el-icon><EditPen /></el-icon>编辑
              </el-dropdown-item>
              <el-dropdown-item :command="['delete', role]"  style="color: red;" >
                <el-icon><Delete /></el-icon>
                <span>删除</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <!--  头像 -->
      <div>
        <img class="avatar" :src="role.avatar"/>
      </div>
      <div class="right-container">
        <div class="content-container">
          <div class="title">{{ role.name }}</div>
          <div class="description">{{ role.description }}</div>

        </div>
        <div class="btn-container">
          <el-button type="primary" size="small" @click="handleUseClick(role)">使用</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import {ChatRoleVO} from '@/api/ai/model/chatRole'
import {PropType} from "vue";
import {Delete, EditPen, More} from "@element-plus/icons-vue";

// 定义属性
const props = defineProps({
  roleList: {
    type: Array as PropType<ChatRoleVO[]>,
    required: true
  }
})
// 定义钩子
const emits = defineEmits(['onDelete', 'onEdit', 'onUse'])

// more 点击
const handleMoreClick = async (data) => {
  const type = data[0]
  const role = data[1]
  if (type === 'delete') {
    emits('onDelete', role)
  } else {
    emits('onEdit', role)
  }
}

// 使用
const handleUseClick = (role) => {
  emits('onUse', role)
}

onMounted(() => {
  console.log('props', props.roleList)
})

</script>

<style lang="scss">
// 重写 card 组件 body 样式
.card-body {
  max-width: 300px;
  width: 300px;
  padding: 15px;

  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  position: relative;

}
</style>
<style scoped lang="scss">

// 卡片列表
.card-list {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  position: relative;

  .card {
    margin-right: 20px;
    border-radius: 10px;
    margin-bottom: 30px;
    position: relative;

    .more-container {
      position: absolute;
      right: 12px;
      top: 0px;
    }

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      overflow: hidden;
    }

    .right-container {
      margin-left: 10px;
      width: 100%;
      //height: 100px;

      .content-container {
        height: 85px;
        overflow: hidden;

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
