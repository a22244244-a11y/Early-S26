"use client";

import { PageTransition } from "@/components/layout/page-transition";
import { MatchingPanel } from "@/components/matching/matching-panel";

export default function MatchingPage() {
  return (
    <PageTransition>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">자동 매칭</h1>
        <MatchingPanel />
      </div>
    </PageTransition>
  );
}
