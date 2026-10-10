<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { Delete, Promotion, VideoPause } from '@element-plus/icons-vue'
import { CHAT_SUGGESTIONS, api } from '@/api'
import CitationList from '@/components/CitationList.vue'
import RiskLevelTag from '@/components/RiskLevelTag.vue'
import { useChatStore } from '@/stores/chat'
import { RISK_LABELS, type AlarmRecord, type ChatMode } from '@/types'

const chatStore = useChatStore()

const input = ref('')
const listRef = ref<HTMLDivElement | null>(null)
const alarmOptions = ref<AlarmRecord[]>([])

const modes: { value: ChatMode; label: string }[] = [
  { value: 'qa', label: '知识问答' },
  { value: 'report', label: '研判报告' },
]

function onModeChange(value: string | number | boolean | undefined): void {
  chatStore.setMode(value === 'report' ? 'report' : 'qa')
}

async function send(): Promise<void> {
  const text = input.value.trim()
  if (!text || chatStore.streaming) return
  input.value = ''
  await chatStore.send(text)
}

function useSuggestion(text: string): void {
  input.value = text
  void send()
}

function pickAlarm(alarmId: string | null): void {
  chatStore.setContext(alarmId)
}

function scrollToBottom(): void {
  const el = listRef.value
  if (el) el.scrollTop = el.scrollHeight
}

watch(
  () => {
    const last = chatStore.messages[chatStore.messages.length - 1]
    return chatStore.messages.length + '|' + (last ? last.content.length : 0)
  },
  () => {
    void nextTick(scrollToBottom)
  },
)

onMounted(async () => {
  alarmOptions.value = await api.recentAlarms(10)
})
</script>

<template>
  <div class="page chat-page">
    <div class="panel toolbar">
      <el-radio-group
        :model-value="chatStore.mode"
        @update:model-value="onModeChange"
      >
        <el-radio-button v-for="mode in modes" :key="mode.value" :value="mode.value">
          {{ mode.label }}
        </el-radio-button>
      </el-radio-group>

      <div v-if="chatStore.mode === 'report'" class="toolbar-item">
        <span class="label">关联告警</span>
        <el-select
          :model-value="chatStore.contextAlarmId"
          placeholder="选择一条告警记录"
          clearable
          style="width: 300px"
          @update:model-value="pickAlarm"
        >
          <el-option
            v-for="record in alarmOptions"
            :key="record.alarm_id"
            :label="RISK_LABELS[record.report.risk_level] + ' · ' + record.report.title"
            :value="record.alarm_id"
          />
        </el-select>
      </div>

      <div class="toolbar-actions">
        <el-button size="small" :icon="Delete" @click="chatStore.clear()">清空会话</el-button>
      </div>
    </div>

    <div ref="listRef" class="panel message-list scroll-area">
      <el-empty
        v-if="!chatStore.messages.length"
        description="输入问题开始对话，例如「雏鹅跛行可能是什么原因？」"
        :image-size="90"
      />

      <div v-for="message in chatStore.messages" :key="message.id" class="message" :class="message.role">
        <div class="avatar" :class="message.role">{{ message.role === 'user' ? '我' : 'AI' }}</div>
        <div class="bubble">
          <div v-if="message.role === 'assistant'" class="bubble-head">
            <RiskLevelTag v-if="message.riskLevel" :level="message.riskLevel" />
            <span v-if="message.elapsedMs" class="muted">
              耗时 {{ (message.elapsedMs / 1000).toFixed(1) }} 秒
            </span>
          </div>

          <div class="content">{{ message.content }}<span v-if="message.streaming" class="cursor">▍</span></div>

          <div v-if="message.error" class="error">错误：{{ message.error }}</div>

          <div v-if="message.citations.length" class="citations">
            <CitationList :citations="message.citations" />
          </div>
        </div>
      </div>
    </div>

    <div class="panel composer">
      <div class="suggestions">
        <el-tag
          v-for="text in CHAT_SUGGESTIONS"
          :key="text"
          class="suggestion"
          type="info"
          effect="plain"
          @click="useSuggestion(text)"
        >
          {{ text }}
        </el-tag>
      </div>
      <el-input
        v-model="input"
        type="textarea"
        :rows="3"
        resize="none"
        placeholder="请输入问题，Shift + Enter 换行，Enter 直接发送"
        @keydown.enter.exact.prevent="send"
      />
      <div class="composer-actions">
        <span class="muted">
          会话通道：POST /api/v1/chat/stream（SSE 流式，事件 meta / delta / citation / done）
        </span>
        <div>
          <el-button v-if="chatStore.streaming" :icon="VideoPause" @click="chatStore.stop()">
            停止生成
          </el-button>
          <el-button
            type="primary"
            :icon="Promotion"
            :loading="chatStore.streaming"
            @click="send"
          >
            发送
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-page {
  height: 100%;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.toolbar-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label {
  font-size: 13px;
  color: var(--color-text-sub);
}

.toolbar-actions {
  margin-left: auto;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 320px;
  max-height: calc(100vh - 380px);
}

.message {
  display: flex;
  gap: 12px;
}

.message.user {
  flex-direction: row-reverse;
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 700;
  flex: none;
}

.avatar.user {
  background: var(--color-primary);
  color: #fff;
}

.avatar.assistant {
  background: #eef6ee;
  color: var(--color-primary-dark);
}

.bubble {
  max-width: 76%;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  background: #fff;
}

.message.user .bubble {
  background: #eef6ee;
  border-color: #c8e6c9;
}

.bubble-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.content {
  white-space: pre-wrap;
  line-height: 1.75;
  font-size: 13px;
}

.cursor {
  color: var(--color-primary);
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

.error {
  margin-top: 8px;
  font-size: 12px;
  color: var(--risk-high);
}

.citations {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--color-border);
}

.composer {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.suggestions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.suggestion {
  cursor: pointer;
}

.composer-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
</style>
