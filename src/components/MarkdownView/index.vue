<template>
  <div ref="contentRef" class="markdown-view" v-html="contentHtml"></div>
</template>

<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import { marked } from 'marked'
import 'highlight.js/styles/vs2015.min.css'
import hljs from 'highlight.js'

// 定义组件属性
const props = defineProps({
  content: {
    type: String,
    required: true
  }
})

const message = useMessage() // 消息弹窗
const { copy } = useClipboard() // 初始化 copy 到粘贴板
const contentRef = ref()
const contentHtml = ref<any>() // 渲染的html内容
const { content } = toRefs(props) // 将 props 变为引用类型

// 代码高亮：https://highlightjs.org/
// 转换 markdown：marked

/** marked 渲染器 */
const renderer = {
  code(code, language, c) {
    let highlightHtml
    try {
      highlightHtml = hljs.highlight(code, { language: language, ignoreIllegals: true }).value
    } catch (e) {
      // skip
    }
    const copyHtml = `<div id="copy" data-copy='${code}' style="position: absolute; right: 10px; top: 5px; color: #fff;cursor: pointer;">复制</div>`
    return `<pre style="position: relative;">${copyHtml}<code class="hljs">${highlightHtml}</code></pre>`
  }
}

// 配置 marked
marked.use({
  renderer: renderer
})

/** 监听 content 变化 */
watch(content, async (newValue, oldValue) => {
  await renderMarkdown(newValue)
})

/** 渲染 markdown */
const renderMarkdown = async (content: string) => {
  contentHtml.value = await marked(content)
}

/** 初始化 **/
onMounted(async () => {
  // 解析转换 markdown
  await renderMarkdown(props.content as string)
  // 添加 copy 监听
  contentRef.value.addEventListener('click', (e: any) => {
    if (e.target.id === 'copy') {
      copy(e.target?.dataset?.copy)
      message.success('复制成功!')
    }
  })
})
</script>

<style lang="scss">
.markdown-view {
  font-family: PingFang SC;
  font-size: 0.95rem;
  font-weight: 400;
  line-height: 1.6rem;
  letter-spacing: 0em;
  text-align: left;
  color: #3b3e55;
  max-width: 100%;

  pre {
    position: relative;
  }

  pre code.hljs {
    width: auto;
  }

  code.hljs {
    border-radius: 6px;
    padding-top: 20px;
    width: auto;
    @media screen and (min-width: 1536px) {
      width: 960px;
    }

    @media screen and (max-width: 1536px) and (min-width: 1024px) {
      width: calc(100vw - 400px - 64px - 32px * 2);
    }

    @media screen and (max-width: 1024px) and (min-width: 768px) {
      width: calc(100vw - 32px * 2);
    }

    @media screen and (max-width: 768px) {
      width: calc(100vw - 16px * 2);
    }
  }

  p,
  code.hljs {
    margin-bottom: 16px;
  }

  p {
    //margin-bottom: 1rem !important;
    margin: 0;
    margin-bottom: 3px;
  }

  /* 标题通用格式 */
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    color: var(--color-G900);
    margin: 24px 0 8px;
    font-weight: 600;
  }

  h1 {
    font-size: 22px;
    line-height: 32px;
  }

  h2 {
    font-size: 20px;
    line-height: 30px;
  }

  h3 {
    font-size: 18px;
    line-height: 28px;
  }

  h4 {
    font-size: 16px;
    line-height: 26px;
  }

  h5 {
    font-size: 16px;
    line-height: 24px;
  }

  h6 {
    font-size: 16px;
    line-height: 24px;
  }

  /* 列表（有序，无序） */
  ul,
  ol {
    margin: 0 0 8px 0;
    padding: 0;
    font-size: 16px;
    line-height: 24px;
    color: #3b3e55; // var(--color-CG600);
  }

  li {
    margin: 4px 0 0 20px;
    margin-bottom: 1rem;
  }

  ol > li {
    list-style-type: decimal;
    margin-bottom: 1rem;
    // 表达式,修复有序列表序号展示不全的问题
    // &:nth-child(n + 10) {
    //     margin-left: 30px;
    // }

    // &:nth-child(n + 100) {
    //     margin-left: 30px;
    // }
  }

  ul > li {
    list-style-type: disc;
    font-size: 16px;
    line-height: 24px;
    margin-right: 11px;
    margin-bottom: 1rem;
    color: #3b3e55; // var(--color-G900);
  }

  ol ul,
  ol ul > li,
  ul ul,
  ul ul li {
    // list-style: circle;
    font-size: 16px;
    list-style: none;
    margin-left: 6px;
    margin-bottom: 1rem;
  }

  ul ul ul,
  ul ul ul li,
  ol ol,
  ol ol > li,
  ol ul ul,
  ol ul ul > li,
  ul ol,
  ul ol > li {
    list-style: square;
  }
}
</style>
