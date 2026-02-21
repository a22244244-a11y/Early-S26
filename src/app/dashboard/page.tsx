"use client";

import { PageTransition } from "@/components/layout/page-transition";
import { StatusSummary } from "@/components/dashboard/status-summary";
import { ModelStatusTable } from "@/components/dashboard/model-status-table";
import { AvailableStock } from "@/components/dashboard/available-stock";

export default function DashboardPage() {
  return (
    <PageTransition>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <StatusSummary />
        <AvailableStock />
        <ModelStatusTable />
      </div>
    </PageTransition>
  );
}
