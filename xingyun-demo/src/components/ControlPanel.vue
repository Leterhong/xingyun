<template>
  <div class="control-panel">
    <div class="control-header">
      <h3>控制面板</h3>
    </div>

    <div class="control-content">
      <!-- 状态显示 -->
      <div class="status-section">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>当前状态</span>
            </div>
          </template>
          <div class="status-grid">
            <div class="status-item">
              <el-icon :size="20" :color="isConnected ? '#67c23a' : '#909399'">
                <Connection />
              </el-icon>
              <span>{{ isConnected ? '已连接' : '未连接' }}</span>
            </div>
            <div class="status-item">
              <el-icon :size="20" :color="isSpeaking ? '#409eff' : '#909399'">
                <ChatLineRound />
              </el-icon>
              <span>{{ isSpeaking ? '说话中' : '静默' }}</span>
            </div>
            <div class="status-item">
              <el-icon :size="20" :color="isListening ? '#e6a23c' : '#909399'">
                <Microphone />
              </el-icon>
              <span>{{ isListening ? '听取中' : '未听取' }}</span>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 控制按钮 -->
      <div class="action-section">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>操作控制</span>
            </div>
          </template>
          <div class="action-buttons">
            <el-button
              type="success"
              :icon="Microphone"
              :disabled="!isConnected || isListening"
              @click="handleStartVoice"
              size="large"
              style="width: 100%;"
            >
              开始语音输入
            </el-button>
            
            <el-button
              type="warning"
              :icon="CircleClose"
              :disabled="!isListening"
              @click="handleStopVoice"
              size="large"
              style="width: 100%;"
            >
              停止语音输入
            </el-button>

            <el-button
              type="danger"
              :icon="Close"
              :disabled="!isConnected || !isSpeaking"
              @click="handleInterrupt"
              size="large"
              style="width: 100%;"
            >
              打断说话
            </el-button>
          </div>
        </el-card>
      </div>

      <!-- 快捷操作 -->
      <div class="quick-actions">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>快捷操作</span>
            </div>
          </template>
          <div class="quick-buttons">
            <el-button 
              :icon="Star"
              @click="sendQuickMessage('你好，请介绍一下自己')"
              :disabled="!isConnected"
            >
              自我介绍
            </el-button>
            <el-button 
              :icon="DataAnalysis"
              @click="sendQuickMessage('帮我分析一下最近的销售数据')"
              :disabled="!isConnected"
            >
              数据分析
            </el-button>
            <el-button 
              :icon="DataLine"
              @click="sendQuickMessage('展示销售趋势图表')"
              :disabled="!isConnected"
            >
              趋势图表
            </el-button>
            <el-button 
              :icon="Document"
              @click="sendQuickMessage('生成数据报告')"
              :disabled="!isConnected"
            >
              生成报告
            </el-button>
          </div>
        </el-card>
      </div>

      <!-- 使用提示 -->
      <div class="tips-section">
        <el-alert
          title="使用提示"
          type="info"
          :closable="false"
          show-icon
        >
          <ul style="margin: 8px 0; padding-left: 20px;">
            <li>点击"开始语音输入"按钮进行语音对话</li>
            <li>在聊天面板输入文字问题，按 Ctrl+Enter 发送</li>
            <li>可使用快捷操作快速体验功能</li>
            <li>说话时可随时点击"打断说话"按钮</li>
          </ul>
        </el-alert>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  Connection, 
  ChatLineRound, 
  Microphone, 
  CircleClose, 
  Close,
  Star,
  DataAnalysis,
  DataLine,
  Document
} from '@element-plus/icons-vue'

const props = defineProps<{
  isConnected: boolean
  isSpeaking: boolean
  isListening: boolean
}>()

const emit = defineEmits<{
  startVoice: []
  stopVoice: []
  interrupt: []
  quickMessage: [text: string]
}>()

const handleStartVoice = () => {
  emit('startVoice')
}

const handleStopVoice = () => {
  emit('stopVoice')
}

const handleInterrupt = () => {
  emit('interrupt')
}

const sendQuickMessage = (text: string) => {
  emit('quickMessage', text)
}
</script>

<style scoped>
.control-panel {
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;
  max-height: 500px;
}

.control-panel:hover {
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.control-header {
  padding: 18px 24px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05));
  border-bottom: 2px solid rgba(102, 126, 234, 0.1);
}

.control-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-header h3::before {
  content: '🎮';
  font-size: 20px;
}

.control-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  overflow-y: auto;
  background: #fafbfc;
}

.control-content :deep(.el-card) {
  border-radius: 12px;
  border: 1px solid #e4e7ed;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.control-content :deep(.el-card:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border-color: #c0c4cc;
}

.control-content :deep(.el-card__header) {
  padding: 14px 18px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.03), rgba(118, 75, 162, 0.03));
  border-bottom: 1px solid #e4e7ed;
}

.control-content :deep(.el-card__body) {
  padding: 18px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #303133;
  font-size: 15px;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px 12px;
  background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
  border-radius: 10px;
  border: 1px solid #e4e7ed;
  transition: all 0.3s ease;
  cursor: default;
}

.status-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #c0c4cc;
}

.status-item span {
  font-size: 13px;
  font-weight: 500;
  color: #606266;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-buttons .el-button {
  border-radius: 10px;
  font-weight: 500;
  padding: 12px 20px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.action-buttons .el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.quick-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.quick-buttons .el-button {
  border-radius: 8px;
  font-size: 13px;
  padding: 10px 12px;
  transition: all 0.3s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.quick-buttons .el-button:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.tips-section {
  margin-top: auto;
}

.tips-section :deep(.el-alert) {
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05));
}

.tips-section ul {
  font-size: 13px;
  line-height: 1.9;
  color: #606266;
  margin: 8px 0;
  padding-left: 20px;
}

.tips-section li {
  margin: 6px 0;
  position: relative;
}

.tips-section li::marker {
  color: #409eff;
}

/* 滚动条样式 */
.control-content::-webkit-scrollbar {
  width: 8px;
}

.control-content::-webkit-scrollbar-track {
  background: #f5f7fa;
  border-radius: 4px;
}

.control-content::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #c0c4cc, #909399);
  border-radius: 4px;
  transition: background 0.3s;
}

.control-content::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #909399, #606266);
}

/* 响应式 */
@media (max-width: 768px) {
  .status-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  
  .status-item {
    padding: 12px 8px;
  }
  
  .quick-buttons {
    grid-template-columns: 1fr;
  }
}
</style>

