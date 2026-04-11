import { generateUUID } from '@/utils'
import { localeProps, makeRequiredRule } from '@/components/FormCreate/src/utils'

/**
 * iframe 组件规则
 */
export const useIframeRule = () => {
  const label = '网页 iframe'
  const name = 'IframeComponent'

  return {
    icon: 'icon-link',
    label,
    name,
    rule() {
      return {
        type: name,
        field: generateUUID(),
        title: label,
        info: '',
        $required: false
      }
    },
    props(_, { t }) {
      return localeProps(t, name + '.props', [
        makeRequiredRule(),
        {
          type: 'input',
          field: 'url',
          title: 'URL 地址',
          value: '',
          info: '请输入完整的 HTTP 或 HTTPS 地址'
        },
        {
          type: 'input',
          field: 'height',
          title: 'iframe 高度',
          value: '500px',
          info: '支持 px、%、vh 等单位'
        },
        {
          type: 'input',
          field: 'width',
          title: 'iframe 宽度',
          value: '100%',
          info: '支持 px、%、vw 等单位'
        },
        {
          type: 'select',
          field: 'loading',
          title: '加载方式',
          value: 'lazy',
          options: [
            { label: '懒加载', value: 'lazy' },
            { label: '立即加载', value: 'eager' }
          ]
        },
        {
          type: 'switch',
          field: 'allowfullscreen',
          title: '允许全屏',
          value: true
        },
        {
          type: 'input',
          field: 'sandbox',
          title: 'sandbox 属性',
          value: '',
          info: '安全沙箱限制，如：allow-scripts allow-same-origin'
        }
      ])
    }
  }
}
