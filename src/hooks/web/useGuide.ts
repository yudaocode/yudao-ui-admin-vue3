import { Config, driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { useDesign } from '@/hooks/web/useDesign'
import { useI18n } from '@/hooks/web/useI18n'

const { t } = useI18n()

const { variables } = useDesign()

export const useGuide = (options?: Config) => {
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
