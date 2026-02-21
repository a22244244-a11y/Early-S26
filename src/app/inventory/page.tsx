"use client";

import { PageTransition } from "@/components/layout/page-transition";
import { InventoryForm } from "@/components/inventory/inventory-form";
import { InventoryTable } from "@/components/inventory/inventory-table";

export default function InventoryPage() {
  return (
    <PageTransition>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">재고 관리</h1>
        <InventoryForm />
        <InventoryTable />
      </div>
    </PageTransition>
  );
}
