# 对话续流实现说明

本文档说明 `langgraph-vue3-chatbot` 当前的“刷新页面后重新加入正在执行的对话流”实现方式、处理流程、已知边界和维护注意事项。

适用代码：

- `src/components/ai-bot/ChatBot.vue`
- `src/components/ai-bot/lib/thread.ts`

---

## 1. 目标

当宿主传入固定的 `threadId` 时，组件希望具备以下能力：

1. 页面刷新后还能恢复该线程的历史消息
2. 如果该线程上还有一个正在执行的 run，可以重新加入这个 run 的流
3. 加入后，新的 AI token 继续写回正确的 AI 消息，而不是错误地写到最后一条消息
4. 续流阶段避免自定义 `custom` 消息干扰当前正在打字的 AI 消息

---

## 2. 为什么需要续流

仅调用 `client.threads.getState(threadId)` 或 `loadThreadHistory(...)` 只能恢复“已经落盘的线程状态”，不能恢复一个仍在执行中的 SSE 流。

如果用户在对话进行中刷新页面，会出现两个问题：

1. 历史可以恢复，但新的 token 不再继续到前端
2. UI 可能停留在旧状态，看起来像对话中断

因此需要在恢复历史后额外检查该线程是否存在活跃 run，并调用：

```ts
client.runs.joinStream(threadId, runId, {
  streamMode: ['messages-tuple', 'custom']
})
```

---

## 3. 当前整体流程

### 3.1 初始化阶段

`ChatBot.vue` 的 `onMounted` 当前分两段：

1. 初始化基础数据
2. 初始化完成后再尝试续流

伪代码：

```ts
onMounted(async () => {
  isLoading.value = true

  await Promise.all([
    fetchModels(...),
    createThread + loadThreadHistory(...)
  ])

  isLoading.value = false

  if (threadId.value) {
    const activeRun = await findActiveRun(client, threadId.value)
    if (activeRun) {
      runId.value = activeRun.run_id
      status.value = 'streaming'
      isRejoiningStream.value = true
      consumeStream(client.runs.joinStream(...))
    }
  }
})
```

这样做的原因：

1. `isLoading` 只表示首屏初始化，不包含后台续流
2. 用户会先看到已恢复的历史，再看到新的流继续往下输出
3. 避免把 `joinStream` 混入初始化主流程，导致加载语义混乱

### 3.2 查找活跃 run

在 `src/components/ai-bot/lib/thread.ts` 中通过 `findActiveRun(...)` 查线程最近的活跃 run：

```ts
const runs = await client.runs.list(threadId, { limit: 20 })
```

然后筛选：

- `pending`
- `running`

再按 `updated_at` 倒序，取最近一个。

这是当前实现里的“线程续流入口选择规则”。

---

## 4. AI 消息为什么不能按“最后一条”续写

最早版本的实现里，流式 token 是直接写回“最后一条 AI 消息”。

这个策略在普通单轮对话里通常没问题，但在刷新续流时容易出错：

1. 历史最后一条可能是用户消息
2. 最后一条 AI 可能不是当前活跃 run 对应的 AI 段
3. 工具调用前后，一个 run 里可能会出现多段 AI 消息

结果就是：

1. 续流内容被写到了错误的旧 AI 上
2. 用户消息在数组中的位置是对的，但视觉上像“倒数第二条 AI 继续打字”

所以当前实现已经改为：

**按流返回的 `message.id` 续写，而不是按位置续写。**

---

## 5. 当前 AI 续流实现

### 5.1 正常发送时

发送新消息后，前端会先插入一条临时 AI 占位消息：

```ts
{
  key: `pending-ai-*`,
  type: 'ai',
  content: ''
}
```

等第一块 AI chunk 到达时：

1. 读取 chunk 里的 `message.id`
2. 将这条 pending AI 绑定到真实 `message.id`
3. 后续所有同 `message.id` 的 chunk 都继续写回这条消息

### 5.2 刷新续流时

刷新后重新 `joinStream(...)`，如果后端继续返回同一个 `message.id`：

1. 前端先在现有 `messages` 中按 `key === message.id` 查找
2. 找到则直接继续追加内容
3. 找不到才创建新的 AI 消息

这保证了：

1. 用户消息不需要移动位置
2. 续流优先接在原来那条 AI 上
3. 不再依赖“最后一条 AI”这种脆弱规则

---

## 6. custom 消息为什么在续流时要隐藏

### 6.1 问题来源

`custom` 消息当前仍然是线性插入 `messages` 数组中的独立消息。

也就是说：

1. AI 已经支持按 `message.id` 回写
2. 但 `custom` 还没有挂接到具体某条 AI 消息下面
3. 于是刷新续流时，旧的 `custom` 很可能卡在“当前正在续写的 AI 消息”和后续内容之间

视觉效果会变成：

1. 上面某条 AI 继续打字
2. 中间夹着一个旧的 `custom`
3. 看起来层级关系不对

### 6.2 当前处理策略

当前采用最小侵入策略：

**只有在“刷新后的 rejoin 续流阶段”临时隐藏 `custom` 消息。**

实现方式：

```ts
const isRejoiningStream = ref(false)

const visibleMessages = computed(() => {
  if (!isRejoiningStream.value) return messages.value
  return messages.value.filter(message => message.type !== 'custom')
})
```

续流开始时：

```ts
isRejoiningStream.value = true
```

续流结束时：

```ts
isRejoiningStream.value = false
```

注意：

1. `custom` 数据没有删除
2. 只是续流阶段不渲染
3. 流结束后会自动重新显示

这样符合当前产品预期：

1. `custom` 通常表示当前对话的最新自定义事件
2. 续流阶段不需要展示它
3. 等本轮对话完成后，它重新显示即可

---

## 7. 历史恢复中的 run 信息

`loadThreadHistory(...)` 现在会尽量给 AI 消息补 `batchId`：

```ts
const aiRunId = msg.response_metadata?.run_id
  || msg.additional_kwargs?.run_id
  || msg.run_id
```

然后写入：

```ts
batchId: aiRunId
```

这一步的作用：

1. 尽量保留历史 AI 消息所属的 run 信息
2. 为后续按 run 做分组或排序预留基础
3. 让调试时更容易判断某条 AI 属于哪个 run

注意：

不是所有后端状态快照都一定带 `run_id`，所以这里是“尽力保留”，不是强保证。

---

## 8. 当前实现的边界

### 8.1 依赖固定 `threadId`

续流的前提是宿主传入稳定的 `threadId`。

如果 `threadId` 每次刷新都变，前端无法知道要恢复哪个线程，自然也无法找到活跃 run。

### 8.2 活跃 run 只取最近一个

当前 `findActiveRun(...)` 的规则是：

1. 查线程最近 20 条 run
2. 过滤 `pending/running`
3. 按 `updated_at` 倒序取最近一个

如果同一线程上同时存在多个活跃 run，当前实现默认只会接最近那个。

### 8.3 custom 仍然没有“真实归属关系”

当前只是“续流时隐藏 custom”，而不是从数据模型上给 `custom` 建立 parent 关系。

所以这是 UI 策略，不是结构性归因。

如果未来要做更精确的消息归属，建议给 `custom` 增加：

1. `parentMessageKey`
2. 或 `parentRunId`

### 8.4 仍不是严格的 SSE 断点续传

SDK 虽然支持：

```ts
lastEventId
```

但当前组件没有持久化 `Last-Event-ID`，所以现在是：

1. 能重新加入同一个 run
2. 但不是逐事件严格续传

极短时间窗口里的部分中间 chunk 仍然可能丢失。

---

## 9. 修改这套逻辑时的注意事项

### 9.1 不要把 `isLoading` 和续流状态混用

`isLoading` 目前只表示：

1. 模型加载
2. 线程创建
3. 历史恢复

不要把 `joinStream` 算进去，否则会出现：

1. 历史已经可见
2. 但 UI 还被加载遮罩盖住

### 9.2 不要再退回“最后一条 AI 消息”写入策略

凡是涉及 AI chunk 更新，都应优先用：

1. `message.id`
2. 或未来更明确的 parent/run 关系

不要再按数组尾部猜测写入目标。

### 9.3 正常发送和刷新续流要共用一套流处理器

当前通过 `consumeStream(...)` 统一处理：

1. 新发消息的 `runs.stream(...)`
2. 刷新后的 `runs.joinStream(...)`

后续修改流式逻辑时，优先继续复用这条路径，避免两套代码再次分叉。

### 9.4 custom 的策略是“隐藏”，不是“删除”

续流阶段只允许：

1. 渲染层过滤
2. 或视觉层隐藏

不要在续流开始时直接从 `messages` 里删除 `custom`，否则结束后没法自动恢复。

### 9.5 工具消息和 AI 分段仍然要一起观察

当前一个 run 中可能出现：

1. AI 段
2. tool 消息
3. 再次 AI 段

如果后续改 agent 输出策略，必须联动检查：

1. AI 是否还按 `message.id` 稳定分段
2. tool 消息是否仍能插在正确位置
3. custom 是否会遮挡正在续流的 AI

---

## 10. 推荐测试场景

每次改续流相关逻辑，至少回归下面几类：

### 10.1 普通文本回答

1. 用户发送纯文本
2. AI 正常流式输出
3. 不刷新页面
4. 检查是否仍然只生成一条 AI 消息

### 10.2 工具调用后继续回答

1. 用户提问触发工具调用
2. 观察 `tool` 消息出现
3. AI 在工具结果后继续输出
4. 检查 AI 分段是否符合预期

### 10.3 刷新后续流

1. 用户发送消息
2. AI 输出中途刷新页面
3. 历史先恢复
4. 活跃 run 被重新加入
5. 检查 AI 是否续写到正确消息上

### 10.4 刷新后 custom 隐藏

1. 对话中产生 `custom` 消息
2. 在流未结束时刷新
3. 检查续流阶段 `custom` 是否隐藏
4. 流结束后 `custom` 是否重新显示

### 10.5 多轮连续对话

1. 连续发多轮消息
2. 中途刷新一次
3. 再继续发送下一轮
4. 检查历史消息、AI 续流、custom 显示是否都正常

---

## 11. 后续可选增强

如果后续要继续完善，可以考虑：

1. 持久化 `lastEventId`，接入真正的事件级断点续流
2. 给 `custom` 增加 `parentMessageKey` 或 `parentRunId`
3. 给 `tool` / `custom` / `ai` 做更明确的 run 归属建模
4. 为续流状态增加更明确的 UI 标识，例如“已重新连接对话流”

---

## 12. 当前结论

当前方案的设计原则是：

1. 优先保证消息写入正确，不串消息
2. 刷新后的续流优先保证体验连续，而不是追求复杂归属建模
3. 对 `custom` 采用最小侵入策略，续流期间临时隐藏

这套实现已经能满足当前主要诉求：

1. 固定 `threadId` 的线程可恢复
2. 活跃 run 可重新加入
3. AI 续流不会错误写到最后一条旧消息
4. `custom` 不会在续流时干扰正在打字的 AI
