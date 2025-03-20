import {
  type Message,
  createDataStreamResponse,
  generateObject,
  smoothStream,
  streamText,
} from "ai";

import { auth } from "@/app/(auth)/auth";
import { myProvider } from "@/lib/ai/models";
import { systemPrompt } from "@/lib/ai/prompts";
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
} from "@/lib/db/queries";
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from "@/lib/utils";

import { generateTitleFromUserMessage } from "../../actions";
import { createDocument } from "@/lib/ai/tools/create-document";
import { updateDocument } from "@/lib/ai/tools/update-document";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import { getWeather } from "@/lib/ai/tools/get-weather";
import { analyseInvoice } from "@/lib/ai/tools/analyse-invoice";
import { z } from "zod";
import { anthropic } from "@ai-sdk/anthropic";

export const maxDuration = 60;

export async function POST(request: Request) {
  const {
    id,
    messages,
    selectedChatModel,
  }: { id: string; messages: Array<Message>; selectedChatModel: string } =
    await request.json();

  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userMessage = getMostRecentUserMessage(messages);

  if (!userMessage) {
    return new Response("No user message found", { status: 400 });
  }

  const chat = await getChatById({ id });

  if (!chat) {
    const title = await generateTitleFromUserMessage({ message: userMessage });
    await saveChat({ id, userId: session.user.id, title });
  }

  await saveMessages({
    messages: [{ ...userMessage, createdAt: new Date(), chatId: id }],
  });

  const pdf = userMessage.experimental_attachments?.find(
    (att) => att.contentType === "application/pdf"
  );
  if (pdf) {
    const pdfBuffer = await fetch(pdf.url).then((res) => res.arrayBuffer());
    const schema = z.object({
      vendorName: z.string().describe("The name of the vendor."),
      customerName: z.string().describe("The name of the customer."),
      invoiceNumber: z.string().describe("The invoice number."),
      invoiceDate: z.string().describe("The invoice date."),
      dueDate: z.string().describe("The due date."),
      amount: z.string().describe("The amount."),
      lineItems: z
        .array(
          z.object({
            description: z
              .string()
              .describe("The description of the line item."),
            quantity: z.number().describe("The quantity of the line item."),
            unitPrice: z.string().describe("The unit price of the line item."),
            lineTotal: z.string().describe("The line total of the line item."),
          })
        )
        .describe("The line items of the invoice."),
    });
    const result = await generateObject({
      model: anthropic("claude-3-5-sonnet-latest"),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: userMessage.content },
            { type: "file", data: pdfBuffer, mimeType: "application/pdf" },
          ],
        },
      ],
      schema,
    });

    messages.push({
      id: generateUUID(),
      role: "assistant",
      content: `[PDF invoice analysis]: ${JSON.stringify(result.object)}`,
      createdAt: new Date(),
    });
    userMessage.experimental_attachments =
      userMessage.experimental_attachments?.filter((att) => att !== pdf);
  }
  return createDataStreamResponse({
    execute: (dataStream) => {
      const result = streamText({
        model: myProvider.languageModel(selectedChatModel),
        system: systemPrompt({ selectedChatModel }),
        messages,
        maxSteps: 5,
        experimental_activeTools:
          selectedChatModel === "chat-model-reasoning"
            ? []
            : [
                "getWeather",
                "createDocument",
                "updateDocument",
                "requestSuggestions",
                "analyseInvoice",
              ],
        experimental_transform: smoothStream({ chunking: "word" }),
        experimental_generateMessageId: generateUUID,
        tools: {
          getWeather,
          createDocument: createDocument({ session, dataStream }),
          updateDocument: updateDocument({ session, dataStream }),
          requestSuggestions: requestSuggestions({
            session,
            dataStream,
          }),
          analyseInvoice,
        },
        onFinish: async ({ response, reasoning }) => {
          if (session.user?.id) {
            try {
              const sanitizedResponseMessages = sanitizeResponseMessages({
                messages: response.messages,
                reasoning,
              });

              await saveMessages({
                messages: sanitizedResponseMessages.map((message) => {
                  return {
                    id: message.id,
                    chatId: id,
                    role: message.role,
                    content: message.content,
                    createdAt: new Date(),
                  };
                }),
              });
            } catch (error) {
              console.error("Failed to save chat");
            }
          }
        },
        experimental_telemetry: {
          isEnabled: true,
          functionId: "stream-text",
        },
      });

      result.mergeIntoDataStream(dataStream, {
        sendReasoning: true,
      });
    },
    onError: () => {
      return "Oops, an error occured!";
    },
  });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Not Found", { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    await deleteChatById({ id });

    return new Response("Chat deleted", { status: 200 });
  } catch (error) {
    return new Response("An error occurred while processing your request", {
      status: 500,
    });
  }
}
