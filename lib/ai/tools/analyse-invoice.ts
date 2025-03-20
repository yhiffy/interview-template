import { tool } from "ai";
import { z } from "zod";
import { findDuplicateInvoice, saveInvoice } from "@/lib/db/queries";
import { generateUUID } from "@/lib/utils";

export const analyseInvoice = tool({
  description: `Extract invoice fields from either PDF text or an image.`,
  parameters: z.object({
    isInvoice: z.boolean().describe("Is this an invoice?"),
    vendorName: z.string().optional().describe("The name of the vendor."),
    customerName: z.string().optional().describe("The name of the customer."),
    invoiceNumber: z.string().optional().describe("The invoice number."),
    invoiceDate: z.string().optional().describe("The invoice date."),
    dueDate: z.string().optional().describe("The due date."),
    amount: z.string().optional().describe("The amount."),
    lineItems: z
      .array(
        z.object({
          description: z.string().describe("The description of the line item."),
          quantity: z.number().describe("The quantity of the line item."),
          unitPrice: z.string().describe("The unit price of the line item."),
          lineTotal: z.string().describe("The line total of the line item."),
        })
      )
      .optional()
      .describe("The line items of the invoice."),
  }),
  execute: async (args) => {
    console.log("args", args);
    const {
      vendorName,
      customerName,
      invoiceNumber,
      invoiceDate,
      dueDate,
      amount,
      lineItems,
      isInvoice,
    } = args;

    if (!isInvoice) {
      return "This is not an invoice.";
    }

    try {
      const existing = await findDuplicateInvoice(
        vendorName || "Unknown vendor",
        invoiceNumber || "",
        amount || "0"
      );

      if (existing) {
        return "Duplicate invoice found!";
      }

      await saveInvoice({
        id: generateUUID(),
        vendorName: vendorName || "Unknown vendor",
        customerName: customerName || "Unknown customer",
        invoiceNumber: invoiceNumber || "",
        invoiceDate: invoiceDate || null,
        dueDate: dueDate || null,
        amount: amount || "0",
        lineItems: lineItems || [],
        fileHash: "",
        tokenUsage: 0,
      });
    } catch (error) {
      console.error("Failed to process invoice:", error);
      throw error;
    }
    return args;
  },
});
