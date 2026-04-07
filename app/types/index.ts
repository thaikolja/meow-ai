/*
 * Copyright (C) 2026 Kolja Nolte
 * https://meow.yanawa.io
 * info@meow.yanawa.io
 *
 * This work is licensed under the MIT License. You are free to use, modify,
 * and distribute this work, provided that you include the copyright notice
 * and this permission notice in all copies or substantial portions of the work.
 * For more information, visit: https://opensource.org/licenses/MIT
 *
 * @author    Kolja Nolte
 * @email     kolja.nolte@gmail.com
 * @license   MIT
 * @date      2026
 * @website   https://meow.yanawa.io
 */

/**
 * Core type definitions for the Meow chat application.
 */

/**
 * Configuration schema for an external AI service endpoint.
 * Supports OpenAI-compatible API structures.
 * API keys are stored encrypted server-side and never exposed to the client.
 */
export interface LLMProvider {
  /** Unique base36 identifier for the provider entry */
  id: string
  /** Human-readable display name (e.g. 'Ollama', 'Groq') */
  name: string
  /** The root service URL for API requests (e.g. 'https://api.openai.com') */
  baseUrl: string
  /** Cached list of model identifiers available on this specific provider */
  models: string[]
  /** Determines if this provider is currently available for chat interactions */
  isActive: boolean
  /** UNIX timestamp representing creation epoch */
  createdAt: number
}

/**
 * Data structure for a single dialogue turn within a conversation.
 */
export interface ChatMessage {
  /** Unique identifier for the specific message bubble */
  id: string
  /** The perspective from which the message was sent (standard OpenAI roles) */
  role: 'user' | 'assistant' | 'system'
  /** The raw markdown or text body of the dialogue */
  content: string
  /** UNIX timestamp for exact message delivery time */
  timestamp: number
  /** The model identifier used to generate this specific response */
  model?: string
  /** The source provider ID for this specific turn */
  providerId?: string
  /** Flag to indicate if the message resulted in a processing failure */
  isError?: boolean
}

/**
 * Representation of a standalone conversation thread.
 * Groupings of individual messages with associated metadata.
 */
export interface Chat {
  /** Unique chat identifier */
  id: string
  /** Human-readable summary or title derived from early user interaction */
  title: string
  /** Array of messages forming the conversation history */
  messages: ChatMessage[]
  /** Epoch creation time */
  createdAt: number
  /** Epoch representing the most recent message or title update */
  updatedAt: number
  /** Default provider for new messages in this thread */
  providerId?: string
  /** Default model identifier for the thread session */
  model?: string
}
