"use client";

import { PageTransition } from "@/components/layout/page-transition";
import { StatusSummary } from "@/components/dashboard/status-summary";
import { ModelStatusTable } from "@/components/dashboard/model-status-table";
import { AvailableStock } from "@/components/dashboard/available-stock";
import { ReservationList } from "@/components/dashboard/reservation-list";
import { SuperadminOverview } from "@/components/dashboard/superadmin-overview";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export default function DashboardPage() {
  const { isAdmin, isSuperAdmin } = useAuth();

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">대시보드</h1>
          <a
            href="https://pre-salemobile.uplus.co.kr"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline">사전예약 공식홈페이지</Button>
          </a>
        </div>
        {isSuperAdmin ? (
          <SuperadminOverview />
        ) : (
          <>
            <StatusSummary />
            <AvailableStock />
            <ReservationList />
            {isAdmin && <ModelStatusTable />}
          </>
        )}
      </div>
    </PageTransition>
  );
}
