import { generateText, tool } from "ai";
import { z } from "zod";
import { myProvider } from "../models";
import { findDuplicateInvoice, saveInvoice } from "@/lib/db/queries";
import { generateUUID } from "@/lib/utils";
export const analyseInvoice = tool({
  description: `Extract invoice fields from either PDF text or an image.`,
  parameters: z.object({
    type: z.enum(["pdf", "image"]),
    pdfText: z.string().optional(),
    imageUrl: z.string().optional(),
  }),
  execute: async ({ type, pdfText, imageUrl }) => {
    const systemPrompt = `
    You receive either "pdfText" (raw PDF text) or image.
    Return strictly valid JSON only (no extra text).
    If "type" is "pdf", user will give you - Here is the PDF text: raw text from the PDF.
    If "type" is "image", user will give you - Here is an invoice image URL: link to the invoice image. 
    Return strictly valid JSON only (no extra text) and use this format:
    {
    "isInvoice": boolean
    "vendor_name": string,
    "customer_name": string,
    "invoice_number": string,
    "invoice_date": string,  // Prefer ISO-8601
    "due_date": string,  // Prefer ISO-8601
    "amount": string,  // total invoice amount
    "line_items": [
    {
        "description": string,
        "quantity": number,
        "unit_price": string,
        "line_total": string
        },
        ...
    ],
    }.
    Constraints:
    - "isInvoice" = true if it is indeed an invoice, otherwise false.
    - If something is missing, fill with placeholders or empty strings.
    - Return only raw JSON, no extra text.
    - Please do NOT wrap your JSON in \`\`\` or any code fences. Return raw JSON only.
    `;
    let userPrompt = "";
    if (type === "pdf") {
      userPrompt += `Here is the PDF text:\n${pdfText}\nPlease parse it.`;
    } else {
      userPrompt += `Here is an invoice image URL:\n${imageUrl}\nPlease parse the invoice info from the image.`;
    }

    const { text } = await generateText({
      model: myProvider.languageModel("chat-model-large"),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.2,
    });

    try {
      const parsed = JSON.parse(text.trim().replace(/```[\s\S]*?```/g, ""));
      if (parsed.isInvoice) {
        const existing = await findDuplicateInvoice(
          parsed.vendor_name || "Unknown vendor",
          parsed.invoice_number || "",
          parsed.amount || "0"
        );
        if (existing) {
          return "Duplicate invoice found!";
        }

        await saveInvoice({
          id: generateUUID(),
          vendorName: parsed.vendor_name || "Unknown vendor",
          customerName: parsed.customer_name || "Unknown customer",
          invoiceNumber: parsed.invoice_number || "",
          invoiceDate: parsed.invoice_date,
          dueDate: parsed.due_date,
          amount: parsed.amount,
          lineItems: parsed.line_items,
          fileHash: "",
          tokenUsage: 0,
        });
      }
    } catch (error) {
      console.error("Failed to save invoice in DB:", error);
      throw error;
    }
    return text;
  },
});
