import { NextRequest, NextResponse } from "next/server";
import {
  listInvoices,
  getInvoiceById,
  saveInvoice,
  updateInvoice,
  deleteInvoice,
  findDuplicateInvoice,
} from "@/lib/db/queries";
import { auth } from "@/app/(auth)/auth";
import { generateUUID } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user) {
    return Response.json("Unauthorized!", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sortBy = (searchParams.get("sortBy") as any) || "createdAt";
  const sortOrder = (searchParams.get("sortOrder") as any) || "desc";

  try {
    const result = await listInvoices({ sortBy, sortOrder });
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return Response.json(error.message, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user) {
    return NextResponse.json("Unauthorized!", { status: 401 });
  }

  const {
    vendorName,
    customerName,
    invoiceNumber,
    invoiceDate,
    dueDate,
    amount,
    lineItems,
  } = await req.json();

  try {
    const existing = await findDuplicateInvoice(
      vendorName || "Unknown vendor",
      invoiceNumber || "",
      amount || "0"
    );
    if (existing) {
      return NextResponse.json(
        { message: "Invoice already exists" },
        { status: 400 }
      );
    }
    const result = await saveInvoice({
      vendorName,
      customerName,
      invoiceNumber,
      invoiceDate,
      dueDate,
      amount,
      lineItems,
      id: generateUUID(),
      fileHash: null,
      tokenUsage: null,
    });
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(error.message, { status: 500 });
  }
}
