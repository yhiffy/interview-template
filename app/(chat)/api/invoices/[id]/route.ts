import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getInvoiceById, updateInvoice, deleteInvoice } from "@/lib/db/queries";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json("Unauthorized!", { status: 401 });
  }

  try {
    const invoice = await getInvoiceById(params.id);
    if (!invoice) {
      return NextResponse.json("Not found", { status: 404 });
    }
    return NextResponse.json(invoice, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(error.message, { status: 500 });
  }
}

// UPDATE
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json("Unauthorized!", { status: 401 });
  }

  const body = await req.json();
  try {
    await updateInvoice(params.id, body);
    const updated = await getInvoiceById(params.id);
    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(error.message, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json("Unauthorized!", { status: 401 });
  }

  try {
    await deleteInvoice(params.id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(error.message, { status: 500 });
  }
}
