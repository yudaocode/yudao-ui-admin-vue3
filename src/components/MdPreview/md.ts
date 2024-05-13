
// @ts-ignore
import markdownit from 'markdown-it';
import hljs from 'highlight.js'; // https://highlightjs.org
import katexPlugin from '@iktakahiro/markdown-it-katex';
const codeTool = (text: string) => `<svg id="copy" class="icon" aria-hidden="true"
style="font-size:16px;display: inline-block;color:#fff;position:absolute;right:8px;top:6px;cursor:pointer;"
data-copy="${text}">
  <use xlink:href="#gt-line-copy"></use>
</svg>`;

const md = markdownit({
    html: true,
    linkfy: true,
    highlight: function (str: string, lang: string) {
        const baseText = str
        if (lang && hljs.getLanguage(lang)) {
            try {
                return '<pre><code class="hljs">' +
                    hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                    '</code>' + codeTool(baseText) + '</pre>';
            } catch (__) { }
        }
        return '<pre><code class="hljs">' + md.utils.escapeHtml(str) + '</code>' + codeTool(baseText) + '</pre>';
    }
});

md.use(katexPlugin);

export default md;
