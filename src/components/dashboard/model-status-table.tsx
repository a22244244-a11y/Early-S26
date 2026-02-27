"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { motion } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MODELS, COLORS_BY_MODEL, STORAGES, type Model } from "@/lib/constants";
import { useAuth } from "@/lib/auth";
import { Id } from "../../../convex/_generated/dataModel";

export function ModelStatusTable() {
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
      <Card>
        <CardHeader>
          <CardTitle>모델별 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">로딩 중...</p>
        </CardContent>
      </Card>
    );
  }

  const rows: Array<{
    model: string;
    color: string;
    storage: string;
    reservations: number;
    matched: number;
    inventory: number;
    available: number;
    transferred: number;
    shortage: number;
  }> = [];

  const resMap = new Map<string, { total: number; matched: number }>();
  for (const entry of reservationCounts) {
    resMap.set(`${entry.model}__${entry.color}__${entry.storage}`, { total: entry.total, matched: entry.matched });
  }
  const invMap = new Map<string, { total: number; available: number; transferred: number }>();
  for (const entry of inventoryCounts) {
    invMap.set(`${entry.model}__${entry.color}__${entry.storage}`, { total: entry.total, available: entry.available, transferred: entry.transferred });
  }

  for (const model of MODELS) {
    const colors = COLORS_BY_MODEL[model as Model];
    for (const color of colors) {
      for (const storage of STORAGES) {
        const key = `${model}__${color}__${storage}`;
        const res = resMap.get(key) || { total: 0, matched: 0 };
        const inv = invMap.get(key) || { total: 0, available: 0, transferred: 0 };
        if (res.total === 0 && inv.total === 0) continue;
        const shortage = res.total - inv.total;

        rows.push({
          model,
          color,
          storage,
          reservations: res.total,
          matched: res.matched,
          inventory: inv.total,
          available: inv.available,
          transferred: inv.transferred,
          shortage,
        });
      }
    }
  }

  const hasShortage = rows.some((r) => r.shortage > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          모델별 현황
          {hasShortage && (
            <Badge variant="destructive" className="animate-pulse">
              재고 부족
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>모델</TableHead>
                <TableHead>색상</TableHead>
                <TableHead>용량</TableHead>
                <TableHead className="text-center">예약</TableHead>
                <TableHead className="text-center">입고</TableHead>
                <TableHead className="text-center">매칭완료</TableHead>
                <TableHead className="text-center">타점출고</TableHead>
                <TableHead className="text-center">부족</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => {
                const isShortage = row.shortage > 0;
                const isFullyMatched =
                  row.reservations > 0 &&
                  row.matched === row.reservations;

                return (
                  <motion.tr
                    key={`${row.model}-${row.color}-${row.storage}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`border-b transition-colors hover:bg-muted/50 ${
                      isFullyMatched
                        ? "bg-green-50"
                        : isShortage
                          ? "bg-red-50"
                          : ""
                    }`}
                  >
                    <TableCell className="font-medium">{row.model}</TableCell>
                    <TableCell>{row.color}</TableCell>
                    <TableCell>{row.storage}</TableCell>
                    <TableCell className="text-center">
                      {row.reservations}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.inventory}
                    </TableCell>
                    <TableCell className="text-center">
                      {row.matched}
                    </TableCell>
                    <TableCell className={`text-center ${row.transferred > 0 ? "text-orange-600 font-medium" : "text-muted-foreground"}`}>
                      {row.transferred > 0 ? row.transferred : "-"}
                    </TableCell>
                    <TableCell
                      className={`text-center font-bold ${
                        isShortage
                          ? "bg-red-100 text-red-700"
                          : "text-green-600"
                      }`}
                    >
                      {isShortage ? `-${row.shortage}` : row.shortage === 0 && row.reservations > 0 ? "0" : "-"}
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
