<template>
  <div class="waterfall" v-loading="props.loading">
    <div class="waterfall-item" v-for="item in props.list" :key="item.id">
      <a target="_blank" :href="item.url">
        <img class="material-img" :src="item.url" />
        <div class="item-name">{{ item.name }}</div>
      </a>
      <el-row justify="center">
        <el-button
          type="danger"
          circle
          @click="emit('delete', item.id)"
          v-hasPermi="['mp:material:delete']"
        >
          <Icon icon="ep:delete" />
        </el-button>
      </el-row>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  list: any[]
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'delete', v: number)
}>()
</script>

<style lang="scss" scoped>
@media (width >= 992px) and (width <= 1300px) {
  .waterfall {
    column-count: 3;
  }

  p {
    color: red;
  }
}

@media (width >= 768px) and (width <= 991px) {
  .waterfall {
    column-count: 2;
  }

  p {
    color: orange;
  }
}

@media (width <= 767px) {
  .waterfall {
    column-count: 1;
  }
}

.waterfall {
  width: 100%;
  column-gap: 10px;
  column-count: 5;
  margin-top: 10px;

  /* 芋道源码：增加 10px，避免顶着上面 */
}

.waterfall-item {
  padding: 10px;
  margin-bottom: 10px;
  break-inside: avoid;
  border: 1px solid #eaeaea;
}

.material-img {
  width: 100%;
}

p {
  line-height: 30px;
}
</style>
