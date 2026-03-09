// 模型信息 (API 返回格式)
export interface ModelInfo {
  name: string
  provider: string
  base_url: string
  is_default?: boolean
}

// 获取模型列表
export async function fetchModels(apiUrl: string): Promise<ModelInfo[]> {
  try {
    const response = await fetch(`${apiUrl}/webapp/models`)
    const result = await response.json()
    if (result.success && result.data) {
      return result.data
    }
    return []
  } catch (error) {
    console.error('Failed to fetch models:', error)
    return []
  }
}

// 获取默认模型
export function getDefaultModel(models: ModelInfo[]): ModelInfo | undefined {
  return models.find(m => m.is_default) || models[0]
}

// 根据模型名获取对应的提供商
export function getProviderByModelName(modelName: string): string {
  const name = modelName.toLowerCase()

  if (name.startsWith('qwen') || name.includes('阿里') || name.includes('通义')) {
    return 'alibaba'
  }
  if (name.startsWith('glm') || name.includes('智谱') || name.includes('zhipuai')) {
    return 'zhipuai'
  }
  if (name.startsWith('deepseek') || name.includes('deepseek')) {
    return 'deepseek'
  }
  if (name.startsWith('minimax') || name.includes('minimax')) {
    return 'minimax'
  }
  if (name.includes('kimi') || name.includes('月之')) {
    return 'moonshotai'
  }
  if (name.includes('claude') || name.includes('anthropic')) {
    return 'anthropic'
  }
  if (name.includes('gpt') || name.includes('openai')) {
    return 'openai'
  }
  if (name.includes('gemini') || name.includes('google')) {
    return 'google'
  }
  if (name.includes('mistral')) {
    return 'mistral'
  }
  if (name.includes('llama')) {
    return 'llama'
  }

  return 'openai'
}
