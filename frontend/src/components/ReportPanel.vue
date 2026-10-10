<script setup lang="ts">
import { computed, ref } from 'vue'
import { BEHAVIOR_LABELS, RISK_COLORS, type AlarmRecord } from '@/types'
import CitationList from './CitationList.vue'
import RiskLevelTag from './RiskLevelTag.vue'

const props = defineProps<{ record: AlarmRecord }>()
const emit = defineEmits<{ feedback: [useful: boolean] }>()

const activeCitation = ref<number | null>(null)
const feedbackGiven = ref<boolean | null>(null)

const report = computed(() => props.record.report)
const color = computed(() => RISK_COLORS[report.value.risk_level])
const score = computed(() => Math.round(report.value.risk_score * 100))
const behaviorLabel = computed(() => BEHAVIOR_LABELS[props.record.behavior])
const timeText = computed(() =>
  new Date(props.record.created_at).toLocaleString('zh-CN', { hour12: false }),
)

function onFeedback(useful: boolean): void {
  feedbackGiven.value = useful
  emit('feedback', useful)
}
</script>

<template>
  <div class="report">
    <header class="report-head">
      <div class="head-line">
        <RiskLevelTag :level="report.risk_level" :score="report.risk_score" />
        <span class="muted">{{ timeText }}</span>
      </div>
      <h3 class="report-title">{{ report.title }}</h3>
      <div class="head-meta muted">
        <span>编号 {{ report.alarm_id }}</span>
        <span v-if="report.event_id">事件 {{ report.event_id }}</span>
        <span>{{ behaviorLabel }}</span>
        <span>{{ record.house_id }}</span>
      </div>
    </header>

    <section class="block">
      <div class="block-title">风险评分</div>
      <div class="score-row">
        <el-progress
          :percentage="score"
          :color="color"
          :stroke-width="12"
          :show-text="false"
          style="flex: 1"
        />
        <b :style="{ color }">{{ score }}</b>
      </div>
    </section>

    <section class="block">
      <div class="block-title">现象描述</div>
      <p class="text">{{ report.phenomenon }}</p>
    </section>

    <section class="block">
      <div class="block-title">可能诱因</div>
      <ol class="items">
        <li v-for="(item, index) in report.causes" :key="'cause-' + index">
          <span class="text">{{ item.text }}</span>
          <span class="refs">
            <button
              v-for="idx in item.citations || []"
              :key="'cause-ref-' + index + '-' + idx"
              type="button"
              class="ref"
              @click="activeCitation = idx"
            >
              [{{ idx }}]
            </button>
          </span>
        </li>
      </ol>
    </section>

    <section class="block">
      <div class="block-title">处置建议</div>
      <ol class="items">
        <li v-for="(item, index) in report.actions" :key="'action-' + index">
          <span class="text">{{ item.text }}</span>
          <span class="refs">
            <button
              v-for="idx in item.citations || []"
              :key="'action-ref-' + index + '-' + idx"
              type="button"
              class="ref"
              @click="activeCitation = idx"
            >
              [{{ idx }}]
            </button>
          </span>
        </li>
      </ol>
    </section>

    <section class="block">
      <div class="block-title">引用来源（{{ report.citations.length }}）</div>
      <CitationList
        :citations="report.citations"
        :active="activeCitation"
        @select="(idx) => (activeCitation = idx)"
      />
    </section>

    <footer class="report-foot">
      <p class="disclaimer">{{ report.disclaimer }}</p>
      <div class="feedback">
        <span class="muted">这份报告对你有帮助吗？</span>
        <el-button-group>
          <el-button size="small" :type="feedbackGiven === true ? 'primary' : 'default'" @click="onFeedback(true)">
            有用
          </el-button>
          <el-button size="small" :type="feedbackGiven === false ? 'danger' : 'default'" @click="onFeedback(false)">
            无用
          </el-button>
        </el-button-group>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.report {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.report-head {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--color-border);
}

.head-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.report-title {
  margin: 0;
  font-size: 18px;
  line-height: 1.4;
}

.head-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.score-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.block-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-primary-dark);
  margin-bottom: 8px;
  padding-left: 8px;
  border-left: 3px solid var(--color-primary);
}

.text {
  margin: 0;
  line-height: 1.7;
  font-size: 13px;
}

.items {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.items li {
  line-height: 1.7;
  font-size: 13px;
}

.refs {
  display: inline-flex;
  gap: 3px;
  margin-left: 4px;
  vertical-align: baseline;
}

.ref {
  border: none;
  background: #eef6ee;
  color: var(--color-primary);
  font-size: 11px;
  font-weight: 700;
  border-radius: 4px;
  padding: 0 3px;
  cursor: pointer;
  line-height: 16px;
}

.ref:hover {
  background: var(--color-primary);
  color: #fff;
}

.report-foot {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 14px;
  border-top: 1px solid var(--color-border);
}

.disclaimer {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-sub);
  background: #faf7ec;
  border-radius: 6px;
  padding: 8px 10px;
}

.feedback {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
