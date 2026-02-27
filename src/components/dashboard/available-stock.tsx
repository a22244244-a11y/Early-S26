"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { motion } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MODELS, COLORS_BY_MODEL, STORAGES, type Model } from "@/lib/constants";
import { useAuth } from "@/lib/auth";
import { Id } from "../../../convex/_generated/dataModel";

const COLOR_DOT: Record<string, string> = {
  "블랙": "bg-gray-900",
  "화이트": "bg-gray-200 border border-gray-300",
  "코발트 바이올렛": "bg-violet-500",
  "스카이 블루": "bg-sky-400",
  "핑크 골드": "bg-pink-300",
  "실버 섀도우": "bg-slate-400",
};

export function AvailableStock() {
  const { groupId } = useAuth();
  const inventoryCounts = useQuery(
    api.inventory.countByModelColor,
    groupId ? { groupId: groupId as Id<"groups"> } : "skip"
  );
  const reservationCounts = useQuery(
    api.reservations.countByModelColor,
    groupId ? { groupId: groupId as Id<"groups"> } : "skip"
  );

  if (!inventoryCounts || !reservationCounts) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 bg-muted rounded w-20" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-8 bg-muted rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const invMap = new Map<string, { available: number; total: number }>();
  for (const entry of inventoryCounts) {
    invMap.set(`${entry.model}__${entry.color}__${entry.storage}`, {
      available: entry.available,
      total: entry.total,
    });
  }

  const resMap = new Map<string, { total: number; matched: number }>();
  for (const entry of reservationCounts) {
    resMap.set(`${entry.model}__${entry.color}__${entry.storage}`, {
      total: entry.total,
      matched: entry.matched,
    });
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">잔여재고 현황</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MODELS.map((model, mi) => {
          const colors = COLORS_BY_MODEL[model as Model];
          let totalFree = 0;
          let totalShortage = 0;

          const colorData: Array<{ color: string; storage: string; available: number; pending: number; free: number; shortage: number }> = [];
          for (const color of colors) {
            for (const storage of STORAGES) {
              const key = `${model}__${color}__${storage}`;
              const inv = invMap.get(key);
              const res = resMap.get(key);
              const available = inv?.available || 0;
              const pending = (res?.total || 0) - (res?.matched || 0);
              if (available === 0 && pending === 0 && !inv && !res) continue;
              const free = Math.max(0, available - pending);
              const shortage = Math.max(0, pending - available);
              totalFree += free;
              totalShortage += shortage;
              colorData.push({ color, storage, available, pending, free, shortage });
            }
          }

          return (
            <motion.div
              key={model}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: mi * 0.1 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span>{model}</span>
                    <div className="flex gap-1.5">
                      {totalShortage > 0 && (
                        <Badge variant="destructive">
                          부족 {totalShortage}대
                        </Badge>
                      )}
                      <Badge
                        variant={totalFree > 0 ? "default" : "secondary"}
                        className={totalFree > 0 ? "bg-green-600" : ""}
                      >
                        여유 {totalFree}대
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {colorData.map(({ color, storage, available, pending, free, shortage }, ci) => {
                    // 상태 판별
                    const isShortage = shortage > 0;
                    const isReservedAll = available > 0 && free === 0 && !isShortage;
                    const isFree = free > 0;

                    let bgClass = "bg-gray-50 border border-gray-100";
                    if (isShortage) bgClass = "bg-red-50 border border-red-200";
                    else if (isReservedAll) bgClass = "bg-amber-50 border border-amber-200";
                    else if (isFree) bgClass = "bg-green-50 border border-green-200";

                    return (
                      <motion.div
                        key={`${color}-${storage}`}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: mi * 0.1 + ci * 0.03 }}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 ${bgClass}`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${COLOR_DOT[color] || "bg-gray-400"}`}
                          />
                          <span className={`text-sm ${isFree || isReservedAll || isShortage ? "font-medium" : "text-muted-foreground"}`}>
                            {color} <span className="text-xs text-muted-foreground">{storage}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isShortage && (
                            <span className="text-xs text-red-600 font-semibold animate-pulse">
                              {shortage}대 부족
                            </span>
                          )}
                          {isReservedAll && (
                            <span className="text-xs text-amber-600 font-medium">
                              예약배정
                            </span>
                          )}
                          <span
                            className={`text-sm font-bold ${
                              isFree
                                ? "text-green-700"
                                : isReservedAll
                                  ? "text-amber-700"
                                  : isShortage
                                    ? "text-red-700"
                                    : "text-gray-400"
                            }`}
                          >
                            {available > 0
                              ? isFree
                                ? `${free}대 판매가능`
                                : `${available}대 (예약분)`
                              : "없음"}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
