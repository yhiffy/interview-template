import { useBlock } from "@/hooks/use-block";
import React from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

interface InvoiceToolResultProps {
  result: any;
  isReadonly: boolean;
}

export const InvoiceToolResult = ({
  result,
  isReadonly,
}: InvoiceToolResultProps) => {
  if (result === "Duplicate invoice found!") {
    return;
  }
  console.log("result", result);
  // const parsed = JSON.parse(result);
  return (
    <Card className="w-full max-w-sm shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Invoice: #{result.invoiceNumber}
        </CardTitle>
        <CardDescription className="text-sm">
          Vendor: {result.vendorName}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="text-sm">
          <p>
            <span className="font-semibold">Customer:</span>{" "}
            {result.customerName}
          </p>
          <p>
            <span className="font-semibold">Invoice Date:</span>{" "}
            {result.invoiceDate}
          </p>
          <p>
            <span className="font-semibold">Due Date:</span> {result.dueDate}
          </p>
          <p className="font-semibold">Amount: {result.amount}</p>
        </div>

        {Array.isArray(result.lineItems) && result.lineItems.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-semibold mb-2">Line Items</p>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="pb-1 text-left font-medium">Description</th>
                  <th className="pb-1 text-left font-medium">Quantity</th>
                  <th className="pb-1 text-left font-medium">Unit Price</th>
                  <th className="pb-1 text-left font-medium">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {result.lineItems.map((item: any, idx: number) => (
                  <tr
                    key={idx}
                    className={
                      idx % 2 === 0
                        ? "border-b border-gray-200"
                        : "border-b border-gray-200 bg-gray-50"
                    }
                  >
                    <td className="py-1 pr-2">{item.description}</td>
                    <td className="py-1 pr-2">{item.quantity}</td>
                    <td className="py-1 pr-2">{item.unit_price}</td>
                    <td className="py-1">{item.line_total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-end">
        {/* Put more actions if needed */}
        {/* e.g. <Button variant="secondary">Edit</Button> */}
        <Button variant="secondary">Edit</Button>
      </CardFooter>
    </Card>
  );
};
