<template>
  <el-form-item label="JDBC 地址" prop="config.jdbcUrl">
    <el-input
      v-model="config.jdbcUrl"
      placeholder="请输入JDBC连接地址，如：jdbc:mysql://localhost:3306/iot_data"
    />
  </el-form-item>
  <el-form-item label="用户名" prop="config.username">
    <el-input v-model="config.username" placeholder="请输入数据库用户名" />
  </el-form-item>
  <el-form-item label="密码" prop="config.password">
    <el-input
      v-model="config.password"
      placeholder="请输入数据库密码"
      show-password
      type="password"
    />
  </el-form-item>
  <el-form-item label="目标表名" prop="config.tableName">
    <div style="display: flex; align-items: center; gap: 12px; width: 100%">
      <el-input v-model="config.tableName" placeholder="目标表名" style="width: 240px" />
      <el-button type="primary" link @click="toggleSqlTip">
        <el-icon class="mr-1"><component :is="showSqlTip ? 'ArrowUp' : 'Document'" /></el-icon>
        {{ showSqlTip ? '收起表结构提示' : '查看表结构提示' }}
      </el-button>
    </div>
  </el-form-item>

  <!-- Redesigned Terminal-style SQL snippet -->
  <el-collapse-transition>
    <div v-show="showSqlTip" class="terminal-card">
      <div class="terminal-header">
        <div class="terminal-dots">
          <div class="dot red"></div>
          <div class="dot yellow"></div>
          <div class="dot green"></div>
        </div>
        <div class="terminal-title">Initialization Required</div>
        <button class="terminal-copy-btn" type="button" @click="handleCopySQL">
          <el-icon class="copy-icon"><Check v-if="isCopied" /><DocumentCopy v-else /></el-icon>
          {{ isCopied ? '已复制' : 'Copy SQL' }}
        </button>
      </div>
      <div class="terminal-body">
        <div class="terminal-desc">
          ✨ 目标数据库必须包含以下结构的表，才能正常接收数据流转的消息：
        </div>
        <div class="terminal-code-wrapper">
          <pre
            class="terminal-code"
          ><code><span class="kw">CREATE</span> <span class="kw">TABLE</span> <span class="identifier">iot_device_message_sink</span> (
    <span class="identifier">id</span> <span class="type">VARCHAR</span>(64) <span class="kw">NOT NULL COMMENT</span> <span class="string">'消息ID'</span>,
    <span class="identifier">device_id</span> <span class="type">BIGINT</span> <span class="kw">NOT NULL COMMENT</span> <span class="string">'设备编号'</span>,
    <span class="identifier">tenant_id</span> <span class="type">BIGINT</span> <span class="kw">NOT NULL DEFAULT</span> <span class="num">0</span> <span class="kw">COMMENT</span> <span class="string">'租户编号'</span>,
    <span class="identifier">method</span> <span class="type">VARCHAR</span>(128) <span class="kw">COMMENT</span> <span class="string">'请求方法'</span>,
    <span class="identifier">report_time</span> <span class="type">DATETIME</span> <span class="kw">COMMENT</span> <span class="string">'上报时间'</span>,
    <span class="identifier">data</span> <span class="type">TEXT</span> <span class="kw">COMMENT</span> <span class="string">'完整消息JSON'</span>,
    <span class="identifier">create_time</span> <span class="type">DATETIME</span> <span class="kw">NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT</span> <span class="string">'创建时间'</span>,
    <span class="kw">PRIMARY KEY</span> (<span class="identifier">id</span>) <span class="kw">USING BTREE</span>,
    <span class="kw">INDEX</span> <span class="identifier">idx_create_time</span> (<span class="identifier">create_time</span> <span class="kw">ASC</span>) <span class="kw">USING BTREE</span>
) <span class="kw">ENGINE</span> = <span class="identifier">InnoDB</span> <span class="kw">CHARACTER SET</span> = <span class="identifier">utf8mb4</span> <span class="kw">COLLATE</span> = <span class="identifier">utf8mb4_unicode_ci</span> <span class="kw">COMMENT</span> = <span class="string">'IoT 设备消息流转目标表'</span>;</code></pre>
        </div>
      </div>
    </div>
  </el-collapse-transition>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { Check, DocumentCopy } from '@element-plus/icons-vue'
import { DatabaseConfig, IotDataSinkTypeEnum } from '@/api/iot/rule/data/sink'
import { useClipboard, useVModel } from '@vueuse/core'
import { isEmpty } from '@/utils/is'
import { useMessage } from '@/hooks/web/useMessage'

defineOptions({ name: 'DatabaseConfigForm' })

const props = defineProps<{
  modelValue: any
}>()
const emit = defineEmits(['update:modelValue'])
const config = useVModel(props, 'modelValue', emit) as Ref<DatabaseConfig>
const message = useMessage()

const rawSQL = `CREATE TABLE iot_device_message_sink (
    id VARCHAR(64) NOT NULL COMMENT '消息ID',
    device_id BIGINT NOT NULL COMMENT '设备编号',
    tenant_id BIGINT NOT NULL DEFAULT 0 COMMENT '租户编号',
    method VARCHAR(128) COMMENT '请求方法',
    report_time DATETIME COMMENT '上报时间',
    data TEXT COMMENT '完整消息JSON',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id) USING BTREE,
    INDEX idx_create_time (create_time ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'IoT 设备消息流转目标表';`

const isCopied = ref(false)
const showSqlTip = ref(false)
const { copy } = useClipboard()

const toggleSqlTip = () => {
  showSqlTip.value = !showSqlTip.value
}

const handleCopySQL = async () => {
  await copy(rawSQL)
  isCopied.value = true
  message.success('建表 SQL 已复制到剪贴板')
  setTimeout(() => {
    isCopied.value = false
  }, 2000)
}

/** 组件初始化 */
onMounted(() => {
  if (!isEmpty(config.value)) {
    return
  }
  config.value = {
    type: IotDataSinkTypeEnum.DATABASE + '', // 序列化成对应类型时使用
    jdbcUrl: '',
    username: '',
    password: '',
    tableName: 'iot_device_message_sink'
  }
})
</script>

<style scoped>
/* 终端风卡片设计 (Tokyo Night 极客美学) */
.terminal-card {
  margin-top: 32px;
  margin-bottom: 8px;
  border-radius: 12px;
  background-color: #1a1b26;
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.4);
  border: 1px solid #24283b;
  overflow: hidden;
  font-family: 'Fira Code', 'JetBrains Mono', Consolas, Monaco, monospace;
}

.terminal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: #24283b;
  border-bottom: 1px solid #16161e;
  position: relative;
}

.terminal-dots {
  display: flex;
  gap: 8px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transition: transform 0.2s ease;
}
.dot:hover {
  transform: scale(1.2);
}
.dot.red {
  background-color: #f7768e;
  box-shadow: 0 0 5px rgba(247, 118, 142, 0.4);
}
.dot.yellow {
  background-color: #e0af68;
  box-shadow: 0 0 5px rgba(224, 175, 104, 0.4);
}
.dot.green {
  background-color: #9ece6a;
  box-shadow: 0 0 5px rgba(158, 206, 106, 0.4);
}

.terminal-title {
  color: #a9b1d6;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.8px;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.terminal-copy-btn {
  background: transparent;
  border: 1px solid #414868;
  color: #a9b1d6;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: inherit;
}
.terminal-copy-btn:hover {
  background: #bb9af7;
  border-color: #bb9af7;
  color: #1a1b26;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(187, 154, 247, 0.3);
}
.terminal-copy-btn:active {
  transform: translateY(0);
}

.copy-icon {
  font-size: 14px;
}

.terminal-body {
  padding: 20px;
  color: #c0caf5;
  font-size: 13px;
  line-height: 1.6;
}

.terminal-desc {
  color: #7dcfff;
  margin-bottom: 16px;
  font-family: var(--el-font-family);
  font-size: 13px;
  padding-bottom: 16px;
  border-bottom: 1px dashed #292e42;
}

.terminal-code-wrapper {
  overflow-x: auto;
  border-radius: 8px;
}

.terminal-code {
  margin: 0;
  white-space: pre;
  min-width: max-content;
}

.terminal-code code {
  font-family: inherit;
}

/* 手工实现的轻量级 SQL 语法高亮 (Tokyo Night Color Palette) */
.kw {
  color: #bb9af7;
} /* 紫色 - 关键字 */
.type {
  color: #2ac3de;
} /* 青色 - 数据类型 */
.string {
  color: #9ece6a;
} /* 绿色 - 字符串/注释 */
.identifier {
  color: #c0caf5;
} /* 浅蓝 - 变量名/默认字色 */
.num {
  color: #ff9e64;
} /* 橙色 - 数字 */

/* 定制代码块的滚动条 */
.terminal-code-wrapper::-webkit-scrollbar {
  height: 8px;
}
.terminal-code-wrapper::-webkit-scrollbar-thumb {
  background: #414868;
  border-radius: 4px;
}
.terminal-code-wrapper::-webkit-scrollbar-thumb:hover {
  background: #565f89;
}
.terminal-code-wrapper::-webkit-scrollbar-track {
  background: transparent;
}
</style>
