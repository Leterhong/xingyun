# 魔珐星云 - 路演数字人

基于魔珐星云具身驱动SDK的3D数字人AI助手应用，支持文本对话、语音交互和数据分析功能。

## ✨ 功能特性

- 🤖 **3D数字人展示** - 基于魔珐星云SDK的实时3D数字人渲染与驱动
- 💬 **智能对话** - 集成大模型（豆包、DeepSeek、通义千问等）实现自然对话
- 🎙️ **语音交互** - 支持语音识别输入（需配置ASR服务）
- 📊 **数据分析** - 专业的BI数据分析能力
- 🎨 **现代UI** - 基于Element Plus的美观界面设计
- ⚡ **流式输出** - 支持大模型流式响应，体验更流畅

## 🚀 快速开始

### 环境要求

- Node.js >= 16.x
- 现代浏览器（支持WebGL 2.0）
  - Chrome >= 90
  - Edge >= 90
  - Firefox >= 88
  - Safari >= 14.1

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

应用将在 `http://localhost:5173` 启动（注意：必须使用 localhost 或 https，SDK不支持 IP 地址访问）

### 生产构建

```bash
npm run build
```

### 预览构建结果

```bash
npm run preview
```

## 📝 配置说明

首次运行时，需要在配置页面填写以下信息：

### 1. 魔珐星云配置

1. 访问 [魔珐星云平台](https://xingyun3d.com/)
2. 在应用中心创建驱动应用
3. 选择角色、音色、表演风格
4. 获取 `App ID` 和 `App Secret`

### 2. 大模型配置

支持多种大模型：

#### 豆包（字节跳动）
- 模型：`doubao-pro-32k` 或 `doubao-lite-32k`
- 获取API Key：[火山引擎](https://console.volcengine.com/ark)

#### DeepSeek
- 模型：`deepseek-chat`
- 获取API Key：[DeepSeek平台](https://platform.deepseek.com/)

#### 通义千问（阿里云）
- 模型：`qwen-plus`
- 获取API Key：[阿里云](https://dashscope.console.aliyun.com/)

#### ChatGPT
- 模型：`gpt-4` 或 `gpt-3.5-turbo`
- 获取API Key：[OpenAI](https://platform.openai.com/)

### 3. 语音识别配置（可选）

如需语音输入功能，可配置：

- **腾讯云实时语音识别**：[文档](https://cloud.tencent.com/product/asr)
- **阿里云实时语音识别**：[文档](https://ai.aliyun.com/nls)

## 🎮 使用指南

### 文本对话

1. 在聊天面板的输入框中输入问题
2. 按 `Ctrl + Enter` 或点击发送按钮
3. 数字人将通过语音和动作进行回答

### 语音对话（需配置ASR）

1. 点击"开始语音输入"按钮
2. 对着麦克风说话
3. 系统自动识别并发送给AI
4. 数字人进行语音回答

### 快捷操作

控制面板提供了常用的快捷操作按钮：
- 自我介绍
- 数据分析
- 趋势图表
- 生成报告

### 打断说话

在数字人说话时，可以点击"打断说话"按钮立即停止。

## 🏗️ 项目结构

```
xingyun-bi-analyst/
├── src/
│   ├── components/          # Vue 组件
│   │   ├── AvatarPanel.vue     # 数字人面板
│   │   ├── ChatPanel.vue       # 聊天面板
│   │   ├── ControlPanel.vue    # 控制面板
│   │   └── SettingsForm.vue    # 配置表单
│   ├── services/            # 业务服务
│   │   ├── xingyun.ts          # 魔珐星云SDK封装
│   │   ├── llm.ts              # 大模型服务
│   │   └── asr.ts              # 语音识别服务
│   ├── App.vue              # 主应用组件
│   └── main.ts              # 应用入口
├── index.html               # HTML模板（引入SDK）
├── package.json             # 依赖配置
└── README.md               # 项目说明
```

## 🔧 技术栈

- **前端框架**：Vue 3 + TypeScript
- **UI组件库**：Element Plus
- **构建工具**：Vite
- **3D数字人**：魔珐星云具身驱动SDK
- **大模型**：豆包/DeepSeek/通义千问/ChatGPT
- **HTTP客户端**：Axios
- **加密工具**：CryptoJS

## 📚 SDK文档

### 数字人状态

| 状态 | 说明 | API方法 |
|------|------|---------|
| idle | 待机等待 | `idle()` |
| interactive_idle | 待机互动 | `interactiveidle()` |
| listen | 倾听状态 | `listen()` |
| think | 思考状态 | `think()` |
| speak | 说话状态 | `speak(text, isStart, isEnd)` |
| offlineMode | 离线模式 | `offlineMode()` |
| onlineMode | 在线模式 | `onlineMode()` |

### 流式对话最佳实践

```typescript
// 1. 切换到思考状态
xingyunService.think()

// 2. 流式调用LLM
let isFirst = true
let buffer = ''

await llmService.sendStream(text, (chunk, done) => {
  buffer += chunk
  
  // 首次积攒20-30字
  if (isFirst && buffer.length >= 20) {
    xingyunService.speak(buffer, true, false)
    buffer = ''
    isFirst = false
  }
  // 后续每10字发送一次
  else if (!isFirst && buffer.length >= 10) {
    xingyunService.speak(buffer, false, false)
    buffer = ''
  }
  
  // 最后一次
  if (done && buffer) {
    xingyunService.speak(buffer, isFirst, true)
  }
})

// 3. 回到待机状态
setTimeout(() => {
  xingyunService.interactiveidle()
}, 1000)
```

## ⚠️ 注意事项

1. **域名限制**：SDK仅支持 `localhost` 或 `https` 协议，不支持 IP 地址访问
2. **浏览器兼容性**：需要支持 WebGL 2.0 和 Web Audio API
3. **配置保密**：API Key 等敏感信息存储在 localStorage 中，请勿在生产环境直接使用
4. **积分消耗**：在线模式会消耗魔珐星云的积分，调试时建议使用基础音色
5. **speak限制**：不允许连续多次调用 speak（即 `is_end=true` 后立即再次 speak），需要先切换到 `interactive_idle` 或 `listen` 状态

## 🐛 常见问题

### Q: 初始化失败，提示"容器不存在"？
A: 确保组件已挂载，且 `containerId` 对应的DOM元素存在。

### Q: 通过IP地址访问会报错？
A: SDK仅支持 localhost 或 https 协议访问。

### Q: 如何避免积分消耗过快？
A: 
- 使用基础音色进行调试
- 长时间不用时切换到离线模式
- 合理控制对话频率

### Q: 语音识别不工作？
A: 
- 检查麦克风权限
- 确认已配置ASR服务
- 查看浏览器控制台的错误信息

### Q: 大模型响应缓慢？
A: 
- 检查网络连接
- 尝试切换到其他模型
- 确认API Key有效且有额度

## 📄 开源协议

MIT License

## 🔗 相关链接

- [魔珐星云官网](https://xingyun3d.com/)
- [魔珐星云SDK文档](https://xingyun3d.com/docs)
- [豆包大模型](https://www.volcengine.com/products/doubao)
- [Element Plus](https://element-plus.org/)
- [Vue 3](https://vuejs.org/)

## 👥 贡献

欢迎提交 Issue 和 Pull Request！

## 📮 联系方式

如有定制需求或技术支持，请联系魔珐星云官方。
