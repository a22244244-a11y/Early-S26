"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/lib/auth";
import { Id } from "../../../convex/_generated/dataModel";

type DetailType = "doc" | "preOrder" | null;

export function StatusSummary() {
  const { groupId } = useAuth();
  const [detailType, setDetailType] = useState<DetailType>(null);

  const reservationCounts = useQuery(
    api.reservations.countByModelColor,
    groupId ? { groupId: groupId as Id<"groups"> } : "skip"
  );
  const inventoryCounts = useQuery(
    api.inventory.countByModelColor,
    groupId ? { groupId: groupId as Id<"groups"> } : "skip"
  );
  const reservations = useQuery(
    api.reservations.list,
    groupId && detailType ? { groupId: groupId as Id<"groups"> } : "skip"
  );

  if (!reservationCounts || !inventoryCounts) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
  let docCompletedCount = 0;
  let hasPreOrderCount = 0;
  for (const entry of reservationCounts) {
    totalReservations += entry.total;
    matchedReservations += entry.matched;
    docCompletedCount += entry.docCompleted;
    hasPreOrderCount += entry.hasPreOrder;
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

  const docRate =
    totalReservations > 0
      ? Math.round((docCompletedCount / totalReservations) * 100)
      : 0;

  const preOrderRate =
    totalReservations > 0
      ? Math.round((hasPreOrderCount / totalReservations) * 100)
      : 0;

  const cards = [
    {
      title: "총 예약",
      value: totalReservations,
      sub: `대기 ${pendingReservations} / 완료 ${matchedReservations}`,
      color: "text-blue-600",
      clickable: false,
    },
    {
      title: "총 재고",
      value: totalInventory,
      sub: `가용 ${availableInventory} / 매칭 ${matchedInventory}${transferredInventory > 0 ? ` / 출고 ${transferredInventory}` : ""}`,
      color: "text-green-600",
      clickable: false,
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
      clickable: false,
    },
    {
      title: "서류작성완료율",
      value: `${docRate}%`,
      sub: `${docCompletedCount} / ${totalReservations}건 작성완료`,
      color:
        docRate >= 80
          ? "text-green-600"
          : docRate >= 50
            ? "text-yellow-600"
            : "text-red-600",
      clickable: true,
      onClick: () => setDetailType("doc"),
    },
    {
      title: "사전예약번호 입력",
      value: `${preOrderRate}%`,
      sub: `${hasPreOrderCount} / ${totalReservations}건 입력완료`,
      color:
        preOrderRate >= 80
          ? "text-green-600"
          : preOrderRate >= 50
            ? "text-yellow-600"
            : "text-red-600",
      clickable: true,
      onClick: () => setDetailType("preOrder"),
    },
  ];

  // 다이얼로그용 데이터
  const activeReservations = reservations?.filter((r) => r.status !== "취소") ?? [];
  const docCompleted = activeReservations.filter((r) => r.documentStatus === "작성완료");
  const docIncomplete = activeReservations.filter((r) => r.documentStatus !== "작성완료");
  const withPreOrder = activeReservations.filter((r) => !!r.preOrderNumber);
  const withoutPreOrder = activeReservations.filter((r) => !r.preOrderNumber);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card
              className={card.clickable ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}
              onClick={card.onClick}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                  {card.clickable && (
                    <span className="ml-1 text-xs">▶</span>
                  )}
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

      <Dialog open={!!detailType} onOpenChange={(open) => { if (!open) setDetailType(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {detailType === "doc" ? "서류작성 현황" : "사전예약번호 입력 현황"}
            </DialogTitle>
          </DialogHeader>
          {!reservations ? (
            <p className="text-center text-muted-foreground py-4">로딩 중...</p>
          ) : (
            <div className="space-y-4">
              {detailType === "doc" ? (
                <>
                  <div>
                    <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Badge variant="default">작성완료</Badge>
                      {docCompleted.length}건
                    </h3>
                    {docCompleted.length === 0 ? (
                      <p className="text-sm text-muted-foreground">없음</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>고객명</TableHead>
                            <TableHead>매장</TableHead>
                            <TableHead>모델</TableHead>
                            <TableHead>색상</TableHead>
                            <TableHead>유치자</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {docCompleted.map((r) => (
                            <TableRow key={r._id}>
                              <TableCell className="font-medium">{r.customerName}</TableCell>
                              <TableCell className="text-sm">{r.storeName}</TableCell>
                              <TableCell className="text-sm">{r.model}</TableCell>
                              <TableCell className="text-sm">{r.color}</TableCell>
                              <TableCell className="text-sm">{r.recruiter}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Badge variant="destructive">미작성</Badge>
                      {docIncomplete.length}건
                    </h3>
                    {docIncomplete.length === 0 ? (
                      <p className="text-sm text-muted-foreground">없음</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>고객명</TableHead>
                            <TableHead>매장</TableHead>
                            <TableHead>모델</TableHead>
                            <TableHead>색상</TableHead>
                            <TableHead>유치자</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {docIncomplete.map((r) => (
                            <TableRow key={r._id} className="bg-red-50">
                              <TableCell className="font-medium">{r.customerName}</TableCell>
                              <TableCell className="text-sm">{r.storeName}</TableCell>
                              <TableCell className="text-sm">{r.model}</TableCell>
                              <TableCell className="text-sm">{r.color}</TableCell>
                              <TableCell className="text-sm">{r.recruiter}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Badge variant="default" className="bg-green-600">입력완료</Badge>
                      {withPreOrder.length}건
                    </h3>
                    {withPreOrder.length === 0 ? (
                      <p className="text-sm text-muted-foreground">없음</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>고객명</TableHead>
                            <TableHead>매장</TableHead>
                            <TableHead>모델</TableHead>
                            <TableHead>사전예약번호</TableHead>
                            <TableHead>유치자</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {withPreOrder.map((r) => (
                            <TableRow key={r._id}>
                              <TableCell className="font-medium">{r.customerName}</TableCell>
                              <TableCell className="text-sm">{r.storeName}</TableCell>
                              <TableCell className="text-sm">{r.model}</TableCell>
                              <TableCell className="text-sm text-green-600 font-medium">{r.preOrderNumber}</TableCell>
                              <TableCell className="text-sm">{r.recruiter}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Badge variant="destructive">미입력</Badge>
                      {withoutPreOrder.length}건
                    </h3>
                    {withoutPreOrder.length === 0 ? (
                      <p className="text-sm text-muted-foreground">없음</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>고객명</TableHead>
                            <TableHead>매장</TableHead>
                            <TableHead>모델</TableHead>
                            <TableHead>색상</TableHead>
                            <TableHead>유치자</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {withoutPreOrder.map((r) => (
                            <TableRow key={r._id} className="bg-red-50">
                              <TableCell className="font-medium">{r.customerName}</TableCell>
                              <TableCell className="text-sm">{r.storeName}</TableCell>
                              <TableCell className="text-sm">{r.model}</TableCell>
                              <TableCell className="text-sm">{r.color}</TableCell>
                              <TableCell className="text-sm">{r.recruiter}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
