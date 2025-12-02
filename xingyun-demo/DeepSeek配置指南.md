# DeepSeek 配置指南

## 📋 概述

DeepSeek 是一个强大的大模型，特别擅长代码和推理任务，性价比极高。本指南将帮助你快速配置 DeepSeek API。

---

## 🚀 快速配置

### 1. 获取 API Key

#### 步骤1：访问 DeepSeek 平台
访问：[https://platform.deepseek.com/](https://platform.deepseek.com/)

#### 步骤2：注册/登录账号
- 使用邮箱或手机号注册
- 验证邮箱/手机
- 登录账号

#### 步骤3：创建 API Key
1. 进入控制台
2. 点击"API Keys"
3. 点击"Create API Key"
4. 复制生成的 API Key（格式：`sk-xxxxxxxxxxxxxxxx`）

⚠️ **重要**：API Key 只显示一次，请立即保存！

---

## ⚙️ 项目配置

### 方法1：通过界面配置（推荐）

1. 启动项目：
```bash
npm run dev
```

2. 点击右上角"配置"按钮

3. 填写配置信息：
   - **模型**：选择 `deepseek-chat`
   - **API Key**：粘贴你的 DeepSeek API Key

4. 点击"保存配置"

5. 刷新页面

### 方法2：通过 localStorage 配置

在浏览器控制台执行：

```javascript
// 设置模型
localStorage.setItem('llm_model', 'deepseek-chat')

// 设置 API Key
localStorage.setItem('llm_apiKey', 'sk-xxxxxxxxxxxxxxxx')

// 刷新页面
location.reload()
```

---

## 🔧 代码实现说明

### 1. 自动识别 baseURL

项目已自动配置 DeepSeek 的 baseURL，无需手动设置：

```typescript
// src/services/llm.ts
private getDefaultBaseURL(model: string): string {
  if (model.startsWith('deepseek')) {
    return 'https://api.deepseek.com'
  }
  // ... 其他模型
}
```

### 2. API 调用方式

使用原生 Fetch API（无需安装 OpenAI SDK）：

```typescript
const response = await fetch('https://api.deepseek.com/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'deepseek-chat',
    messages: conversationHistory,
    stream: true  // 流式输出
  })
})
```

### 3. 流式响应处理

```typescript
const reader = response.body?.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  
  const chunk = decoder.decode(value, { stream: true })
  const lines = chunk.split('\n')
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6).trim()
      if (data === '[DONE]') continue
      
      const json = JSON.parse(data)
      const content = json.choices?.[0]?.delta?.content || ''
      if (content) {
        // 处理内容
        onChunk(content, false)
      }
    }
  }
}
```

---

## 📝 支持的模型

| 模型名称 | 模型ID | 特点 | 价格 |
|---------|--------|------|------|
| DeepSeek Chat | `deepseek-chat` | 通用对话 | 极低 |
| DeepSeek Coder | `deepseek-coder` | 代码专用 | 极低 |

本项目默认使用：`deepseek-chat`

---

## 🔍 常见问题

### Q1: API 调用失败，显示 401 错误

**原因**：API Key 无效或未正确配置

**解决方法**：
1. 检查 API Key 是否正确复制（包括 `sk-` 前缀）
2. 确认 API Key 未过期
3. 在 DeepSeek 平台检查 API Key 状态

### Q2: API 调用失败，显示 429 错误

**原因**：请求频率超限或余额不足

**解决方法**：
1. 检查账户余额
2. 降低请求频率
3. 升级账户套餐

### Q3: 返回空响应

**原因**：网络问题或 API 响应格式异常

**解决方法**：
1. 检查网络连接
2. 查看浏览器控制台错误信息
3. 确认 API 服务状态

### Q4: 需要使用 OpenAI SDK 吗？

**回答**：不需要！

本项目使用原生 Fetch API，优点：
- ✅ 无需安装额外依赖
- ✅ 代码更轻量
- ✅ 更好的浏览器兼容性
- ✅ 完整支持流式响应

如果你想使用 OpenAI SDK，可以这样做：

```bash
# 安装 SDK
npm install openai

# 然后在代码中使用
import OpenAI from "openai"

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: 'sk-xxxxxxxxxxxxxxxx',
})

const stream = await openai.chat.completions.create({
  model: "deepseek-chat",
  messages: [{ role: "user", content: "你好" }],
  stream: true,
})

for await (const chunk of stream) {
  console.log(chunk.choices[0]?.delta?.content || '')
}
```

但这会增加约 2MB 的包体积，不推荐在前端使用。

---

## 🎯 测试配置

配置完成后，可以发送以下测试消息：

### 测试1：基础对话
```
你好，请介绍一下自己
```

**预期响应**：DeepSeek 会介绍自己的功能和特点

### 测试2：代码能力
```
写一个 Python 快速排序算法
```

**预期响应**：提供完整的代码实现和解释

### 测试3：推理能力
```
如果一个房间里有5个人，每人握手一次，总共握手多少次？
```

**预期响应**：10次（5×4÷2），并给出推理过程

---

## 💰 价格说明

DeepSeek 价格极低，是最具性价比的选择：

| 项目 | 价格 |
|------|------|
| 输入 | ¥0.001 / 1K tokens |
| 输出 | ¥0.002 / 1K tokens |

**示例计算**：
- 输入500字 ≈ 750 tokens
- 输出1000字 ≈ 1500 tokens
- 总价格 ≈ ¥0.001 × 0.75 + ¥0.002 × 1.5 = ¥0.00375

即：一次完整对话约 0.004 元！

---

## 🔐 安全建议

### 1. 保护 API Key
- ❌ 不要提交到 Git 仓库
- ❌ 不要分享给他人
- ❌ 不要硬编码在前端代码中
- ✅ 使用环境变量或后端代理

### 2. 生产环境建议

**推荐架构**：

```
前端 (Vue)
  ↓ 用户消息
后端 (Node.js/Python)
  ↓ API Key（后端管理）
DeepSeek API
```

**后端代理示例**（Node.js + Express）：

```javascript
// server.js
import express from 'express'

const app = express()
app.use(express.json())

app.post('/api/chat', async (req, res) => {
  const { message } = req.body
  
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: message }],
      stream: true
    })
  })
  
  // 转发流式响应
  response.body.pipe(res)
})

app.listen(3000)
```

### 3. 限流建议
- 设置请求频率限制
- 添加用户认证
- 记录 API 使用量

---

## 📊 性能对比

| 模型 | 响应速度 | 代码能力 | 推理能力 | 价格 |
|------|---------|---------|---------|------|
| DeepSeek | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 极低 |
| 豆包 Pro | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 中等 |
| GPT-4 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 高 |

---

## 🎓 学习资源

- [DeepSeek 官方文档](https://platform.deepseek.com/docs)
- [API 参考](https://platform.deepseek.com/api-docs)
- [价格说明](https://platform.deepseek.com/pricing)

---

## ✅ 配置检查清单

配置 DeepSeek 前，请确认：

- [ ] 已注册 DeepSeek 账号
- [ ] 已创建并保存 API Key
- [ ] 账户有足够余额
- [ ] 已在项目中配置模型为 `deepseek-chat`
- [ ] 已配置 API Key
- [ ] 已刷新页面
- [ ] 已测试发送消息

---

## 🆘 获取帮助

如果遇到问题：

1. **检查错误信息**
   - 打开浏览器开发者工具（F12）
   - 查看 Console 标签的错误
   - 查看 Network 标签的请求响应

2. **常见错误码**
   - `401`: API Key 无效
   - `429`: 请求过于频繁或余额不足
   - `500`: DeepSeek 服务异常

3. **联系支持**
   - DeepSeek 官方文档
   - 项目 GitHub Issues
   - 技术交流群

---

**配置完成后，你就可以使用 DeepSeek 强大的 AI 能力了！** 🎉

性价比极高，适合各种场景使用！💰✨

