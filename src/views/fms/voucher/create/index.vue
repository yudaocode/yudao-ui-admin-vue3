<template>
  <doc-alert title="【凭证】凭证管理" url="https://doc.iocoder.cn/fms/voucher/" />

  <!-- 凭证操作 -->
  <ContentWrap>
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-8px [&_.el-button+_.el-button]:!ml-0">
        <el-button
          v-if="formData.id && currentAccountWritable && checkPermi(['fms:voucher:create'])"
          type="primary"
          @click="resetForm()"
        >
          新增
        </el-button>
        <el-button v-if="canSaveAndCreate" type="primary" @click="submitForm(true)">
          保存并新增
        </el-button>
        <el-button v-if="canSave" @click="submitForm(false)">保存</el-button>
        <el-button
          v-if="
            formData.id &&
            currentAccountWritable &&
            !isApproved &&
            !isClosingGenerated &&
            checkPermi(['fms:voucher:review'])
          "
          @click="handleReview(FMS_VOUCHER_STATUS.APPROVED)"
        >
          审核
        </el-button>
        <el-button
          v-if="
            formData.id &&
            currentAccountWritable &&
            isApproved &&
            !isClosingGenerated &&
            checkPermi(['fms:voucher:review'])
          "
          @click="handleReview(FMS_VOUCHER_STATUS.PENDING_REVIEW)"
        >
          反审核
        </el-button>
        <el-button
          v-if="
            formData.id &&
            currentAccountWritable &&
            !isApproved &&
            !isClosingGenerated &&
            checkPermi(['fms:voucher:delete'])
          "
          @click="handleDelete"
        >
          删除
        </el-button>
        <el-button
          v-if="formData.id && currentAccountWritable && checkPermi(['fms:voucher:create'])"
          @click="copyVoucher"
        >
          复制
        </el-button>
        <el-button v-if="formData.id && checkPermi(['fms:voucher:print'])" @click="printVoucher">
          打印
        </el-button>
        <el-dropdown v-if="!formData.id && !readOnly" trigger="click" @command="handleMoreCommand">
          <el-button>更多<Icon icon="ep:arrow-down" class="ml-5px" /></el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-if="checkPermi(['fms:config:voucher-template:create'])"
                command="saveTemplate"
              >
                保存为模板
              </el-dropdown-item>
              <el-dropdown-item command="applyTemplate">使用模板</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <div class="flex items-center gap-8px">
        <FmsVoucherShortcutHelp />
        <el-button
          circle
          :disabled="!previousVoucherId"
          title="上一张"
          @click="navigateVoucher(previousVoucherId)"
        >
          <Icon icon="ep:arrow-left" />
        </el-button>
        <el-button
          circle
          :disabled="!nextVoucherId"
          title="下一张"
          @click="navigateVoucher(nextVoucherId)"
        >
          <Icon icon="ep:arrow-right" />
        </el-button>
      </div>
    </div>
  </ContentWrap>

  <!-- 凭证表单 -->
  <ContentWrap>
    <div
      v-loading="loading"
      class="voucher-sheet relative border border-[var(--el-border-color)] border-solid border-t-4 border-t-[var(--el-color-primary)] bg-[var(--el-fill-color-lighter)] pb-18px pl-0 pr-28px pt-26px shadow-[var(--el-box-shadow-light)]"
    >
      <div
        class="mb-4px ml-28px text-center text-24px font-600 tracking-6px [font-family:STKaiti,KaiTi,serif]"
      >
        记账凭证
      </div>
      <div class="absolute right-28px top-34px font-600 text-[var(--el-text-color-secondary)]">
        {{ voucherPeriod }}
      </div>
      <div class="box-border flex min-h-60px items-center justify-between pl-24px">
        <div class="flex items-center gap-8px">
          <div class="flex items-center gap-8px">
            <span class="whitespace-nowrap font-600 text-[var(--el-text-color-regular)]">
              凭证字
            </span>
            <FmsVoucherWordSelect
              v-model="formData.voucherWordId"
              :options="voucherWords"
              :disabled="readOnly"
              class="!w-90px"
              placeholder="请选择凭证字"
              @update:model-value="refreshVoucherNumber"
            />
            <el-input
              v-model.number="formData.voucherNumber"
              :disabled="readOnly"
              :min="1"
              class="!w-110px [&_.el-input-group__append]:!px-8px"
              type="number"
            >
              <template #append>号</template>
            </el-input>
          </div>
          <el-date-picker
            v-model="formData.voucherTime"
            :clearable="false"
            :disabled="readOnly"
            :disabled-date="disableVoucherDate"
            type="date"
            value-format="x"
            class="!w-150px"
            @change="handleVoucherDateChange"
          />
        </div>
        <div
          class="flex items-center gap-8px whitespace-nowrap [&_.el-input]:!w-110px [&_.el-input-group__append]:!px-8px"
        >
          <span>附单据</span>
          <el-input
            v-model.number="formData.attachmentCount"
            :disabled="readOnly"
            :min="0"
            type="number"
          >
            <template #append>张</template>
          </el-input>
        </div>
      </div>

      <div ref="entryTableWrapRef" class="overflow-x-auto" @keydown="handleEntryTableKeydown">
        <table
          class="entry-table w-full min-w-960px table-fixed border-collapse border-spacing-0 bg-[var(--el-bg-color)] [&_td]:border [&_td]:border-[var(--el-border-color)] [&_td]:border-solid [&_td]:align-middle [&_th]:h-48px [&_th]:border [&_th]:border-[var(--el-border-color)] [&_th]:border-solid [&_th]:bg-[var(--el-bg-color)] [&_th]:px-8px [&_th]:text-[var(--el-text-color-primary)] [&_th]:align-middle [&_tbody_td]:h-60px [&_tbody_td]:overflow-hidden [&_tbody_td]:px-8px [&_tfoot_td]:h-60px [&_tfoot_td]:overflow-hidden [&_tfoot_td]:px-8px"
        >
          <colgroup>
            <col class="w-26px" />
            <col class="w-[18.5%]" />
            <col class="entry-subject-column" />
            <col v-if="showQuantityColumn" class="w-[13.9%]" />
            <col class="w-[20.4%]" />
            <col class="w-[20.4%]" />
          </colgroup>
          <thead>
            <tr>
              <th
                class="!border-r-[var(--el-border-color)] !border-r-solid !border-[var(--el-fill-color-lighter)] !bg-[var(--el-fill-color-lighter)] !p-0 text-center"
              ></th>
              <th class="entry-digest relative !px-10px">摘要</th>
              <th class="entry-subject relative !px-10px">会计科目</th>
              <th v-if="showQuantityColumn" class="!px-4px text-center">数量</th>
              <th class="entry-money entry-money-header relative !p-0">
                <strong class="block h-25px leading-25px">借方金额</strong>
                <div
                  class="flex h-22px border-t border-[var(--el-border-color)] border-t-solid !bg-[var(--el-bg-color)] leading-22px [&>span:last-child]:border-r-0 [&>span:nth-child(4)]:border-r-[var(--el-color-primary-light-5)] [&>span:nth-child(8)]:border-r-[var(--el-color-primary-light-5)] [&>span:nth-child(9)]:border-r-[var(--el-color-danger-light-5)] [&>span]:box-border [&>span]:inline-flex [&>span]:h-full [&>span]:w-[calc(100%/11)] [&>span]:items-center [&>span]:justify-center [&>span]:border-r [&>span]:border-[var(--el-border-color-lighter)] [&>span]:border-r-solid [&>span]:text-12px [&>span]:font-400 [&>span]:text-[var(--el-text-color-secondary)]"
                >
                  <span v-for="(unit, index) in FMS_VOUCHER_MONEY_UNITS" :key="`debit-${index}`">
                    {{ unit }}
                  </span>
                </div>
              </th>
              <th class="entry-money entry-money-header relative !p-0">
                <strong class="block h-25px leading-25px">贷方金额</strong>
                <div
                  class="flex h-22px border-t border-[var(--el-border-color)] border-t-solid !bg-[var(--el-bg-color)] leading-22px [&>span:last-child]:border-r-0 [&>span:nth-child(4)]:border-r-[var(--el-color-primary-light-5)] [&>span:nth-child(8)]:border-r-[var(--el-color-primary-light-5)] [&>span:nth-child(9)]:border-r-[var(--el-color-danger-light-5)] [&>span]:box-border [&>span]:inline-flex [&>span]:h-full [&>span]:w-[calc(100%/11)] [&>span]:items-center [&>span]:justify-center [&>span]:border-r [&>span]:border-[var(--el-border-color-lighter)] [&>span]:border-r-solid [&>span]:text-12px [&>span]:font-400 [&>span]:text-[var(--el-text-color-secondary)]"
                >
                  <span v-for="(unit, index) in FMS_VOUCHER_MONEY_UNITS" :key="`credit-${index}`">
                    {{ unit }}
                  </span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(entry, index) in entries"
              :key="entry.rowKey"
              :data-entry-index="index"
              class="group"
            >
              <td
                class="!border-r-[var(--el-border-color)] !border-r-solid !border-[var(--el-fill-color-lighter)] !bg-[var(--el-fill-color-lighter)] !p-0 text-center"
              >
                <div
                  v-if="!readOnly"
                  class="flex h-full flex-col items-center justify-center opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100 [&_.el-button+_.el-button]:!ml-0"
                >
                  <el-dropdown
                    placement="right-start"
                    trigger="hover"
                    @command="handleInsertEntry($event, index)"
                  >
                    <el-button circle link title="插入分录">
                      <Icon icon="ep:circle-plus" />
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="before">从上方插入行</el-dropdown-item>
                        <el-dropdown-item command="after">从下方插入行</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                  <el-button
                    :disabled="entries.length <= 2"
                    circle
                    link
                    title="删除分录"
                    @click="deleteEntry(index)"
                  >
                    <Icon icon="ep:remove" />
                  </el-button>
                </div>
              </td>
              <td class="entry-digest relative !px-10px">
                <div v-if="readOnly" class="flex min-h-60px items-center px-2px leading-20px">
                  {{ entry.digest }}
                </div>
                <div v-else class="digest-editor relative flex h-full items-center justify-center">
                  <el-input
                    v-model="entry.digest"
                    maxlength="500"
                    placeholder=""
                    @focus="fillDigest(index)"
                  />
                  <el-button link type="primary" @click="openDigestLibrary(index)">
                    摘要库
                  </el-button>
                </div>
              </td>
              <td class="entry-subject relative !px-10px">
                <div v-if="readOnly" class="flex min-h-60px items-center px-2px leading-20px">
                  {{ formatEntrySubject(entry) }}
                </div>
                <template v-else>
                  <el-select
                    v-model="entry.subjectId"
                    filterable
                    placeholder=""
                    @change="handleSubjectChange(entry)"
                  >
                    <el-option
                      v-for="subject in getEntrySubjectOptions(entry)"
                      :key="subject.id"
                      :disabled="
                        subject.status !== FMS_SUBJECT_STATUS.ENABLED ||
                        Boolean(subject.children?.length)
                      "
                      :label="`${subject.code} ${subject.name}`"
                      :value="subject.id"
                    />
                    <template #footer>
                      <el-dropdown
                        v-hasPermi="['fms:config:subject:create']"
                        placement="bottom-start"
                        @command="openSubjectForm"
                        v-if="fmsStore.isAccountSetWritable"
                      >
                        <el-button link type="primary">
                          <Icon icon="ep:plus" /> 新增科目
                        </el-button>
                        <template #dropdown>
                          <el-dropdown-menu>
                            <el-dropdown-item
                              v-for="subjectType in subjectTypeOptions"
                              :key="subjectType.value"
                              :command="subjectType.value"
                            >
                              {{ subjectType.label }}类科目
                            </el-dropdown-item>
                          </el-dropdown-menu>
                        </template>
                      </el-dropdown>
                    </template>
                  </el-select>
                  <div
                    v-if="getSubject(entry.subjectId)?.auxiliaryTypeIds?.length"
                    class="mt-4px flex flex-wrap gap-4px"
                  >
                    <el-select
                      v-for="auxiliaryTypeId in getSubject(entry.subjectId)?.auxiliaryTypeIds"
                      :key="auxiliaryTypeId"
                      v-model="getEntryAuxiliary(entry, auxiliaryTypeId).itemId"
                      filterable
                      :placeholder="auxiliaryTypeMap.get(auxiliaryTypeId)?.name"
                      class="!w-[calc(50%-2px)]"
                      @change="loadEntryAuxiliaryBalance(entry)"
                    >
                      <el-option
                        v-for="item in auxiliaryOptions[auxiliaryTypeId] || []"
                        :key="item.id"
                        :label="`${item.code} ${item.name}`"
                        :value="item.id"
                      />
                      <template #footer>
                        <el-button
                          v-hasPermi="['fms:config:auxiliary:create']"
                          link
                          type="primary"
                          @click.stop="openAuxiliaryItemForm(auxiliaryTypeId)"
                          v-if="fmsStore.isAccountSetWritable"
                        >
                          <Icon icon="ep:plus" />
                          新增{{ auxiliaryTypeMap.get(auxiliaryTypeId)?.name }}
                        </el-button>
                      </template>
                    </el-select>
                  </div>
                </template>
                <div
                  v-if="entry.subjectId"
                  class="subject-balance pointer-events-none absolute bottom-1px left-10px hidden text-12px text-[var(--el-text-color-placeholder)]"
                >
                  余额：{{ formatEntryBalance(entry) }}
                </div>
              </td>
              <td v-if="showQuantityColumn" class="!px-4px text-center">
                <template v-if="getSubject(entry.subjectId)?.quantityAccounting">
                  <div
                    class="my-2px flex items-center justify-center gap-4px whitespace-nowrap text-12px [&_.el-input-number]:!w-64px"
                  >
                    <span>数量</span>
                    <el-input-number
                      v-model="entry.quantity"
                      :controls="false"
                      :disabled="readOnly"
                      :min="0"
                      :precision="4"
                      @change="calculateEntryAmount(entry)"
                    />
                    <span>{{ getSubject(entry.subjectId)?.quantityUnit }}</span>
                  </div>
                  <div
                    class="my-2px flex items-center justify-center gap-4px whitespace-nowrap text-12px [&_.el-input-number]:!w-64px"
                  >
                    <span>单价</span>
                    <el-input-number
                      v-model="entry.unitPrice"
                      :controls="false"
                      :disabled="readOnly"
                      :min="0"
                      :precision="6"
                      @change="calculateEntryAmount(entry)"
                    />
                  </div>
                </template>
                <span v-else class="text-[var(--el-text-color-placeholder)]">-</span>
              </td>
              <td class="entry-money relative !p-0" data-entry-money data-entry-direction="debit">
                <div class="money-editor relative h-60px">
                  <el-input-number
                    v-model="entry.debitAmount"
                    :controls="false"
                    :disabled="readOnly"
                    :precision="2"
                    @change="handleEntryAmountChange(entry, 'debit')"
                  />
                  <div
                    :class="{ 'text-[var(--el-color-danger)]': Number(entry.debitAmount) < 0 }"
                    class="money-cell-value pointer-events-none absolute inset-0 flex items-center justify-end"
                  >
                    <span
                      v-for="(digit, digitIndex) in getMoneyDigits(entry.debitAmount)"
                      :key="digitIndex"
                    >
                      {{ digit }}
                    </span>
                  </div>
                </div>
              </td>
              <td class="entry-money relative !p-0" data-entry-money data-entry-direction="credit">
                <div class="money-editor relative h-60px">
                  <el-input-number
                    v-model="entry.creditAmount"
                    :controls="false"
                    :disabled="readOnly"
                    :precision="2"
                    @change="handleEntryAmountChange(entry, 'credit')"
                  />
                  <div
                    :class="{ 'text-[var(--el-color-danger)]': Number(entry.creditAmount) < 0 }"
                    class="money-cell-value pointer-events-none absolute inset-0 flex items-center justify-end"
                  >
                    <span
                      v-for="(digit, digitIndex) in getMoneyDigits(entry.creditAmount)"
                      :key="digitIndex"
                    >
                      {{ digit }}
                    </span>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td class="entry-operation"></td>
              <td :colspan="showQuantityColumn ? 3 : 2" class="font-600">
                合计：{{ amountInWords }}
                <span v-if="!balanced" class="ml-16px text-[var(--el-color-danger)]">
                  借贷不平衡
                </span>
              </td>
              <td class="entry-money relative !p-0">
                <div
                  :class="{ 'text-[var(--el-color-danger)]': debitTotal < 0 }"
                  class="money-cell-value pointer-events-none absolute inset-0 flex h-60px items-center justify-end"
                >
                  <span v-for="(digit, index) in getMoneyDigits(debitTotal, true)" :key="index">
                    {{ digit }}
                  </span>
                </div>
              </td>
              <td class="entry-money relative !p-0">
                <div
                  :class="{ 'text-[var(--el-color-danger)]': creditTotal < 0 }"
                  class="money-cell-value pointer-events-none absolute inset-0 flex h-60px items-center justify-end"
                >
                  <span v-for="(digit, index) in getMoneyDigits(creditTotal, true)" :key="index">
                    {{ digit }}
                  </span>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div
        class="flex items-center justify-start gap-36px pb-0 pl-28px pr-0 pt-16px text-[var(--el-text-color-regular)]"
      >
        <span>制单人：{{ creatorUserName }}</span>
        <template v-if="formData.id">
          <span>审核人：{{ detail?.reviewerUserName || '-' }}</span>
          <el-tag :type="isApproved ? 'success' : 'warning'">
            {{ isApproved ? '已审核' : '待审核' }}
          </el-tag>
          <el-tag v-if="isClosingGenerated" type="info">结账生成凭证</el-tag>
        </template>
      </div>
      <div
        v-if="isApproved"
        class="pointer-events-none absolute right-[25%] top-12px z-3 rotate-[-12deg] rounded-[50%] border-3 border-[var(--el-color-danger)] border-double px-14px py-10px text-20px font-700 tracking-4px text-[var(--el-color-danger)] opacity-72"
      >
        审核通过
      </div>
    </div>
    <div v-if="canSave" class="mt-16px flex justify-end">
      <el-button v-if="canSaveAndCreate" type="primary" @click="submitForm(true)">
        保存并新增
      </el-button>
      <el-button @click="submitForm(false)">保存</el-button>
    </div>
  </ContentWrap>

  <!-- 凭证操作弹窗 -->
  <FmsVoucherTemplateSaveForm ref="templateSaveFormRef" />
  <FmsVoucherTemplateSelect ref="templateSelectRef" @select="applyTemplate" />
  <FmsDigestLibrary ref="digestLibraryRef" @select="applyDigest" />
  <FmsVoucherPrintForm ref="printFormRef" />
  <FmsSubjectForm ref="subjectFormRef" @success="refreshSubjectOptions" />
  <FmsAuxiliaryItemForm ref="auxiliaryItemFormRef" @success="refreshAuxiliaryItemOptions" />
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import { FmsAuxiliaryItemApi } from '@/api/fms/config/auxiliary/item'
import type { FmsAuxiliaryItemOptionVO } from '@/api/fms/config/auxiliary/item'
import { FmsAuxiliaryTypeApi } from '@/api/fms/config/auxiliary/type'
import type { FmsAuxiliaryTypeOptionVO } from '@/api/fms/config/auxiliary/type'
import { FmsAccountUserLevelEnum } from '@/api/fms/config/account-user'
import * as FmsSubjectApi from '@/api/fms/config/subject'
import type { FmsSubjectVO } from '@/api/fms/config/subject'
import type { FmsVoucherTemplateVO } from '@/api/fms/config/voucher-template'
import { FmsVoucherWordApi } from '@/api/fms/config/voucher-word'
import type { FmsVoucherWordVO } from '@/api/fms/config/voucher-word'
import { FmsVoucherApi } from '@/api/fms/voucher'
import type {
  FmsVoucherAuxiliaryItemVO,
  FmsVoucherSaveReqVO,
  FmsVoucherEntryVO,
  FmsVoucherSubjectBalanceVO,
  FmsVoucherVO
} from '@/api/fms/voucher'
import { useUserStore } from '@/store/modules/user'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { useFmsStore } from '@/views/fms/store/fms'
import {
  FMS_DEBIT_CREDIT_DIRECTION,
  FMS_SUBJECT_STATUS,
  FMS_VOUCHER_MONEY_UNITS,
  FMS_VOUCHER_STATUS
} from '@/views/fms/utils/constants'
import {
  formatPeriodLabel,
  formatSubjectBalance as formatSubjectBalanceText,
  formatSubjectDisplay,
  formatUppercaseMoney
} from '@/views/fms/utils/format'
import { formatDate } from '@/utils/formatTime'
import { checkPermi } from '@/utils/permission'
import { handleTree, treeToList } from '@/utils/tree'
import FmsVoucherTemplateSelect from '@/views/fms/config/voucher-template/components/FmsVoucherTemplateSelect.vue'
import FmsDigestLibrary from '@/views/fms/config/digest/components/FmsDigestLibrary.vue'
import FmsVoucherTemplateSaveForm from '@/views/fms/config/voucher-template/components/FmsVoucherTemplateSaveForm.vue'
import FmsVoucherWordSelect from '@/views/fms/config/voucher-word/components/FmsVoucherWordSelect.vue'
import FmsSubjectForm from '@/views/fms/config/subject/FmsSubjectForm.vue'
import FmsAuxiliaryItemForm from '@/views/fms/config/auxiliary/item/FmsAuxiliaryItemForm.vue'
import FmsVoucherShortcutHelp from './FmsVoucherShortcutHelp.vue'
import FmsVoucherPrintForm from '../components/FmsVoucherPrintForm.vue'

defineOptions({ name: 'FmsVoucherCreate' })

interface VoucherEntryForm extends Omit<FmsVoucherEntryVO, 'subjectId' | 'auxiliaries'> {
  rowKey: symbol
  subjectId?: number
  auxiliaries: Array<
    Omit<FmsVoucherAuxiliaryItemVO, 'itemId'> & {
      itemId?: number
    }
  >
}

const message = useMessage() // 消息弹窗
const route = useRoute()
const router = useRouter()
const fmsStore = useFmsStore()
const subjectTypeOptions = getIntDictOptions(DICT_TYPE.FMS_SUBJECT_TYPE)
const userStore = useUserStore()

const loading = ref(false) // 页面的加载中
const accountSetId = computed(() => fmsStore.getAccountSetId) // 当前账套编号
const voucherWords = ref<FmsVoucherWordVO[]>([]) // 凭证字列表
const subjects = ref<FmsSubjectVO[]>([]) // 会计科目树
const auxiliaryTypes = ref<FmsAuxiliaryTypeOptionVO[]>([]) // 辅助核算类别列表
const currentMonth = ref('') // 当前会计期间
const auxiliaryOptions = reactive<Record<number, FmsAuxiliaryItemOptionVO[]>>({}) // 辅助核算项目选项
const subjectBalances = ref<FmsVoucherSubjectBalanceVO[]>([]) // 科目余额列表
const auxiliaryBalances = reactive(new Map<symbol, FmsVoucherSubjectBalanceVO>()) // 分录辅助核算余额 Map
const detail = ref<FmsVoucherVO>() // 凭证详情
const formData = reactive({
  id: undefined as number | undefined,
  voucherWordId: undefined as number | undefined,
  voucherNumber: undefined as number | undefined,
  voucherTime: dayjs().startOf('day').valueOf(),
  attachmentCount: 0
}) // 凭证表单数据
const entries = ref<VoucherEntryForm[]>([]) // 凭证分录列表
const templateSaveFormRef = ref<InstanceType<typeof FmsVoucherTemplateSaveForm>>() // 凭证模板保存表单 Ref
const templateSelectRef = ref<InstanceType<typeof FmsVoucherTemplateSelect>>() // 凭证模板选择器 Ref
const digestLibraryRef = ref<InstanceType<typeof FmsDigestLibrary>>() // 常用摘要库 Ref
const digestEntryIndex = ref<number>() // 当前摘要分录索引
const entryTableWrapRef = ref<HTMLElement>() // 凭证分录表格 Ref
const printFormRef = ref<InstanceType<typeof FmsVoucherPrintForm>>() // 凭证打印表单 Ref
const subjectFormRef = ref<InstanceType<typeof FmsSubjectForm>>() // 科目表单 Ref
const auxiliaryItemFormRef = ref<InstanceType<typeof FmsAuxiliaryItemForm>>() // 辅助核算项目表单 Ref
const creatingAuxiliaryTypeId = ref<number>() // 正在新增项目的辅助核算类别编号

const flatSubjects = computed(() => treeToList<FmsSubjectVO[]>(subjects.value)) // 平铺会计科目列表
const leafSubjects = computed(() =>
  flatSubjects.value.filter(
    (subject) => !subject.children?.length && subject.status === FMS_SUBJECT_STATUS.ENABLED
  )
) // 可选末级会计科目列表
const auxiliaryTypeMap = computed(
  () => new Map(auxiliaryTypes.value.map((item) => [item.id!, item]))
) // 辅助核算类别 Map
const subjectBalanceMap = computed(
  () => new Map(subjectBalances.value.map((item) => [item.subjectId, item]))
) // 科目余额 Map
const isApproved = computed(() => detail.value?.status === FMS_VOUCHER_STATUS.APPROVED) // 凭证是否已审核
const isClosingGenerated = computed(() => Boolean(detail.value?.closingGenerated)) // 是否为结账生成凭证
const currentAccountWritable = computed(
  () =>
    fmsStore.getAccountSet?.level === FmsAccountUserLevelEnum.OWNER ||
    fmsStore.getAccountSet?.level === FmsAccountUserLevelEnum.WRITE
) // 当前账套是否可写
const savePermission = computed(() => (formData.id ? 'fms:voucher:update' : 'fms:voucher:create')) // 当前保存权限
const readOnly = computed(
  () =>
    isApproved.value ||
    isClosingGenerated.value ||
    !currentAccountWritable.value ||
    !checkPermi([savePermission.value])
) // 是否只读
const canSave = computed(() => !readOnly.value) // 是否可以保存
const canSaveAndCreate = computed(() => canSave.value && checkPermi(['fms:voucher:create'])) // 是否可以保存并新增
const voucherIds = computed(() =>
  String(route.query.ids || '')
    .split(',')
    .map(Number)
    .filter((id) => id > 0)
) // 当前列表凭证编号数组
const currentVoucherIndex = computed(() => voucherIds.value.indexOf(Number(route.query.id || 0))) // 当前凭证索引
const previousVoucherId = computed(() =>
  currentVoucherIndex.value > 0 ? voucherIds.value[currentVoucherIndex.value - 1] : undefined
) // 上一张凭证编号
const nextVoucherId = computed(() =>
  currentVoucherIndex.value >= 0 && currentVoucherIndex.value < voucherIds.value.length - 1
    ? voucherIds.value[currentVoucherIndex.value + 1]
    : undefined
) // 下一张凭证编号
const debitTotal = computed(() => sumAmount('debitAmount')) // 借方合计金额
const creditTotal = computed(() => sumAmount('creditAmount')) // 贷方合计金额
const balanced = computed(() => debitTotal.value === creditTotal.value) // 借贷金额是否平衡
const amountInWords = computed(() => (balanced.value ? formatUppercaseMoney(debitTotal.value) : '')) // 合计金额大写
const voucherPeriod = computed(() => {
  const month = formatDate(formData.voucherTime, 'YYYY-MM')
  return month ? formatPeriodLabel(month, month) : ''
}) // 凭证所属会计期间
const showQuantityColumn = computed(() =>
  entries.value.some((entry) => Boolean(getSubject(entry.subjectId)?.quantityAccounting))
) // 是否显示数量列
const creatorUserName = computed(
  () => detail.value?.creatorUserName || userStore.getUser.nickname || ''
) // 制单人名称

watch(accountSetId, () => init())
watch(
  () => [route.query.id, route.query.copyFrom],
  () => init()
)

/** 初始化录凭证页面 */
async function init() {
  const currentAccountSetId = accountSetId.value
  if (!currentAccountSetId) return
  auxiliaryBalances.clear()
  loading.value = true
  try {
    // 加载凭证录入依赖的基础数据
    const [wordList, subjectList, auxiliaryTypeList, accountingMonth] = await Promise.all([
      FmsVoucherWordApi.getVoucherWordSimpleList(currentAccountSetId),
      FmsSubjectApi.getSubjectSimpleList(currentAccountSetId),
      FmsAuxiliaryTypeApi.getAuxiliaryTypeSimpleList(currentAccountSetId),
      fmsStore.loadCurrentMonth()
    ])
    voucherWords.value = wordList
    subjects.value = handleTree(subjectList)
    auxiliaryTypes.value = auxiliaryTypeList
    Object.keys(auxiliaryOptions).forEach((key) => delete auxiliaryOptions[Number(key)])
    currentMonth.value = accountingMonth || dayjs().format('YYYY-MM')

    // 根据路由加载详情、复制来源或空白凭证
    const voucherId = Number(route.query.id || 0)
    if (voucherId) {
      await loadDetail(voucherId)
    } else if (Number(route.query.copyFrom || 0)) {
      await initializeCopiedVoucher(Number(route.query.copyFrom))
    } else {
      await resetForm(false)
    }
  } finally {
    loading.value = false
  }
}

/** 加载凭证详情 */
async function loadDetail(id: number) {
  const currentAccountSetId = accountSetId.value
  if (!currentAccountSetId) return
  const data = await FmsVoucherApi.getVoucher(currentAccountSetId, id)
  detail.value = data
  Object.assign(formData, {
    id: data.id,
    voucherWordId: data.voucherWordId,
    voucherNumber: data.voucherNumber,
    voucherTime: dayjs(data.voucherTime).startOf('day').valueOf(),
    attachmentCount: data.attachmentCount
  })
  entries.value = data.entries.map((entry) => ({
    ...entry,
    rowKey: Symbol(),
    auxiliaries: entry.auxiliaries.map((item) => ({ ...item }))
  }))
  padEntries()
  await Promise.all([
    loadSubjectBalances(dayjs(data.voucherTime).format('YYYY-MM')),
    ...entries.value.map((entry) => loadEntryAuxiliaryOptions(entry))
  ])
}

/** 初始化复制的凭证 */
async function initializeCopiedVoucher(id: number) {
  await loadDetail(id)
  const copiedEntries = entries.value.map((entry) => ({
    ...entry,
    id: undefined,
    rowKey: Symbol(),
    auxiliaries: entry.auxiliaries.map((item) => ({ ...item }))
  }))
  await resetForm(false)
  entries.value = copiedEntries
  padEntries()
  await Promise.all(entries.value.map((entry) => loadEntryAuxiliaryOptions(entry)))
  message.success('已复制凭证内容，请确认后保存')
}

/** 重置凭证表单 */
async function resetForm(updateRoute = true) {
  const currentAccountSetId = accountSetId.value
  if (!currentAccountSetId) return
  if (updateRoute && (route.query.id || route.query.copyFrom)) {
    await router.replace('/fms/voucher/create')
    return
  }
  detail.value = undefined
  auxiliaryBalances.clear()
  Object.assign(formData, {
    id: undefined,
    voucherWordId:
      voucherWords.value.find((item) => item.defaultStatus)?.id || voucherWords.value[0]?.id,
    voucherNumber: undefined,
    voucherTime: getDefaultVoucherTime(),
    attachmentCount: 0
  })
  entries.value = Array.from({ length: 4 }, () => createEmptyEntry())
  await Promise.all([
    refreshVoucherNumber(),
    loadSubjectBalances(dayjs(formData.voucherTime).format('YYYY-MM'))
  ])
}

/** 刷新凭证号 */
async function refreshVoucherNumber() {
  const currentAccountSetId = accountSetId.value
  const voucherWordId = formData.voucherWordId
  const voucherTime = formData.voucherTime
  if (formData.id || !currentAccountSetId || !voucherWordId || !voucherTime) return
  formData.voucherNumber = await FmsVoucherApi.getNextVoucherNumber(
    currentAccountSetId,
    voucherWordId,
    formatDate(voucherTime)
  )
}

/** 处理凭证日期变更 */
async function handleVoucherDateChange() {
  await Promise.all([
    refreshVoucherNumber(),
    loadSubjectBalances(dayjs(formData.voucherTime).format('YYYY-MM')),
    ...entries.value.map((entry) => loadEntryAuxiliaryBalance(entry))
  ])
}

/** 加载科目余额 */
async function loadSubjectBalances(month: string) {
  const currentAccountSetId = accountSetId.value
  if (!currentAccountSetId || !month) return
  subjectBalances.value = await FmsVoucherApi.getVoucherSubjectBalanceList(
    currentAccountSetId,
    month
  )
}

/** 获得默认凭证日期 */
function getDefaultVoucherTime() {
  if (!currentMonth.value || dayjs().format('YYYY-MM') === currentMonth.value) {
    return dayjs().startOf('day').valueOf()
  }
  return dayjs(`${currentMonth.value}-01`).endOf('month').startOf('day').valueOf()
}

/** 禁用当前会计期间前的日期 */
function disableVoucherDate(date: Date) {
  return Boolean(currentMonth.value) && dayjs(date).isBefore(`${currentMonth.value}-01`, 'day')
}

/** 创建空白凭证分录 */
function createEmptyEntry(): VoucherEntryForm {
  return { rowKey: Symbol(), digest: '', auxiliaries: [] }
}

/** 空摘要沿用上一条分录 */
function fillDigest(index: number) {
  if (index > 0 && !entries.value[index].digest?.trim()) {
    entries.value[index].digest = entries.value[index - 1].digest
  }
}

/** 提交前依次补齐空摘要，兼容未逐行聚焦的快速录入 */
function fillEntryDigests(entryList: VoucherEntryForm[]) {
  entryList.forEach((entry, index) => {
    if (index > 0 && !entry.digest?.trim()) {
      entry.digest = entryList[index - 1].digest
    }
  })
}

/** 新增凭证分录 */
function addEntry(index: number) {
  entries.value.splice(index, 0, createEmptyEntry())
}

/** 在当前分录上方或下方插入行 */
function handleInsertEntry(command: string, index: number) {
  addEntry(command === 'before' ? index : index + 1)
}

/** 删除凭证分录 */
function deleteEntry(index: number) {
  auxiliaryBalances.delete(entries.value[index].rowKey)
  entries.value.splice(index, 1)
}

/** 打开常用摘要库 */
function openDigestLibrary(index: number) {
  if (!accountSetId.value) return
  digestEntryIndex.value = index
  digestLibraryRef.value?.open(accountSetId.value)
}

/** 应用常用摘要 */
function applyDigest(digest: string) {
  if (digestEntryIndex.value === undefined) return
  entries.value[digestEntryIndex.value].digest = digest
  digestEntryIndex.value = undefined
}

/** 补足默认分录行 */
function padEntries() {
  while (entries.value.length < 4) entries.value.push(createEmptyEntry())
}

/** 处理会计科目变更 */
async function handleSubjectChange(entry: VoucherEntryForm) {
  auxiliaryBalances.delete(entry.rowKey)
  entry.quantity = undefined
  entry.unitPrice = undefined
  const subject = getSubject(entry.subjectId)
  entry.auxiliaries = (subject?.auxiliaryTypeIds || []).map((auxiliaryTypeId) => ({
    type: auxiliaryTypeMap.value.get(auxiliaryTypeId)?.type,
    typeId: auxiliaryTypeId
  }))
  await loadEntryAuxiliaryOptions(entry)
}

/** 加载分录的辅助核算选项 */
async function loadEntryAuxiliaryOptions(entry: VoucherEntryForm) {
  const subject = getSubject(entry.subjectId)
  const currentAccountSetId = accountSetId.value
  if (!subject?.auxiliaryTypeIds?.length || !currentAccountSetId) return
  await Promise.all(
    subject.auxiliaryTypeIds.map(async (auxiliaryTypeId) => {
      if (auxiliaryOptions[auxiliaryTypeId]) return
      const items = await FmsAuxiliaryItemApi.getAuxiliaryItemSimpleList(
        currentAccountSetId,
        auxiliaryTypeId
      )
      if (currentAccountSetId === accountSetId.value) {
        auxiliaryOptions[auxiliaryTypeId] = items
      }
    })
  )
  await loadEntryAuxiliaryBalance(entry)
}

/** 加载分录辅助核算组合余额 */
async function loadEntryAuxiliaryBalance(entry: VoucherEntryForm) {
  const currentAccountSetId = accountSetId.value
  const subject = getSubject(entry.subjectId)
  const auxiliaryTypeIds = subject?.auxiliaryTypeIds || []
  const auxiliaryItemIds = auxiliaryTypeIds.map(
    (typeId) => entry.auxiliaries.find((item) => item.typeId === typeId)?.itemId
  )
  if (
    !currentAccountSetId ||
    !subject ||
    auxiliaryTypeIds.length === 0 ||
    auxiliaryItemIds.some((itemId) => !itemId)
  ) {
    auxiliaryBalances.delete(entry.rowKey)
    return
  }
  const month = dayjs(formData.voucherTime).format('YYYY-MM')
  const subjectId = subject.id!
  const itemIds = auxiliaryItemIds as number[]
  const balance = await FmsVoucherApi.getVoucherAuxiliaryBalance(
    currentAccountSetId,
    month,
    subjectId,
    itemIds
  )
  if (
    currentAccountSetId === accountSetId.value &&
    month === dayjs(formData.voucherTime).format('YYYY-MM') &&
    subjectId === entry.subjectId &&
    itemIds.every(
      (itemId, index) =>
        entry.auxiliaries.find((item) => item.typeId === auxiliaryTypeIds[index])?.itemId === itemId
    )
  ) {
    auxiliaryBalances.set(entry.rowKey, balance)
  }
}

/** 打开新增科目表单 */
function openSubjectForm(subjectType: number) {
  subjectFormRef.value?.open('create', subjectType)
}

/** 刷新会计科目选项 */
async function refreshSubjectOptions() {
  const currentAccountSetId = accountSetId.value
  if (!currentAccountSetId) return
  subjects.value = handleTree(await FmsSubjectApi.getSubjectSimpleList(currentAccountSetId))
}

/** 打开新增辅助核算项目表单 */
function openAuxiliaryItemForm(auxiliaryTypeId: number) {
  const auxiliaryType = auxiliaryTypeMap.value.get(auxiliaryTypeId)
  if (!auxiliaryType) return
  creatingAuxiliaryTypeId.value = auxiliaryTypeId
  auxiliaryItemFormRef.value?.open(auxiliaryType)
}

/** 刷新当前辅助核算类别的项目选项 */
async function refreshAuxiliaryItemOptions() {
  const currentAccountSetId = accountSetId.value
  const auxiliaryTypeId = creatingAuxiliaryTypeId.value
  if (!currentAccountSetId || !auxiliaryTypeId) return
  auxiliaryOptions[auxiliaryTypeId] = await FmsAuxiliaryItemApi.getAuxiliaryItemSimpleList(
    currentAccountSetId,
    auxiliaryTypeId
  )
  creatingAuxiliaryTypeId.value = undefined
}

/** 获得分录的辅助核算项 */
function getEntryAuxiliary(entry: VoucherEntryForm, auxiliaryTypeId: number) {
  let auxiliary = entry.auxiliaries.find((item) => item.typeId === auxiliaryTypeId)
  if (!auxiliary) {
    auxiliary = {
      type: auxiliaryTypeMap.value.get(auxiliaryTypeId)?.type,
      typeId: auxiliaryTypeId
    }
    entry.auxiliaries.push(auxiliary)
  }
  return auxiliary
}

/** 获得会计科目 */
function getSubject(subjectId?: number) {
  return flatSubjects.value.find((subject) => subject.id === subjectId)
}

/** 获得分录可选会计科目，并保留当前已选的停用科目用于回显 */
function getEntrySubjectOptions(entry: VoucherEntryForm) {
  const currentSubject = getSubject(entry.subjectId)
  if (!currentSubject || leafSubjects.value.some((subject) => subject.id === currentSubject.id)) {
    return leafSubjects.value
  }
  return [...leafSubjects.value, currentSubject]
}

/** 格式化分录余额 */
function formatEntryBalance(entry: VoucherEntryForm) {
  const subject = getSubject(entry.subjectId)
  const balance = subject?.auxiliaryTypeIds?.length
    ? auxiliaryBalances.get(entry.rowKey)
    : subjectBalanceMap.value.get(entry.subjectId!)
  return formatSubjectBalanceText(balance?.balance, balance?.balanceDirection)
}

/** 格式化分录科目 */
function formatEntrySubject(entry: VoucherEntryForm) {
  const subject = getSubject(entry.subjectId)
  const subjectCode = readOnly.value ? entry.subjectCode || subject?.code : subject?.code
  const subjectName = readOnly.value ? entry.subjectName || subject?.name : subject?.name
  return formatSubjectDisplay(
    subjectCode,
    subjectName,
    entry.auxiliaries.map((item) => item.name)
  )
}

/** 根据数量和单价计算分录金额 */
function calculateEntryAmount(entry: VoucherEntryForm) {
  if (!entry.quantity || !entry.unitPrice) return
  const amount = Math.floor(entry.quantity * entry.unitPrice * 100) / 100
  if (getSubject(entry.subjectId)?.balanceDirection === FMS_DEBIT_CREDIT_DIRECTION.CREDIT) {
    entry.debitAmount = undefined
    entry.creditAmount = amount
  } else {
    entry.debitAmount = amount
    entry.creditAmount = undefined
  }
}

/** 处理借贷金额互斥 */
function handleEntryAmountChange(entry: VoucherEntryForm, direction: 'debit' | 'credit') {
  if (direction === 'debit' && entry.debitAmount !== undefined) {
    entry.creditAmount = undefined
  } else if (direction === 'credit' && entry.creditAmount !== undefined) {
    entry.debitAmount = undefined
  }
}

/** 汇总借方或贷方金额 */
function sumAmount(field: 'debitAmount' | 'creditAmount') {
  return Number(
    entries.value.reduce((total, entry) => total + Number(entry[field] || 0), 0).toFixed(2)
  )
}

/** 将金额转换为金额位数格内容 */
function getMoneyDigits(value?: number, showZero = false) {
  if (!showZero && !value) return []
  return String(Math.round(Math.abs(Number(value) || 0) * 100)).split('')
}

/** 处理分录表格快捷键 */
function handleEntryTableKeydown(event: KeyboardEvent) {
  if (readOnly.value || loading.value || event.isComposing) return
  const target = event.target as HTMLInputElement
  if (!(target instanceof HTMLInputElement)) return
  const entryRow = target.closest<HTMLTableRowElement>('tr[data-entry-index]')
  if (!entryRow) return
  const entryIndex = Number(entryRow.dataset.entryIndex)
  if (event.key === '=' && target.closest('[data-entry-money]')) {
    event.preventDefault()
    const direction = target.closest<HTMLElement>('[data-entry-direction]')?.dataset
      .entryDirection as 'debit' | 'credit' | undefined
    balanceEntry(entries.value[entryIndex], direction || 'debit')
    return
  }
  if (
    ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key) &&
    target.getAttribute('aria-expanded') !== 'true'
  ) {
    event.preventDefault()
    focusEntryInputByArrow(target, entryRow, event.key)
    return
  }
  if (event.key !== 'Enter' || target.getAttribute('aria-expanded') === 'true') return
  event.preventDefault()
  focusNextEntryInput(target)
}

/** 使用方向键切换分录输入框 */
function focusEntryInputByArrow(
  target: HTMLInputElement,
  entryRow: HTMLTableRowElement,
  key: string
) {
  if (key === 'ArrowLeft' || key === 'ArrowRight') {
    const entryInputs = getEntryInputs()
    const currentIndex = entryInputs.indexOf(target)
    entryInputs[currentIndex + (key === 'ArrowLeft' ? -1 : 1)]?.focus()
    return
  }
  const rows = Array.from(
    entryTableWrapRef.value?.querySelectorAll<HTMLTableRowElement>('tbody tr[data-entry-index]') ||
      []
  )
  const rowIndex = rows.indexOf(entryRow)
  const targetRow = rows[rowIndex + (key === 'ArrowUp' ? -1 : 1)]
  if (!targetRow) return
  const rowInputs = Array.from(entryRow.querySelectorAll<HTMLInputElement>('input:not([disabled])'))
  const targetInputs = Array.from(
    targetRow.querySelectorAll<HTMLInputElement>('input:not([disabled])')
  )
  targetInputs[Math.min(rowInputs.indexOf(target), targetInputs.length - 1)]?.focus()
}

/** 自动补平当前分录金额 */
function balanceEntry(entry: VoucherEntryForm, direction: 'debit' | 'credit') {
  const debitAmount = Number(entry.debitAmount || 0)
  const creditAmount = Number(entry.creditAmount || 0)
  const debitAmountWithoutEntry = Number((debitTotal.value - debitAmount).toFixed(2))
  const creditAmountWithoutEntry = Number((creditTotal.value - creditAmount).toFixed(2))
  const difference = creditAmountWithoutEntry - debitAmountWithoutEntry
  if (!difference) return
  if (direction === 'credit') {
    entry.creditAmount = Number((-difference).toFixed(2))
    entry.debitAmount = undefined
  } else {
    entry.debitAmount = Number(difference.toFixed(2))
    entry.creditAmount = undefined
  }
}

/** 聚焦下一项分录输入框 */
async function focusNextEntryInput(target: HTMLInputElement) {
  let entryInputs = getEntryInputs()
  const currentIndex = entryInputs.indexOf(target)
  if (currentIndex < 0) return
  if (currentIndex === entryInputs.length - 1) {
    addEntry(entries.value.length)
    await nextTick()
    entryInputs = getEntryInputs()
  }
  entryInputs[currentIndex + 1]?.focus()
}

/** 获得分录输入框 */
function getEntryInputs() {
  return Array.from(
    entryTableWrapRef.value?.querySelectorAll<HTMLInputElement>('tbody input:not([disabled])') || []
  )
}

/** 构建凭证保存参数 */
function buildPayload(): FmsVoucherSaveReqVO | undefined {
  const currentAccountSetId = accountSetId.value
  const voucherWordId = formData.voucherWordId
  const voucherNumber = formData.voucherNumber
  if (
    !currentAccountSetId ||
    !voucherWordId ||
    voucherNumber === undefined ||
    !formData.voucherTime
  ) {
    message.warning('请完整填写凭证字、凭证号和凭证日期')
    return
  }
  if (!Number.isInteger(voucherNumber) || voucherNumber <= 0) {
    message.warning('凭证号必须为正整数')
    return
  }
  if (!Number.isInteger(formData.attachmentCount) || formData.attachmentCount < 0) {
    message.warning('附单据张数必须为非负整数')
    return
  }
  const filledEntries = entries.value.filter((entry) => !isEntryEmpty(entry))
  if (filledEntries.length < 2) {
    message.warning('凭证至少需要两条有效分录')
    return
  }
  fillEntryDigests(filledEntries)
  if (filledEntries.some((entry) => !validateEntry(entry, true))) {
    return
  }
  if (!balanced.value) {
    message.warning('凭证借贷金额不平衡')
    return
  }
  return {
    ...formData,
    accountSetId: currentAccountSetId,
    voucherWordId,
    voucherNumber,
    entries: filledEntries.map(buildVoucherEntry)
  }
}

/** 构建凭证模板分录参数 */
function buildTemplateEntries(): FmsVoucherEntryVO[] | undefined {
  const filledEntries = entries.value.filter((entry) => !isEntryEmpty(entry))
  if (filledEntries.length < 2) {
    message.warning('凭证模板至少需要两条有效分录')
    return
  }
  fillEntryDigests(filledEntries)
  if (filledEntries.some((entry) => !validateEntry(entry, true))) {
    return
  }
  if (!balanced.value) {
    message.warning('凭证模板借贷金额不平衡')
    return
  }
  return filledEntries.map(buildVoucherEntry)
}

/** 构建凭证业务分录 */
function buildVoucherEntry(entry: VoucherEntryForm): FmsVoucherEntryVO {
  return {
    ...entry,
    subjectId: entry.subjectId!,
    auxiliaries: buildEntryAuxiliaries(entry)
  }
}

/** 判断分录是否完全空白 */
function isEntryEmpty(entry: VoucherEntryForm) {
  return !(
    entry.digest ||
    entry.subjectId ||
    entry.quantity ||
    entry.unitPrice ||
    entry.debitAmount ||
    entry.creditAmount ||
    entry.auxiliaries.some((item) => item.itemId)
  )
}

/** 校验凭证或模板分录 */
function validateEntry(entry: VoucherEntryForm, amountRequired: boolean) {
  const subject = getSubject(entry.subjectId)
  if (!subject) {
    message.warning('请选择每条分录的会计科目')
    return false
  }
  if (subject.status !== FMS_SUBJECT_STATUS.ENABLED || subject.children?.length) {
    message.warning(`会计科目“${subject.name}”已停用或不是末级科目，请重新选择`)
    return false
  }
  if (!entry.digest) {
    message.warning('请填写每条分录的摘要')
    return false
  }
  const debitAmount = Number(entry.debitAmount || 0)
  const creditAmount = Number(entry.creditAmount || 0)
  if (debitAmount !== 0 && creditAmount !== 0) {
    message.warning('同一条分录不能同时填写借方和贷方金额')
    return false
  }
  if (amountRequired && debitAmount === 0 && creditAmount === 0) {
    message.warning('请填写每条分录的借方或贷方金额')
    return false
  }
  const auxiliaryTypeIds = subject.auxiliaryTypeIds || []
  if (
    auxiliaryTypeIds.some(
      (typeId) => !entry.auxiliaries.find((item) => item.typeId === typeId)?.itemId
    )
  ) {
    message.warning(`请完整选择“${subject.name}”的辅助核算项目`)
    return false
  }
  return true
}

/** 构建当前科目要求的辅助核算项目 */
function buildEntryAuxiliaries(entry: VoucherEntryForm) {
  return (getSubject(entry.subjectId)?.auxiliaryTypeIds || []).map((typeId) => ({
    typeId,
    itemId: entry.auxiliaries.find((item) => item.typeId === typeId)!.itemId!
  }))
}

/** 处理更多操作 */
function handleMoreCommand(command: 'saveTemplate' | 'applyTemplate') {
  if (command === 'saveTemplate') {
    handleTemplateCommand('save')
  } else {
    handleTemplateCommand('apply')
  }
}

/** 处理凭证模板操作 */
function handleTemplateCommand(command: 'save' | 'apply') {
  if (!accountSetId.value) return
  if (command === 'apply') {
    templateSelectRef.value?.open(accountSetId.value)
    return
  }
  const templateEntries = buildTemplateEntries()
  if (!templateEntries) return
  templateSaveFormRef.value?.open(accountSetId.value, templateEntries)
}

/** 套用凭证模板 */
async function applyTemplate(template: FmsVoucherTemplateVO) {
  const unavailableSubject = template.entries.find((entry) => {
    const subject = getSubject(entry.subjectId)
    return !subject || subject.status !== FMS_SUBJECT_STATUS.ENABLED || subject.children?.length
  })
  if (unavailableSubject) {
    message.error('模板包含当前账套不可用的会计科目，暂不能套用')
    return
  }
  entries.value = template.entries.map((entry) => ({
    ...entry,
    rowKey: Symbol(),
    auxiliaries: entry.auxiliaries.map((item) => ({ ...item }))
  }))
  padEntries()
  await Promise.all(entries.value.map((entry) => loadEntryAuxiliaryOptions(entry)))
  message.success(`已套用凭证模板“${template.name}”`)
}

/** 提交凭证表单 */
async function submitForm(saveAndCreate: boolean) {
  // 校验并构建凭证保存参数
  const payload = buildPayload()
  if (!payload) return
  loading.value = true
  try {
    // 根据凭证编号创建或更新凭证
    const voucherId = payload.id
      ? (await FmsVoucherApi.updateVoucher(payload), payload.id)
      : await FmsVoucherApi.createVoucher(payload)
    message.success('保存成功')

    // 根据保存方式进入空白凭证或回显当前凭证
    if (saveAndCreate) {
      await resetForm()
    } else if (Number(route.query.id) === voucherId) {
      await loadDetail(voucherId)
    } else {
      await router.replace({
        path: '/fms/voucher/create',
        query: { id: voucherId }
      })
    }
  } finally {
    loading.value = false
  }
}

/** 审核或反审核凭证 */
async function handleReview(status: number) {
  if (!accountSetId.value || !formData.id) return
  try {
    await message.confirm(
      status === FMS_VOUCHER_STATUS.APPROVED ? '确认审核该凭证吗？' : '确认反审核该凭证吗？'
    )
    await FmsVoucherApi.updateVoucherReviewStatus(accountSetId.value, [formData.id], status)
    message.success('操作成功')
    await loadDetail(formData.id)
  } catch {}
}

/** 删除凭证 */
async function handleDelete() {
  if (!accountSetId.value || !formData.id) return
  try {
    await message.delConfirm('确认删除该凭证吗？删除后会产生凭证断号')
    await FmsVoucherApi.deleteVoucherList(accountSetId.value, [formData.id])
    message.success('删除成功')
    await resetForm()
  } catch {}
}

/** 复制凭证 */
async function copyVoucher() {
  if (!detail.value) return
  await router.replace({
    path: '/fms/voucher/create',
    query: { copyFrom: detail.value.id }
  })
}

/** 打印凭证 */
function printVoucher() {
  if (!accountSetId.value || !detail.value) return
  printFormRef.value?.open(accountSetId.value, fmsStore.getAccountSet?.companyName || '', [
    detail.value
  ])
}

/** 跳转到相邻凭证 */
function navigateVoucher(voucherId?: number) {
  if (!voucherId) return
  router.push({ path: '/fms/voucher/create', query: { ...route.query, id: voucherId } })
}

/** 处理页面快捷键 */
function handlePageShortcut(event: KeyboardEvent) {
  if (
    event.isComposing ||
    event.repeat ||
    loading.value ||
    (event.target as HTMLElement | null)?.closest('.el-dialog, .el-message-box')
  ) {
    return
  }
  const key = event.key.toLowerCase()
  if ((event.ctrlKey || event.metaKey) && key === 's') {
    event.preventDefault()
    if (!canSave.value) return
    submitForm(false)
  } else if (event.key === 'F12') {
    event.preventDefault()
    if (!canSaveAndCreate.value) return
    submitForm(true)
  } else if (event.altKey && key === 'n') {
    event.preventDefault()
    if (!currentAccountWritable.value || !checkPermi(['fms:voucher:create'])) return
    resetForm()
  }
}

/** 注册页面快捷键 */
function addPageShortcutListener() {
  window.addEventListener('keydown', handlePageShortcut)
}

/** 移除页面快捷键 */
function removePageShortcutListener() {
  window.removeEventListener('keydown', handlePageShortcut)
}

onMounted(() => {
  init()
  addPageShortcutListener()
})
onActivated(addPageShortcutListener)
onDeactivated(removePageShortcutListener)
onBeforeUnmount(removePageShortcutListener)
</script>

<style lang="scss" scoped>
.digest-editor :deep(.el-button) {
  position: absolute;
  right: 0;
  bottom: 2px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.entry-digest:hover .digest-editor :deep(.el-button),
.entry-digest:focus-within .digest-editor :deep(.el-button) {
  opacity: 1;
}

.entry-subject:hover .subject-balance,
.entry-subject:focus-within .subject-balance {
  display: block;
}

.entry-subject :deep(.el-select__suffix) {
  opacity: 0;
  transition: opacity 0.15s ease;
}

.entry-subject:hover :deep(.el-select__suffix),
.entry-subject:focus-within :deep(.el-select__suffix) {
  opacity: 1;
}

.entry-money :deep(.el-input__wrapper),
.entry-digest :deep(.el-input__wrapper),
.entry-subject :deep(.el-select__wrapper) {
  box-shadow: none;
}

.entry-table tbody .entry-money,
.entry-table tfoot .entry-money {
  background-image:
    linear-gradient(
      to right,
      transparent calc(36.36% - 1px),
      var(--el-color-primary-light-5) calc(36.36% - 1px),
      var(--el-color-primary-light-5) 36.36%,
      transparent 36.36%
    ),
    linear-gradient(
      to right,
      transparent calc(72.73% - 1px),
      var(--el-color-primary-light-5) calc(72.73% - 1px),
      var(--el-color-primary-light-5) 72.73%,
      transparent 72.73%
    ),
    linear-gradient(
      to right,
      transparent calc(81.82% - 1px),
      var(--el-color-danger-light-5) calc(81.82% - 1px),
      var(--el-color-danger-light-5) 81.82%,
      transparent 81.82%
    ),
    repeating-linear-gradient(
      to right,
      transparent 0,
      transparent calc(100% / 11 - 1px),
      var(--el-border-color-lighter) calc(100% / 11 - 1px),
      var(--el-border-color-lighter) calc(100% / 11)
    );
}

.money-editor :deep(.el-input-number) {
  position: absolute;
  z-index: 2;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
}

.money-editor:focus-within :deep(.el-input-number) {
  opacity: 1;
}

.money-editor:focus-within .money-cell-value {
  opacity: 0;
}

.entry-money :deep(.el-input__wrapper) {
  height: 60px;
  padding: 0 8px;
  background: var(--el-bg-color);
  box-shadow: none;
}

.entry-money :deep(.el-input__inner) {
  font-family: Arial, sans-serif;
  font-size: 16px;
  font-weight: 600;
  text-align: right;
}

.money-cell-value span {
  flex: 0 0 calc(100% / 11);
  font-family: Tahoma, Arial, sans-serif;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
}
</style>
