"use client";

import { PageTransition } from "@/components/layout/page-transition";
import { StatusSummary } from "@/components/dashboard/status-summary";
import { ModelStatusTable } from "@/components/dashboard/model-status-table";
import { GroupPivotTable } from "@/components/dashboard/group-pivot-table";
import { AvailableStock } from "@/components/dashboard/available-stock";
import { ReservationList } from "@/components/dashboard/reservation-list";
import { SuperadminOverview } from "@/components/dashboard/superadmin-overview";
import { GlobalRecruiterRanking, GlobalStoreRanking } from "@/components/dashboard/ranking-tables";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

export default function DashboardPage() {
  const { isAdmin, isSuperAdmin, groupId } = useAuth();
  const groupLinks = useQuery(
    api.groupLinks.get,
    groupId ? { groupId: groupId as Id<"groups"> } : "skip"
  );

  const preOrderUrl = groupLinks?.preOrderUrl || "https://pre-salemobile.uplus.co.kr";

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-bold shrink-0">대시보드</h1>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {groupLinks?.onsaleDeviceChangeUrl && (
              <a href={groupLinks.onsaleDeviceChangeUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="whitespace-nowrap">온세일 기기변경</Button>
              </a>
            )}
            {groupLinks?.onsaleMNPUrl && (
              <a href={groupLinks.onsaleMNPUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="whitespace-nowrap">온세일 번호이동</Button>
              </a>
            )}
            {groupLinks?.onsaleNewUrl && (
              <a href={groupLinks.onsaleNewUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="whitespace-nowrap">온세일 신규</Button>
              </a>
            )}
            <a href={preOrderUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="whitespace-nowrap">사전예약 공식홈페이지</Button>
            </a>
          </div>
        </div>
        {isSuperAdmin ? (
          <SuperadminOverview />
        ) : (
          <>
            <StatusSummary />
            <AvailableStock />
            <ReservationList />
            <GlobalRecruiterRanking />
            <GlobalStoreRanking />
            {isAdmin && <ModelStatusTable />}
            {isAdmin && <GroupPivotTable />}
          </>
        )}
      </div>
    </PageTransition>
  );
}
