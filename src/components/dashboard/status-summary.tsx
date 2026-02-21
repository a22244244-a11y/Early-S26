"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { Id } from "../../../convex/_generated/dataModel";

export function StatusSummary() {
  const { groupId } = useAuth();
  const reservationCounts = useQuery(
    api.reservations.countByModelColor,
    groupId ? { groupId: groupId as Id<"groups"> } : "skip"
  );
  const inventoryCounts = useQuery(
    api.inventory.countByModelColor,
    groupId ? { groupId: groupId as Id<"groups"> } : "skip"
  );

  if (!reservationCounts || !inventoryCounts) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-20" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  let totalReservations = 0;
  let matchedReservations = 0;
  for (const entry of reservationCounts) {
    totalReservations += entry.total;
    matchedReservations += entry.matched;
  }
  const pendingReservations = totalReservations - matchedReservations;

  let totalInventory = 0;
  let availableInventory = 0;
  let transferredInventory = 0;
  for (const entry of inventoryCounts) {
    totalInventory += entry.total;
    availableInventory += entry.available;
    transferredInventory += entry.transferred;
  }
  const matchedInventory = totalInventory - availableInventory;

  const matchRate =
    totalReservations > 0
      ? Math.round((matchedReservations / totalReservations) * 100)
      : 0;

  const cards = [
    {
      title: "총 예약",
      value: totalReservations,
      sub: `대기 ${pendingReservations} / 완료 ${matchedReservations}`,
      color: "text-blue-600",
    },
    {
      title: "총 재고",
      value: totalInventory,
      sub: `가용 ${availableInventory} / 매칭 ${matchedInventory}${transferredInventory > 0 ? ` / 출고 ${transferredInventory}` : ""}`,
      color: "text-green-600",
    },
    {
      title: "매칭률",
      value: `${matchRate}%`,
      sub: `${matchedReservations} / ${totalReservations}건 완료`,
      color:
        matchRate >= 80
          ? "text-green-600"
          : matchRate >= 50
            ? "text-yellow-600"
            : "text-red-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${card.color}`}>
                {card.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
