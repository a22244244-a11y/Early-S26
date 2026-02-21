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

export function SuperadminOverview() {
  const groups = useQuery(api.admin.groupOverview);

  if (!groups) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-20" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            등록된 그룹이 없습니다. 시스템 관리에서 그룹을 먼저 추가하세요.
          </p>
        </CardContent>
      </Card>
    );
  }

  // 전체 합산
  const totals = groups.reduce(
    (acc, g) => ({
      groups: acc.groups + 1,
      stores: acc.stores + g.storeCount,
      reservations: acc.reservations + g.reservation.total,
      pending: acc.pending + g.reservation.pending,
      completed: acc.completed + g.reservation.completed,
      inventory: acc.inventory + g.inventory.total,
      available: acc.available + g.inventory.available,
      matched: acc.matched + g.inventory.matched,
      transferred: acc.transferred + g.inventory.transferred,
    }),
    { groups: 0, stores: 0, reservations: 0, pending: 0, completed: 0, inventory: 0, available: 0, matched: 0, transferred: 0 }
  );

  const totalMatchRate = totals.reservations > 0
    ? Math.round((totals.completed / totals.reservations) * 100)
    : 0;

  const summaryCards = [
    { title: "전체 그룹", value: totals.groups, sub: `매장 ${totals.stores}개`, color: "text-purple-600" },
    { title: "전체 예약", value: totals.reservations, sub: `대기 ${totals.pending} / 완료 ${totals.completed}`, color: "text-blue-600" },
    { title: "전체 재고", value: totals.inventory, sub: `가용 ${totals.available} / 매칭 ${totals.matched}${totals.transferred > 0 ? ` / 출고 ${totals.transferred}` : ""}`, color: "text-green-600" },
    { title: "전체 매칭률", value: `${totalMatchRate}%`, sub: `${totals.completed} / ${totals.reservations}건`, color: totalMatchRate >= 80 ? "text-green-600" : totalMatchRate >= 50 ? "text-yellow-600" : "text-red-600" },
  ];

  return (
    <div className="space-y-6">
      {/* 전체 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
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
                <div className={`text-3xl font-bold ${card.color}`}>{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* 그룹별 예약/재고 현황 */}
      <Card>
        <CardHeader>
          <CardTitle>그룹별 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>그룹명</TableHead>
                  <TableHead className="text-center">매장수</TableHead>
                  <TableHead className="text-center">총 예약</TableHead>
                  <TableHead className="text-center">대기</TableHead>
                  <TableHead className="text-center">완료</TableHead>
                  <TableHead className="text-center">총 재고</TableHead>
                  <TableHead className="text-center">가용</TableHead>
                  <TableHead className="text-center">매칭률</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((g, i) => (
                  <motion.tr
                    key={g.groupId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b"
                  >
                    <TableCell className="font-medium">{g.groupName}</TableCell>
                    <TableCell className="text-center">{g.storeCount}</TableCell>
                    <TableCell className="text-center">{g.reservation.total}</TableCell>
                    <TableCell className="text-center">
                      {g.reservation.pending > 0 ? (
                        <Badge variant="secondary">{g.reservation.pending}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {g.reservation.completed > 0 ? (
                        <Badge variant="default">{g.reservation.completed}</Badge>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">{g.inventory.total}</TableCell>
                    <TableCell className="text-center">
                      {g.inventory.available > 0 ? (
                        <span className="font-medium text-green-600">{g.inventory.available}</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`font-bold ${
                          g.matchRate >= 80
                            ? "text-green-600"
                            : g.matchRate >= 50
                              ? "text-yellow-600"
                              : g.reservation.total === 0
                                ? "text-muted-foreground"
                                : "text-red-600"
                        }`}
                      >
                        {g.matchRate}%
                      </span>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 그룹별 매장 상세 */}
      {groups
        .filter((g) => g.storeBreakdown.length > 0)
        .map((g, gi) => (
          <motion.div
            key={g.groupId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + gi * 0.1 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  {g.groupName}
                  <Badge variant="outline" className="text-xs">
                    매장 {g.storeCount}개
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    재고 {g.inventory.total}대 (가용 {g.inventory.available})
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>매장명</TableHead>
                        <TableHead>P코드</TableHead>
                        <TableHead className="text-center">총 예약</TableHead>
                        <TableHead className="text-center">대기</TableHead>
                        <TableHead className="text-center">완료</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {g.storeBreakdown.map((store) => (
                        <TableRow key={store.pCode}>
                          <TableCell className="font-medium">{store.storeName}</TableCell>
                          <TableCell className="text-muted-foreground">{store.pCode}</TableCell>
                          <TableCell className="text-center">{store.total}</TableCell>
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
    </div>
  );
}
