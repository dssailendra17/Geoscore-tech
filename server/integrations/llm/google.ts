import { BaseLLMProvider, type LLMMessage, type LLMResponse, type LLMOptions } from './base';

export class GoogleProvider extends BaseLLMProvider {
  constructor(apiKey: string, baseURL: string = 'https://generativelanguage.googleapis.com/v1beta') {
    super(apiKey, baseURL);
  }

  getAvailableModels(): string[] {
    return ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'];
  }

  async chat(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse> {
    const model = options?.model || 'gemini-2.0-flash-exp';
    
    // Convert messages to Gemini format
    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const systemInstruction = messages.find(m => m.role === 'system')?.content;

    try {
      const response = await fetch(
        `${this.baseURL}/models/${model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents,
            systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
            generationConfig: {
              temperature: options?.temperature ?? 0.7,
              maxOutputTokens: options?.maxTokens ?? 2000,
              topP: options?.topP ?? 1,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Google API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const candidate = data.candidates[0];
      const usage = {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0,
      };

      return {
        content: candidate.content.parts[0].text,
        model,
        provider: 'google',
        usage,
        cost: this.calculateCost(usage, model),
        metadata: {
          finishReason: candidate.finishReason,
          safetyRatings: candidate.safetyRatings,
        },
      };
    } catch (error: any) {
      throw new Error(`Google chat failed: ${error.message}`);
    }
  }

  calculateCost(usage: { promptTokens: number; completionTokens: number }, model: string): number {
    // Pricing as of Jan 2026 (per 1M tokens)
    const pricing: Record<string, { input: number; output: number }> = {
      'gemini-2.0-flash-exp': { input: 0.00, output: 0.00 }, // Free during preview
      'gemini-1.5-pro': { input: 1.25, output: 5.00 },
      'gemini-1.5-flash': { input: 0.075, output: 0.30 },
    };

    const modelPricing = pricing[model] || pricing['gemini-1.5-flash'];
    const inputCost = (usage.promptTokens / 1_000_000) * modelPricing.input;
    const outputCost = (usage.completionTokens / 1_000_000) * modelPricing.output;
    
    return inputCost + outputCost;
  }
}
