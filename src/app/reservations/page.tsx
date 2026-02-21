"use client";

import { PageTransition } from "@/components/layout/page-transition";
import { ReservationForm } from "@/components/reservations/reservation-form";
import { ReservationTable } from "@/components/reservations/reservation-table";

export default function ReservationsPage() {
  return (
    <PageTransition>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">예약 등록</h1>
        <ReservationForm />
        <ReservationTable />
      </div>
    </PageTransition>
  );
}
