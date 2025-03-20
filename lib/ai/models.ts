import { openai } from "@ai-sdk/openai";
import { fireworks } from "@ai-sdk/fireworks";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
  Experimental_LanguageModelV1Middleware as LanguageModelV1Middleware,
  type LanguageModelV1,
  LanguageModelV1StreamPart,
} from "ai";
import { simulateReadableStream } from "ai/test";
import { createHash } from "node:crypto";

export const DEFAULT_CHAT_MODEL: string = "chat-model-large";

export const myProvider = customProvider({
  languageModels: {
    "chat-model-small": openai("gpt-4o-mini"),
    "chat-model-large": openai("gpt-4o"),
    "chat-model-reasoning": wrapLanguageModel({
      model: fireworks("accounts/fireworks/models/deepseek-r1"),
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),
    "title-model": openai("gpt-4o"),
    "block-model": openai("gpt-4o-mini"),
  },
  imageModels: {
    "small-model": openai.image("dall-e-2"),
    "large-model": openai.image("dall-e-3"),
  },
});

interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: "chat-model-large",
    name: "Large model",
    description: "Large model for complex, multi-step tasks",
  },
];

type StorageValue = string | number | null | object;
type StorageCache = {
  get: (key: string) => Promise<StorageValue>;
  set: (key: string, value: StorageValue) => Promise<void>;
};
const createKey = (obj: unknown) => {
  return createHash("sha256").update(JSON.stringify(obj)).digest("hex");
};
const fixTimestampsOnCachedObject = (
  obj: any
): Awaited<ReturnType<LanguageModelV1["doGenerate"]>> => {
  if (obj?.response?.timestamp) {
    obj.response.timestamp = new Date(obj.response.timestamp);
  }
  return obj as any;
};
export const createCacheMiddleware = (
  cache: StorageCache
): LanguageModelV1Middleware => ({
  wrapGenerate: async ({ doGenerate, params, model }) => {
    const cacheKey = createKey({ params, model });

    const cached = await cache.get(cacheKey);

    if (cached !== null) {
      return fixTimestampsOnCachedObject(cached);
    }

    const result = await doGenerate();

    await cache.set(cacheKey, result);

    return result;
  },
  wrapStream: async ({ doStream, params, model }) => {
    const cacheKey = createKey({ params, model });

    // Check if the result is in the cache
    const cached = await cache.get(cacheKey);

    // If cached, return a simulated ReadableStream that yields the cached result
    if (cached !== null) {
      // Format the timestamps in the cached response
      try {
        const formattedChunks = (cached as LanguageModelV1StreamPart[]).map(
          (p) => {
            if (p.type === "response-metadata" && p.timestamp) {
              return {
                ...p,
                timestamp: new Date(p.timestamp),
              };
            } else return p;
          }
        );
        return {
          stream: simulateReadableStream({
            initialDelayInMs: 0,
            chunkDelayInMs: 10,
            chunks: formattedChunks,
          }),
          rawCall: {
            rawPrompt: null,
            rawSettings: {},
          },
        };
      } catch (e) {
        // For now, only log to console - but your error
        // tracker should know about this!
        console.log(e);
      }
    }

    // If not cached, proceed with streaming
    const { stream, ...rest } = await doStream();

    const fullResponse: LanguageModelV1StreamPart[] = [];

    const transformStream = new TransformStream<
      LanguageModelV1StreamPart,
      LanguageModelV1StreamPart
    >({
      transform(chunk, controller) {
        fullResponse.push(chunk);
        controller.enqueue(chunk);
      },
      async flush() {
        await cache.set(cacheKey, fullResponse);
      },
    });

    return {
      stream: stream.pipeThrough(transformStream),
      ...rest,
    };
  },
});
