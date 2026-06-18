export interface Message {
  role: 'user' | 'assistant';
  content: string;
  images?: Array<{ type: 'image_url'; image_url: { url: string } }>;
  timestamp: number;
  searchUsed?: boolean;
  nsfwMode?: boolean;
  failoverUsed?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export interface ApiProvider {
  id: string;
  name: string;
  type: 'openrouter' | 'openai' | 'gemini' | 'nvidia' | 'custom';
  key: string;
  baseUrl: string;
  model: string;
  active: boolean;
  lastStatus: 'ok' | 'failed' | 'unknown';
  failCount: number;
}

export interface ModelPreset {
  id: string;
  name: string;
  model: string;
  providerId: string;
  icon: string;
}

export interface RpCharacter {
  id: string;
  name: string;
  emoji: string;
  prompt: string;
}

export interface SandboxProject {
  id: string;
  name: string;
  code: string;
  createdAt: number;
  updatedAt: number;
}

export type TabType = 'ask' | 'fusion' | 'debate' | 'rp' | 'sandbox';

export interface AppSettings {
  temperature: number;
  topP: number;
  maxTokens: number;
  systemPrompt: string;
  streaming: boolean;
  saveHistory: boolean;
  nsfwMode: boolean;
  failoverEnabled: boolean;
  webSearchEnabled: boolean;
  ttsEnabled: boolean;
}

export interface ApiKeys {
  openrouter: string;
  gemini: string;
  customBaseUrl: string;
  customModelName: string;
}
