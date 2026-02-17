import { BaseLLMProvider, type LLMMessage, type LLMResponse, type LLMOptions } from './base';

export class AnthropicProvider extends BaseLLMProvider {
  constructor(apiKey: string, baseURL: string = 'https://api.anthropic.com/v1') {
    super(apiKey, baseURL);
  }

  getAvailableModels(): string[] {
    return ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'];
  }

  async chat(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse> {
    const model = options?.model || 'claude-3-5-haiku-20241022';
    
    // Convert messages format (Anthropic doesn't use system in messages array)
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const conversationMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          messages: conversationMessages,
          system: systemMessage,
          max_tokens: options?.maxTokens ?? 2000,
          temperature: options?.temperature ?? 0.7,
          top_p: options?.topP ?? 1,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const usage = {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      };

      return {
        content: data.content[0].text,
        model: data.model,
        provider: 'anthropic',
        usage,
        cost: this.calculateCost(usage, model),
        metadata: {
          stopReason: data.stop_reason,
          id: data.id,
        },
      };
    } catch (error: any) {
      throw new Error(`Anthropic chat failed: ${error.message}`);
    }
  }

  calculateCost(usage: { promptTokens: number; completionTokens: number }, model: string): number {
    // Pricing as of Jan 2026 (per 1M tokens)
    const pricing: Record<string, { input: number; output: number }> = {
      'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
      'claude-3-5-haiku-20241022': { input: 0.80, output: 4.00 },
      'claude-3-opus-20240229': { input: 15.00, output: 75.00 },
    };

    const modelPricing = pricing[model] || pricing['claude-3-5-haiku-20241022'];
    const inputCost = (usage.promptTokens / 1_000_000) * modelPricing.input;
    const outputCost = (usage.completionTokens / 1_000_000) * modelPricing.output;
    
    return inputCost + outputCost;
  }
}
