export const FALLBACK_MODELS = [
    // Azure OpenAI Models / Proxy (Verified)
    { id: "gpt-4o", name: "GPT-4o (Azure)", provider: "Azure", enabled: true },
    { id: "gpt-4o-mini", name: "GPT-4o Mini (Azure)", provider: "Azure", enabled: true },
    { id: "gpt-4.1", name: "GPT-4.1 (Azure)", provider: "Azure", enabled: true },
    { id: "gpt-4.1-mini", name: "GPT-4.1 Mini (Azure)", provider: "Azure", enabled: true },
    { id: "gpt-4.1-nano", name: "GPT-4.1 Nano (Azure)", provider: "Azure", enabled: true },
    { id: "gpt-5", name: "GPT-5 (Azure Preview)", provider: "Azure", enabled: true },
    { id: "gpt-5-mini", name: "GPT-5 Mini (Azure Preview)", provider: "Azure", enabled: true },

    // Reasoning
    { id: "o3-mini", name: "o3 Mini (Azure)", provider: "Azure", enabled: true },
    { id: "o4-mini", name: "o4 Mini (Azure)", provider: "Azure", enabled: true },

    // Phi Series
    { id: "phi4", name: "Phi-4 (Azure)", provider: "Azure", enabled: true },
    { id: "phi4-mini", "name": "Phi-4 Mini (Azure)", provider: "Azure", enabled: true },
    { id: "phi4-multi", "name": "Phi-4 Multi (Azure)", provider: "Azure", enabled: true },

    // Claude
    { id: "bedrock-claude-3-5-sonnet", name: "Claude 3.5 Sonnet (Azure Proxy)", provider: "Azure Proxy", enabled: true },
    { id: "bedrock-claude-3-7-sonnet", name: "Claude 3.7 Sonnet (Azure Proxy)", provider: "Azure Proxy", enabled: true },
    { id: "bedrock-claude-haiku-4.5", name: "Claude Haiku 4.5 (Azure Proxy)", provider: "Azure Proxy", enabled: true },
    { id: "bedrock-claude-opus-4.5", name: "Claude Opus 4.5 (Azure Proxy)", provider: "Azure Proxy", enabled: true },
    { id: "bedrock-claude-sonnet-4", name: "Claude Sonnet 4 (Azure Proxy)", provider: "Azure Proxy", enabled: true },
    { id: "bedrock-claude-sonnet-4.5", name: "Claude Sonnet 4.5 (Azure Proxy)", provider: "Azure Proxy", enabled: true },

    // Gemini (Native Verified)
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash (Google)", provider: "Google", enabled: true },
    { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite (Google)", provider: "Google", enabled: true },
    { id: "gemini-3-flash-preview", name: "Gemini 3 Flash Preview (Google)", provider: "Google", enabled: true },
];
