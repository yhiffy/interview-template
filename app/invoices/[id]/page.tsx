"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function InvoiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<any | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    fetch(`/api/invoices/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setInvoice(data);
        setForm(data);
      })
      .catch((err) => console.error(err));
  }, [params.id]);

  if (!invoice) {
    return <div>Loading...</div>;
  }

  async function handleSave() {
    const res = await fetch(`/api/invoices/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const updated = await res.json();
      setInvoice(updated);
      setEditing(false);
    } else {
      console.error("Failed to update invoice");
    }
  }

  return (
    <main className="p-4">
      <h1 className="text-xl font-bold mb-4">
        Invoice #{invoice.invoiceNumber}
      </h1>
      <div className="space-y-2 mb-4">
        <p>
          <span className="font-semibold">Vendor:</span>{" "}
          {editing ? (
            <input
              type="text"
              value={form.vendorName}
              onChange={(e) => setForm({ ...form, vendorName: e.target.value })}
            />
          ) : (
            invoice.vendorName
          )}
        </p>
        <p>
          <span className="font-semibold">Customer:</span>{" "}
          {editing ? (
            <input
              type="text"
              value={form.customerName}
              onChange={(e) =>
                setForm({ ...form, customerName: e.target.value })
              }
            />
          ) : (
            invoice.customerName
          )}
        </p>
      </div>

      {editing ? (
        <button onClick={handleSave} className="mr-2">
          Save
        </button>
      ) : (
        <button onClick={() => setEditing(true)} className="mr-2">
          Edit
        </button>
      )}

      <button onClick={() => router.back()}>Back</button>
    </main>
  );
}
