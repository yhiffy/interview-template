"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Invoice = {
  id: string;
  vendorName: string;
  customerName: string;
  invoiceNumber: string;
  invoiceDate: string | null;
  amount: string | null;
  createdAt: number;
};

export default function InvoiceListPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    fetch(`/api/invoices?sortBy=${sortBy}&sortOrder=${sortOrder}`)
      .then((res) => res.json())
      .then((data) => setInvoices(data))
      .catch((err) => console.error(err));
  }, [sortBy, sortOrder]);

  return (
    <main className="p-4">
      <h1 className="text-xl font-bold">Invoices</h1>

      <div className="my-4 flex gap-2">
        <button
          onClick={() => {
            setSortBy("vendorName");
            setSortOrder(sortOrder === "desc" ? "asc" : "desc");
          }}
        >
          Sort by Vendor {sortOrder}
        </button>

        <button
          onClick={() => {
            setSortBy("amount");
            setSortOrder(sortOrder === "desc" ? "asc" : "desc");
          }}
        >
          Sort by Amount {sortOrder}
        </button>
      </div>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b">
            <th className="pb-2 text-left font-medium">Vendor</th>
            <th className="pb-2 text-left font-medium">Customer</th>
            <th className="pb-2 text-left font-medium">Invoice #</th>
            <th className="pb-2 text-left font-medium">Date</th>
            <th className="pb-2 text-left font-medium">Amount</th>
            <th className="pb-2 text-left font-medium">Created At</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id} className="border-b">
              <td className="py-1 pr-2">{inv.vendorName}</td>
              <td className="py-1 pr-2">{inv.customerName}</td>
              <td className="py-1 pr-2">
                <Link
                  href={`/invoices/${inv.id}`}
                  className="text-blue-500 underline"
                >
                  {inv.invoiceNumber}
                </Link>
              </td>
              <td className="py-1 pr-2">{inv.invoiceDate ?? ""}</td>
              <td className="py-1 pr-2">{inv.amount}</td>
              <td className="py-1 pr-2">
                {new Date(inv.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
