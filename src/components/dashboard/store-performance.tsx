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
import { useAuth } from "@/lib/auth";
import { Id } from "../../../convex/_generated/dataModel";

function RankBadge({ rank, hasData }: { rank: number; hasData: boolean }) {
  if (!hasData) return <span className="text-muted-foreground">{rank}</span>;
  if (rank === 1) return <span className="text-yellow-500 font-bold text-lg">🥇</span>;
  if (rank === 2) return <span className="text-gray-400 font-bold text-lg">🥈</span>;
  if (rank === 3) return <span className="text-amber-600 font-bold text-lg">🥉</span>;
  return <span className="text-muted-foreground">{rank}</span>;
}

export function StorePerformance() {
  const { groupId, user } = useAuth();
  const stores = useQuery(
    api.admin.groupStorePerformance,
    groupId ? { groupId: groupId as Id<"groups"> } : "skip"
  );

  if (!stores) {
    return (
      <Card>
        <CardHeader><CardTitle>매장별 성과</CardTitle></CardHeader>
        <CardContent><p className="text-center text-muted-foreground py-4">로딩 중...</p></CardContent>
      </Card>
    );
  }

  if (stores.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>매장별 성과</CardTitle></CardHeader>
        <CardContent><p className="text-center text-muted-foreground py-4">등록된 매장이 없습니다.</p></CardContent>
      </Card>
    );
  }

  const myStore = user?.storeName;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
      <Card>
        <CardHeader>
          <CardTitle>매장별 성과</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center w-12">순위</TableHead>
                  <TableHead>매장명</TableHead>
                  <TableHead>P코드</TableHead>
                  <TableHead className="text-center">총 예약</TableHead>
                  <TableHead className="text-center">대기</TableHead>
                  <TableHead className="text-center">완료</TableHead>
                  <TableHead className="text-center">서류완료</TableHead>
                  <TableHead className="text-center">사전예약</TableHead>
                  <TableHead className="text-center">취소</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stores.map((store, i) => {
                  const isMyStore = myStore === store.storeName;
                  const active = store.total - store.cancelled;
                  const docRate = active > 0 ? Math.round((store.docReady / active) * 100) : 0;
                  const preOrderRate = active > 0 ? Math.round((store.hasPreOrder / active) * 100) : 0;
                  const cancelRate = store.total > 0 ? Math.round((store.cancelled / store.total) * 100) : 0;
                  return (
                    <TableRow
                      key={store.pCode}
                      className={
                        isMyStore
                          ? "bg-blue-100 border-l-4 border-l-blue-500"
                          : store.total === 0
                            ? "bg-red-50"
                            : i < 3
                              ? "bg-yellow-50/50"
                              : ""
                      }
                    >
                      <TableCell className="text-center">
                        <RankBadge rank={i + 1} hasData={store.total > 0} />
                      </TableCell>
                      <TableCell className="font-medium">
                        {store.total === 0 && (
                          <Badge variant="destructive" className="mr-2 text-xs">무실적</Badge>
                        )}
                        {store.storeName}
                        {isMyStore && <Badge variant="default" className="ml-2 text-xs">내 매장</Badge>}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{store.pCode}</TableCell>
                      <TableCell className="text-center">
                        {store.total === 0 ? (
                          <span className="font-bold text-red-600">0</span>
                        ) : (
                          <span className="font-bold">{store.total}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {store.pending > 0 ? (
                          <Badge variant="secondary">{store.pending}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {store.completed > 0 ? (
                          <Badge variant="default">{store.completed}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`text-sm ${docRate >= 80 ? "text-green-600" : docRate >= 50 ? "text-yellow-600" : active === 0 ? "text-muted-foreground" : "text-red-600"}`}>
                          {store.docReady}/{active} <span className="font-bold">({docRate}%)</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`text-sm ${preOrderRate >= 80 ? "text-green-600" : preOrderRate >= 50 ? "text-yellow-600" : active === 0 ? "text-muted-foreground" : "text-red-600"}`}>
                          {store.hasPreOrder}/{active} <span className="font-bold">({preOrderRate}%)</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {store.cancelled > 0 ? (
                          <span className="text-sm text-red-600">
                            <Badge variant="destructive">{store.cancelled}</Badge>
                            <span className="ml-1 font-bold">({cancelRate}%)</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
