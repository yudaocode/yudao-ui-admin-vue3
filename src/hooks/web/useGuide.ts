import { Config, driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { useDesign } from '@/hooks/web/useDesign'
import { useI18n } from '@/hooks/web/useI18n'

const { variables } = useDesign()

export const useGuide = (options?: Config) => {
  // 本模块可能在 setupI18n 之前被加载，翻译函数在调用时再取，避免模块顶层绑定到原样返回 key 的函数
  const { t } = useI18n()
  const driverObj = driver(
    options || {
      showProgress: true,
      nextBtnText: t('common.nextLabel'),
      prevBtnText: t('common.prevLabel'),
      doneBtnText: t('common.doneLabel'),
      steps: [
        {
          element: `#${variables.namespace}-menu`,
          popover: {
            title: t('common.menu'),
            description: t('common.menuDes'),
            side: 'right'
          }
        },
        {
          element: `#${variables.namespace}-tool-header`,
          popover: {
            title: t('common.tool'),
            description: t('common.toolDes'),
            side: 'left'
          }
        },
        {
          element: `#${variables.namespace}-tags-view`,
          popover: {
            title: t('common.tagsView'),
            description: t('common.tagsViewDes'),
            side: 'bottom'
          }
        }
      ]
    }
  )

  return {
    ...driverObj
  }
}
