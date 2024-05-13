<script lang="ts" setup>
defineOptions({ name: "md-preview" });
import { copyText } from './copy';
import { onMounted, ref, watch, watchEffect, type Ref } from 'vue';
import 'highlight.js/styles/vs2015.min.css';
import md from "./md";
const markdown:Ref<any> = ref(null);
const sleep = (during:number) => {
  return new Promise(function(rs,rj){setTimeout(rs,during);})
};


const props = withDefaults(defineProps<{
    content: string; // md内容
    delay: boolean; // 延迟渲染
}>(), {
    content: "",
    delay: true,
});

const runing = ref(false);
const mdDelay = ref('');//延迟渲染的md内容
const mdContent = ref('');//延迟渲染的md html
const WORDS = 1;//打印字数
const interval = ref(Math.floor(1000 / 60));//最小间隔时长
const preTime = ref(0);

const render = async () => {
    if (props.content.length - mdDelay.value.length <= WORDS) {
        runing.value = false;
        mdDelay.value = props.content;
        mdContent.value = md.render(props.content);
    } else {
        runing.value = true;
        mdDelay.value = props.content.substring(0, mdDelay.value.length + WORDS);
        mdContent.value = md.render(mdDelay.value);
        await sleep(interval.value);
        await render();
    }
    mdContent.value = md.render(props.content);
};

watchEffect(() => {
    if (props.delay) {
        if (!runing.value) render();
    } else {
        // if (runing.value) return;
        mdDelay.value = props.content;
        mdContent.value = md.render(props.content);
    }
});

watch(() => props.content, (newVal, oldVal) => {
    const now = Date.now();
    if (preTime.value) {
        interval.value = Math.floor((now - preTime.value) / (newVal.length - oldVal.length));
        // console.log('间隔：', Math.floor((now - preTime.value)), 'ms', ' 每字间隔：', interval.value, 'ms', ' 变化字符：', newVal.replace(oldVal, ''));
    }
    preTime.value = now;
});
function addMarkdownEvent() {
    markdown.value.addEventListener('click', (e:any) => {
      if (e.target.id === 'copy') {
        copyText(e.target?.dataset?.copy);
      }
    })
}
onMounted(()=> {
    addMarkdownEvent();
})
</script>

<template>
    <div v-html="mdContent" ref="markdown" class="md-preview"></div>
</template>

<style lang="scss">
.md-preview {
    font-family: PingFang SC;
    font-size: 0.95rem;
    font-weight: 400;
    line-height: 1.6rem;
    letter-spacing: 0em;
    text-align: left;
    color: #3B3E55;
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
        @media screen and (min-width:1536px) {
            width: 960px;
        }

        @media screen and (max-width:1536px) and (min-width:1024px) {
            width: calc(100vw - 400px - 64px - 32px * 2);
        }

        @media screen and (max-width:1024px) and (min-width:768px) {
            width: calc(100vw - 32px * 2);
        }

        @media screen and (max-width:768px) {
            width: calc(100vw - 16px * 2);
        }
    }

    p,
    code.hljs {
        margin-bottom: 16px;
    }

    p {
        margin-bottom: 1rem !important;
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

    ol>li {
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

    ul>li {
        list-style-type: disc;
        font-size: 16px;
        line-height: 24px;
        margin-right: 11px;
        margin-bottom: 1rem;
        color: #3b3e55; // var(--color-G900);
    }

    ol ul,
    ol ul>li,
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
    ol ol>li,
    ol ul ul,
    ol ul ul>li,
    ul ol,
    ul ol>li {
        list-style: square;
    }
}
</style>
