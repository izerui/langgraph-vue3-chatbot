# LangGraph SDK 消息类型说明

本文档说明 @langchain/langgraph-sdk 返回的消息类型结构。

---

## 1. Message 消息类型

### 1.1 消息基本结构

```typescript
import { Message, ToolMessage, AIMessage } from "@langchain/langgraph-sdk";

// 消息基本结构
interface Message {
  id: string;                    // 消息唯一标识
  type: "human" | "ai" | "tool" | "system" | "function" | "remove";  // 消息类型
  content: string | MessageContentComplex[];  // 消息内容
  tool_calls?: ToolCall[];       // AI 调用的工具列表
  tool_call_id?: string;         // 工具调用 ID（用于 tool 类型消息）
}
```

### 1.2 MessageContent 内容块类型

支持多模态内容，来自 `@langchain/langgraph-sdk` 的实际类型定义：

```typescript
// 文本内容块
type MessageContentText = {
  type: "text";
  text: string;
};

// 图片内容块
type MessageContentImageUrl = {
  type: "image_url";
  image_url: string | {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

// 复杂内容块（文本或图片）
type MessageContentComplex = MessageContentText | MessageContentImageUrl;

// 消息内容可以是纯文本或复杂内容块数组
type MessageContent = string | MessageContentComplex[];
```

### 1.3 ToolCall 工具调用结构

```typescript
interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  type: "tool_call";
}
```

### 1.4 ToolCallChunk 增量工具调用结构

流式响应中，工具调用可能分多次返回，使用 `tool_call_chunks` 存储增量内容：

```typescript
interface ToolCallChunk {
  name: string;           // 工具名称
  args: string;          // 参数字符串（可能是部分 JSON）
  id: string;            // 工具调用 ID
  index: number;         // 工具调用索引
  type: "tool_call_chunk";
}
```

### 1.5 chunk_position 块位置标记

用于标识流式响应中的块位置：

```typescript
type ChunkPosition = "last" | null;
```

| 值 | 说明 |
|-----|------|
| `"last"` | 最后一块，表示流式响应完成 |
| `null` | 中间的增量块 |

### 1.6 消息类型说明

来自 `@langchain/langgraph-sdk` 的实际类型定义：

```typescript
type HumanMessage = BaseMessage & { type: "human" };
type AIMessage<ToolCall> = BaseMessage & { type: "ai"; tool_calls?: ToolCall[] };
type ToolMessage = BaseMessage & { type: "tool"; tool_call_id: string };
type SystemMessage = BaseMessage & { type: "system" };
type FunctionMessage = BaseMessage & { type: "function" };
type RemoveMessage = BaseMessage & { type: "remove" };

type Message<ToolCall> = HumanMessage | AIMessage<ToolCall> | ToolMessage | SystemMessage | FunctionMessage | RemoveMessage;
```

| type 值 | 说明 |
|---------|------|
| `human` | 用户消息 |
| `ai` | AI 响应 |
| `tool` | 工具执行结果 |
| `system` | 系统消息 |
| `function` | 函数消息 |
| `remove` | 删除消息标记 |

---

## 2. Thread 线程结构

### 2.1 线程基本信息

```typescript
interface Thread {
  thread_id: string;             // 线程 ID
  created_at: string;            // 创建时间
  updated_at: string;            // 更新时间
  status: "idle" | "busy" | "interrupted";  // 状态
  metadata?: {
    name?: string;               // 线程名称
    [key: string]: unknown;
  };
}
```

### 2.2 线程配置

```typescript
interface ThreadConfig {
  metadata?: {
    chat_title?: string;       // 聊天标题
    [key: string]: unknown;
  };
  configurable?: {
    model?: string;            // 模型名称
    model_provider?: string;   // 模型提供商
    base_url?: string;         // API 地址
    [key: string]: unknown;
  };
}
```

---

## 3. Stream 流式响应

### 3.1 streamMode 选项

LangGraph SDK 支持多种流式响应模式：

```typescript
// 推荐的消息流模式
streamMode: ['messages-tuple', 'custom']
```

| 模式 | 说明 |
|------|------|
| `messages-tuple` | 返回消息元组，包含 event 和 data |
| `custom` | 返回自定义事件 |

### 3.2 消息事件处理

```typescript
for await (const chunk of streamResponse) {
  const event = chunk.event;
  const data = chunk.data;

  // 检查是否是最后一块
  const isLastChunk = data?.chunk_position === 'last';

  // messages/partial: 流式输出中的增量内容
  if (event === 'messages' || event === 'messages/partial') {
    // data 是一个数组，第一个元素是消息
    const messageArray = Array.isArray(data) ? data : [data];
    const message = messageArray[0];

    // 获取文本内容
    let content = '';
    if (typeof message.content === 'string') {
      content = message.content;
    } else if (Array.isArray(message.content)) {
      content = message.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('');
    }

    // 获取工具调用（完整形式）
    const toolCalls = message.tool_calls || [];

    // 获取增量工具调用
    const toolCallChunks = message.tool_call_chunks || [];
  }

  // 流式响应完成
  if (isLastChunk) {
    console.log('流式响应完成');
  }
}
```

### 3.3 流式数据特点

| 特点 | 说明 |
|------|------|
| 增量内容 | `content` 是累积的增量，需要累加而不是覆盖 |
| 工具调用 | `tool_calls` 是完整的工具调用，`tool_call_chunks` 是增量 |
| 完成标记 | `chunk_position === 'last'` 表示最后一块 |

### 3.4 工具调用流程

工具调用分为 **4 个阶段**：

  - 阶段1：处理 tool_calls，只补充 id 和 name（如果 args 是空对象 {} 就不覆盖）                                                                                                                              
  - 阶段2：处理 tool_call_chunks，只累加有实际内容的 args
  - 阶段3：chunk_position = "last" 表示结束                                                                                                                                                                  
  - 阶段4：tool 消息返回结果 

#### 阶段 1：工具调用开始

当 AI 开始调用工具时，会发送 `AIMessageChunk` 消息，同时包含：
- `tool_calls`: 完整的工具调用信息（但 args 可能为空对象 `{}`）
- `tool_call_chunks`: 工具参数的第一个增量块（args 是字符串形式）

**注意**：`tool_call_chunks` 中的 `id` 和 `name` 可能为空，需要通过 `index` 来匹配同一个工具调用。

```json
{
  "type": "AIMessageChunk",
  "tool_calls": [{"name": "convert_to_markdown", "args": {}, "id": "call_7778a4257cfb462b890a46d6", "type": "tool_call"}],
  "tool_call_chunks": [{"name": "convert_to_markdown", "args": "", "id": "call_7778a4257cfb462b890a46d6", "index": 0, "type": "tool_call_chunk"}]
}
```

#### 阶段 2：args 流式

工具参数在流式输出时，只发送 `tool_call_chunks` 增量：

- `id` 可能为空字符串 `""`
- `name` 可能为 `null`
- `args` 是 JSON 字符串的片段，需要累加

```json
// 第一个增量
{
  "type": "AIMessageChunk",
  "tool_call_chunks": [{"name": "", "args": "{\"source_path\": \"/", "id": "", "index": 0}]
}

// 后续增量（id 仍为空）
{
  "type": "AIMessageChunk",
  "tool_call_chunks": [{"name": "", "args": "190118", "id": "", "index": 0}]
}

{
  "type": "AIMessageChunk",
  "tool_call_chunks": [{"name": "", "args": "0052张卓", "id": "", "index": 0}]
}

{
  "type": "AIMessageChunk",
  "tool_call_chunks": [{"name": "", "args": "}", "id": "", "index": 0}]
}
```

#### 阶段 3：调用结束

工具调用完成时，发送 `chunk_position: "last"`：

```json
{
  "type": "AIMessageChunk",
  "chunk_position": "last"
}
```

#### 阶段 4：工具结果返回

工具执行结果返回，发送 `type: "tool"` 消息：

```json
{
  "type": "tool",
  "content": "{\"success\": true, \"source_path\": \"/1901180052张卓群毕业论文3.docx\", \"output_file\": \"/1901180052张卓群毕业论文3.md\"}",
  "tool_call_id": "call_7778a4257cfb462b890a46d6",
  "name": "convert_to_markdown",
  "status": "success"
}
```

| 字段 | 说明 |
|------|------|
| `type` | 固定为 "tool" |
| `content` | 工具执行结果内容 |
| `tool_call_id` | 工具调用 ID（用于关联之前的参数） |
| `name` | 工具名称 |
| `status` | 执行状态 (success/error) |

### 3.5 工具调用参数获取实现

由于流式过程中 `tool_call_chunks` 的 `id` 可能为空，且同一个消息块中可能有多个工具调用，需要使用 `message.id + index` 复合键来匹配同一个工具调用。

#### 数据结构

```typescript
// 使用单个 Map 存储，key 为 messageId_index 格式
// messageId: 消息块 ID，index: 工具在消息块中的索引
const assistantToolCalls = new Map<string, { id: string; name: string; args: string }>()
```

#### 处理逻辑

```typescript
// 1. 处理 tool_calls - 工具调用开始（阶段1）
if (message.tool_calls) {
  const messageId = message.id
  for (const tc of message.tool_calls) {
    const index = message.tool_calls.indexOf(tc)
    const messageKey = `${messageId}_${index}`

    // 存储工具调用信息
    assistantToolCalls.set(messageKey, {
      id: tc.id,
      name: tc.name,
      args: JSON.stringify(tc.args, null, 2)
    })
  }
}

// 2. 处理 tool_call_chunks - 参数流式累加（阶段2）
if (message.tool_call_chunks) {
  const messageId = message.id
  for (const chunk of message.tool_call_chunks) {
    if (chunk.index === undefined) continue

    const messageKey = `${messageId}_${chunk.index}`

    let existing = assistantToolCalls.get(messageKey)
    if (!existing) {
      // 新建工具调用记录
      assistantToolCalls.set(messageKey, {
        id: chunk.id || '',
        name: chunk.name || '',
        args: chunk.args || ''
      })
    } else {
      // 累加参数（直接追加字符串）
      if (chunk.args) {
        existing.args += chunk.args
      }
      // 更新 id 和 name
      if (chunk.id && !existing.id) existing.id = chunk.id
      if (chunk.name) existing.name = chunk.name
    }
  }
}

// 3. 收到 tool 消息时，查找对应参数并释放内存（阶段4）
if (message.type === 'tool') {
  const toolCallId = message.tool_call_id

  // 遍历查找匹配的 tool call（通过 id 匹配）
  let toolArgs = ''
  for (const [key, tc] of assistantToolCalls) {
    if (tc.id === toolCallId) {
      toolArgs = tc.args
      // 找到后删除，释放内存
      assistantToolCalls.delete(key)
      break
    }
  }

  console.log('工具参数:', toolArgs)
  console.log('工具结果:', message.content)
}
```

#### 关键点

1. **使用 messageId_index 复合键**：`tool_call_chunks` 的 `id` 可能为空，必须用 `message.id`（消息块ID）+ `index`（工具索引）复合键来匹配同一个工具调用
2. **单一 Map 设计**：只用一个 Map 存储所有工具调用信息，简化逻辑
3. **内存释放**：在 tool 消息处理完成后，删除对应的 Map 条目，释放内存避免长时间占用
3. **直接追加字符串**：`args` 是 JSON 字符串的片段，直接累加即可

### 3.5 消息类型汇总

| type 值 | 说明 | 关键字段 |
|---------|------|----------|
| `AIMessageChunk` | AI 消息块（包含工具调用） | `tool_calls`, `tool_call_chunks`, `content`, `chunk_position` |
| `tool` | 工具执行结果 | `content`, `tool_call_id`, `name` |

---

## 4. API 端点

| 端点 | 方法 | 用途 |
|------|------|------|
| `/threads/search` | POST | 搜索线程列表 |
| `/threads/{thread_id}` | GET | 获取线程详情 |
| `/threads/{thread_id}/runs` | POST | 创建新运行（发送消息） |
| `/runs/stream` | GET | SSE 流式响应 |
| `/info` | GET | 服务器状态检查 |

---

## 5. 请求示例

### 5.1 创建线程并发送消息

```typescript
import { Client } from '@langchain/langgraph-sdk';

const client = new Client({ apiUrl: 'http://localhost:2024' });

// 1. 创建线程
const thread = await client.threads.create({
  metadata: { user_id: 'user001' }
});

// 2. 流式发送消息
const stream = client.runs.stream(
  thread.thread_id,
  'assistant-id',
  {
    input: {
      messages: [{
        id: crypto.randomUUID(),
        type: 'human',
        content: [{ type: 'text', text: '你好' }]
      }]
    },
    config: {
      configurable: {
        model_provider: 'openai',
        model: 'gpt-4o'
      }
    },
    streamMode: ['messages-tuple', 'custom']
  }
);

// 3. 处理流式响应
for await (const chunk of stream) {
  console.log(chunk.event, chunk.data);
}
```

### 5.2 配置参数

| 参数 | 说明 |
|------|------|
| `input.messages` | 发送的消息列表 |
| `config.configurable.model` | 选择的模型名称 |
| `config.configurable.model_provider` | 模型提供商 |
| `config.configurable.base_url` | 模型 API 地址 |
| `metadata.user_id` | 用户 ID，用于多用户隔离 |
