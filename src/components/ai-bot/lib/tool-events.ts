export type ToolEventState = 'start' | 'running' | 'completed' | 'error' | 'interrupted'

export type ToolEventPhase =
  | 'tool_call_started'
  | 'tool_args_streaming'
  | 'tool_call_finished'
  | 'tool_result'

// 通用工具事件载荷，只保留工具生命周期里稳定存在的公共字段。
export interface ToolEventPayload {
  phase: ToolEventPhase
  id?: string
  name?: string
  args?: string
  result?: string
  state: ToolEventState
}
