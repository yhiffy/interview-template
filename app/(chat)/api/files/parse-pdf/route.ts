import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import pdf from "pdf-parse/lib/pdf-parse";

// Allow images or PDF
const ACCEPTED_TYPES = ["application/pdf"];

const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "File size must be <= 5MB",
    })
    .refine((file) => ACCEPTED_TYPES.includes(file.type), {
      message: "Only PDF allowed",
    }),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as Blob;
    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const parseResult = FileSchema.safeParse({ file });
    if (!parseResult.success) {
      const errMsg = parseResult.error.errors.map((e) => e.message).join(", ");
      return NextResponse.json({ error: errMsg }, { status: 400 });
    }

    const fileArrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(fileArrayBuffer);

    const contentType = file.type;
    const originalName = (formData.get("file") as File).name;
    const timestamp = Date.now();
    const uniqueName = `${timestamp}-${originalName}`;

    // parse PDF
    const data = await pdf(fileBuffer);
    const rawText = data.text || "";
    const isInvoice = rawText.toLowerCase().includes("invoice");

    return NextResponse.json({
      message: "PDF uploaded",
      fileName: uniqueName,
      contentType,
      url: "",
      pathname: "",
      rawText,
      isInvoice,
    });
  } catch (error) {
    console.error("Failed to upload invoice", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
