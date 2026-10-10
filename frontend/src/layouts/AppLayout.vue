<script setup lang="ts">
import { computed, type Component } from 'vue'
import { useRoute } from 'vue-router'
import { Bell, ChatDotRound, DataAnalysis, Monitor, UploadFilled } from '@element-plus/icons-vue'
import { USE_MOCK } from '@/api'
import { useAlarmStore } from '@/stores/alarm'

interface NavItem {
  path: string
  title: string
  icon: Component
}

const route = useRoute()
const alarmStore = useAlarmStore()

const navItems: NavItem[] = [
  { path: '/', title: '监控预警台', icon: Monitor },
  { path: '/simulate', title: '事件模拟控制台', icon: DataAnalysis },
  { path: '/alarms', title: '告警中心', icon: Bell },
  { path: '/chat', title: '智能问答', icon: ChatDotRound },
  { path: '/kb', title: '知识库管理', icon: UploadFilled },
]

const activePath = computed(() => route.path)
const pageTitle = computed(() => String(route.meta.title ?? '监控预警台'))
const today = new Date().toLocaleDateString('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
</script>

<template>
  <el-container class="layout">
    <el-aside width="216px" class="aside">
      <div class="brand">
        <div class="logo">鹅</div>
        <div class="brand-text">
          <b>鹅疫智答</b>
          <span>风险预警平台</span>
        </div>
      </div>

      <el-menu :default-active="activePath" router class="menu">
        <el-menu-item v-for="item in navItems" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.title }}</span>
          <el-badge
            v-if="item.path === '/alarms' && alarmStore.unread > 0"
            :value="alarmStore.unread"
            class="menu-badge"
          />
        </el-menu-item>
      </el-menu>

      <div class="aside-foot">
        <el-tag :type="USE_MOCK ? 'warning' : 'success'" size="small" effect="dark">
          {{ USE_MOCK ? 'MOCK 演示模式' : '已连接后端' }}
        </el-tag>
        <p class="foot-note">一期 · L0 事件模拟器</p>
      </div>
    </el-aside>

    <el-container>
      <el-header class="header">
        <h1 class="header-title">{{ pageTitle }}</h1>
        <div class="header-right muted">
          <span>事件驱动 Agentic-RAG 多智能体</span>
          <span>{{ today }}</span>
        </div>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.layout {
  height: 100%;
}

.aside {
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #1b5e20 0%, #14471a 100%);
  color: #e8f5e9;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 16px 14px;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.16);
  font-weight: 700;
  font-size: 16px;
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.brand-text b {
  font-size: 15px;
}

.brand-text span {
  font-size: 11px;
  opacity: 0.75;
}

.menu {
  flex: 1;
  border-right: none;
  background: transparent;
  padding: 0 8px;
}

.menu :deep(.el-menu-item) {
  height: 44px;
  border-radius: 8px;
  margin-bottom: 4px;
  color: #cfe8d1;
}

.menu :deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.menu :deep(.el-menu-item.is-active) {
  background: #ffffff;
  color: var(--color-primary-dark);
  font-weight: 600;
}

.menu-badge {
  margin-left: auto;
}

.aside-foot {
  padding: 14px 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.foot-note {
  margin: 0;
  font-size: 11px;
  opacity: 0.7;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  height: 58px;
}

.header-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.main {
  background: var(--color-bg);
  padding: 16px;
  overflow-y: auto;
}
</style>
