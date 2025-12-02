# 快速使用 DeepSeek（3分钟）

## ✅ 项目已支持 DeepSeek

好消息！项目代码已经完全支持 DeepSeek API，**无需安装 OpenAI SDK**！

---

## 🚀 3步配置

### 第1步：获取 API Key

访问 [DeepSeek 平台](https://platform.deepseek.com/)
1. 注册/登录账号
2. 创建 API Key
3. 复制 API Key（格式：`sk-xxxxxxxxxxxxxxxx`）

### 第2步：配置项目

启动项目后，点击右上角"配置"按钮：

```
模型：选择 deepseek-chat
API Key：粘贴你的 API Key
```

点击"保存配置"

### 第3步：测试

刷新页面后，发送消息：

```
你好，请介绍一下自己
```

如果 DeepSeek 正常回复，说明配置成功！✅

---

## 💡 为什么不需要 OpenAI SDK？

项目使用**原生 Fetch API**，优点：

- ✅ **无需安装依赖** - 零额外包体积
- ✅ **浏览器原生支持** - 兼容性更好
- ✅ **完整流式支持** - 体验流畅
- ✅ **代码更清晰** - 易于维护

---

## 🔍 如何验证配置

### 检查1：API Key 格式
```javascript
// 正确格式
sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

// 错误格式（缺少 sk- 前缀）
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 检查2：浏览器控制台
按 F12 打开控制台，查看是否有错误：

```javascript
// ✅ 正常
正在调用 DeepSeek API...
收到响应: {...}

// ❌ 错误
HTTP错误 401: Unauthorized
```

### 检查3：网络请求
在 Network 标签查看请求：

```
URL: https://api.deepseek.com/chat/completions
Method: POST
Status: 200 OK (成功) 或 401/429 (失败)
```

---

## 🎯 常见错误及解决

### 错误1: HTTP错误 401
**原因**：API Key 无效

**解决**：
1. 重新复制 API Key（确保包含 `sk-` 前缀）
2. 确认 API Key 未过期
3. 在 DeepSeek 平台检查状态

---

### 错误2: HTTP错误 429
**原因**：余额不足或请求过于频繁

**解决**：
1. 充值账户
2. 降低请求频率
3. 稍后重试

---

### 错误3: 网络错误
**原因**：无法访问 api.deepseek.com

**解决**：
1. 检查网络连接
2. 确认防火墙设置
3. 尝试使用代理

---

## 💰 价格优势

DeepSeek 价格极低，是最具性价比的选择！

**对话成本**：约 0.004 元/次

对比：
- DeepSeek：¥0.004/次 ⭐⭐⭐⭐⭐
- 豆包 Pro：¥0.02/次 ⭐⭐⭐⭐
- GPT-4：¥0.15/次 ⭐⭐

---

## 🔐 安全提示

⚠️ **开发环境**：可以在前端使用
⚠️ **生产环境**：建议使用后端代理

**后端代理的好处**：
- 保护 API Key 不暴露
- 统一管理和限流
- 记录使用情况
- 更安全可控

---

## 📚 相关文档

- [DeepSeek配置指南.md](./DeepSeek配置指南.md) - 详细配置说明
- [配置说明.md](./配置说明.md) - 完整配置文档
- [文本对话使用说明.md](./文本对话使用说明.md) - 使用教程

---

## ✨ 代码说明

**当前实现**（无需 OpenAI SDK）：

```typescript
// src/services/llm.ts
const response = await fetch('https://api.deepseek.com/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'deepseek-chat',
    messages: conversationHistory,
    stream: true
  })
})

// 处理流式响应
const reader = response.body?.getReader()
while (true) {
  const { done, value } = await reader.read()
  if (done) break
  // 解析并处理数据
}
```

**如果你想用 OpenAI SDK**（不推荐）：

```bash
npm install openai
```

```typescript
import OpenAI from "openai"

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: 'sk-xxx',
})

const stream = await openai.chat.completions.create({
  model: "deepseek-chat",
  messages: messages,
  stream: true,
})
```

但这会增加 ~2MB 包体积，不建议在浏览器使用。

---

## 🎉 总结

✅ **项目已完全支持 DeepSeek**
✅ **无需安装 OpenAI SDK**
✅ **配置简单，3步完成**
✅ **价格极低，性价比高**
✅ **代码轻量，性能好**

现在就去配置 DeepSeek，享受 AI 的强大能力吧！🚀

