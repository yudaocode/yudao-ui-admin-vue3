<template>
  <div ref="contentRef" class="markdown-view" v-dompurify-html="renderedMarkdown"></div>
</template>

<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import MarkdownIt from 'markdown-it'
import 'highlight.js/styles/vs2015.min.css'
import hljs from 'highlight.js'
import { escapeHtml } from '@/utils'

// 定义组件属性
const props = defineProps({
  content: {
    type: String,
    required: true
  },
  // 以下渲染选项同 markdown-it，默认关闭；调用方按保存时的渲染选项开启，使预览与保存结果一致
  html: {
    type: Boolean,
    default: false
  },
  linkify: {
    type: Boolean,
    default: false
  },
  breaks: {
    type: Boolean,
    default: false
  }
})

const message = useMessage() // 消息弹窗
const { copy } = useClipboard({ legacy: true }) // 初始化 copy 到粘贴板
const contentRef = ref()
// 代码块复制原文：按渲染顺序保存在组件内，HTML 中只放序号，避免净化改写或移除属性中的原文
let copyTexts: string[] = []

const md = computed(
  () =>
    new MarkdownIt({
      html: props.html,
      linkify: props.linkify,
      breaks: props.breaks,
      highlight: function (str, lang) {
        // 语言标记、代码正文均来自不可信输入，输出 HTML 前必须转义；复制原文只放序号，不写入属性
        const languageHtml = `<span style="position: absolute; left: 10px; top: 5px; color: #fff;">${escapeHtml(lang || 'text')}</span>`
        const copyHtml = `<div id="copy" data-copy-index="${copyTexts.push(str) - 1}" style="position: absolute; right: 10px; top: 5px; color: #fff;cursor: pointer;">复制</div>`
        let codeHtml = escapeHtml(str)
        if (lang && hljs.getLanguage(lang)) {
          try {
            codeHtml = hljs.highlight(lang, str, true).value
          } catch (__) {}
        }
        return `<pre style="position: relative;">${languageHtml}${copyHtml}<code class="hljs">${codeHtml}</code></pre>`
      }
    })
)

/** 渲染 markdown，经 DOMPurify 净化后输出，开启内嵌 HTML 时不保留脚本、事件和危险协议 */
const renderedMarkdown = computed(() => {
  // 每次渲染重新收集复制原文，序号与本次输出的代码块一一对应
  copyTexts = []
  return md.value.render(props.content)
})

/** 初始化 **/
onMounted(async () => {
  // 添加 copy 监听
  contentRef.value.addEventListener('click', (e: any) => {
    if (e.target.id !== 'copy') {
      return
    }
    // 按序号取回原文；仅接受渲染生成的十进制序号，空白、负数、小数等非法值或越界（如内嵌 HTML 伪造的复制按钮）时不复制
    const index = e.target.dataset?.copyIndex
    if (typeof index !== 'string' || !/^(0|[1-9]\d*)$/.test(index)) {
      return
    }
    const text = copyTexts[Number(index)]
    if (text === undefined) {
      return
    }
    copy(text)
    message.success('复制成功!')
  })
})
</script>

<style lang="scss">
.markdown-view {
  max-width: 100%;
  font-family: 'PingFang SC';
  font-size: 0.95rem;
  font-weight: 400;
  line-height: 1.6rem;
  letter-spacing: 0;
  color: #3b3e55;
  text-align: left;

  pre {
    position: relative;
  }

  pre code.hljs {
    width: auto;
  }

  code.hljs {
    width: auto;
    padding-top: 20px;
    border-radius: 6px;

    @media screen and (width >= 1536px) {
      width: 960px;
    }

    @media screen and (width <= 1536px) and (width >= 1024px) {
      width: calc(100vw - 400px - 64px - 32px * 2);
    }

    @media screen and (width <= 1024px) and (width >= 768px) {
      width: calc(100vw - 32px * 2);
    }

    @media screen and (width <= 768px) {
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
    margin: 24px 0 8px;
    font-weight: 600;
    color: #3b3e55;
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
    padding: 0;
    margin: 0 0 8px;
    font-size: 16px;
    line-height: 24px;
    color: #3b3e55; // var(--color-CG600);
  }

  li {
    margin: 4px 0 0 20px;
    margin-bottom: 1rem;
  }

  ol > li {
    margin-bottom: 1rem;
    list-style-type: decimal;
    // 表达式,修复有序列表序号展示不全的问题
    // &:nth-child(n + 10) {
    //     margin-left: 30px;
    // }

    // &:nth-child(n + 100) {
    //     margin-left: 30px;
    // }
  }

  ul > li {
    margin-right: 11px;
    margin-bottom: 1rem;
    font-size: 16px;
    line-height: 24px;
    color: #3b3e55; // var(--color-G900);
    list-style-type: disc;
  }

  ol ul,
  ol ul > li,
  ul ul,
  ul ul li {
    margin-bottom: 1rem;
    margin-left: 6px;
    // list-style: circle;
    font-size: 16px;
    list-style: none;
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
