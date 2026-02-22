"use client";

import { PageTransition } from "@/components/layout/page-transition";
import { LinkManagement } from "@/components/settings/link-management";

export default function SettingsPage() {
  return (
    <PageTransition>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">설정</h1>
        <LinkManagement />
      </div>
    </PageTransition>
  );
}
