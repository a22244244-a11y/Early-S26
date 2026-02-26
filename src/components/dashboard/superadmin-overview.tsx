"use client";

import { useState, Fragment } from "react";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Id } from "../../../convex/_generated/dataModel";
import { exportReservationsToExcel } from "@/lib/export-excel";
import { MODELS, COLORS_BY_MODEL, type Model } from "@/lib/constants";

function formatTime(ts: number) {
  const d = new Date(ts);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi}`;
}

type DetailType = "doc" | "preOrder" | null;

export function SuperadminOverview() {
  const groups = useQuery(api.admin.groupOverview);
  const [detailType, setDetailType] = useState<DetailType>(null);
  const [selectedGroup, setSelectedGroup] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const groupReservations = useQuery(
    api.reservations.list,
    selectedGroup
      ? { groupId: selectedGroup.id as Id<"groups"> }
      : "skip"
  );

  const pivotData = useQuery(api.admin.reservationPivot);

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
      cancelled: acc.cancelled + g.reservation.cancelled,
      docReady: acc.docReady + g.reservation.docReady,
      hasPreOrder: acc.hasPreOrder + g.reservation.hasPreOrder,
      inventory: acc.inventory + g.inventory.total,
      available: acc.available + g.inventory.available,
      matched: acc.matched + g.inventory.matched,
      transferred: acc.transferred + g.inventory.transferred,
    }),
    { groups: 0, stores: 0, reservations: 0, pending: 0, completed: 0, cancelled: 0, docReady: 0, hasPreOrder: 0, inventory: 0, available: 0, matched: 0, transferred: 0 }
  );

  const totalMatchRate = totals.reservations > 0
    ? Math.round((totals.completed / totals.reservations) * 100)
    : 0;

  const totalDocRate = totals.reservations > 0
    ? Math.round((totals.docReady / totals.reservations) * 100)
    : 0;

  const totalPreOrderRate = totals.reservations > 0
    ? Math.round((totals.hasPreOrder / totals.reservations) * 100)
    : 0;

  const totalCancelRate = totals.reservations > 0
    ? Math.round((totals.cancelled / totals.reservations) * 100)
    : 0;

  const summaryCards = [
    { title: "전체 그룹", value: totals.groups, sub: `매장 ${totals.stores}개`, color: "text-purple-600" },
    { title: "전체 예약", value: totals.reservations, sub: `대기 ${totals.pending} / 완료 ${totals.completed}`, color: "text-blue-600" },
    { title: "전체 재고", value: totals.inventory, sub: `가용 ${totals.available} / 매칭 ${totals.matched}${totals.transferred > 0 ? ` / 출고 ${totals.transferred}` : ""}`, color: "text-green-600" },
    { title: "전체 매칭률", value: `${totalMatchRate}%`, sub: `${totals.completed} / ${totals.reservations}건`, color: totalMatchRate >= 80 ? "text-green-600" : totalMatchRate >= 50 ? "text-yellow-600" : "text-red-600" },
    { title: "서류작성완료율", value: `${totalDocRate}%`, sub: `${totals.docReady} / ${totals.reservations}건`, color: totalDocRate >= 80 ? "text-green-600" : totalDocRate >= 50 ? "text-yellow-600" : "text-red-600", clickable: true, onClick: () => setDetailType("doc") },
    { title: "사전예약번호 입력", value: `${totalPreOrderRate}%`, sub: `${totals.hasPreOrder} / ${totals.reservations}건`, color: totalPreOrderRate >= 80 ? "text-green-600" : totalPreOrderRate >= 50 ? "text-yellow-600" : "text-red-600", clickable: true, onClick: () => setDetailType("preOrder") },
    { title: "취소율", value: `${totalCancelRate}%`, sub: `${totals.cancelled} / ${totals.reservations}건 취소`, color: totalCancelRate <= 5 ? "text-green-600" : totalCancelRate <= 15 ? "text-yellow-600" : "text-red-600" },
  ] as const;

  return (
    <div className="space-y-6">
      {/* 전체 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {summaryCards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card
              className={"clickable" in card && card.clickable ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}
              onClick={"onClick" in card ? card.onClick : undefined}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                  {"clickable" in card && card.clickable && (
                    <span className="ml-1 text-xs">▶</span>
                  )}
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
                  <TableHead className="text-center">취소</TableHead>
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
                    className={`border-b cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedGroup?.id === g.groupId ? "bg-muted" : ""
                    }`}
                    onClick={() =>
                      setSelectedGroup(
                        selectedGroup?.id === g.groupId
                          ? null
                          : { id: g.groupId, name: g.groupName }
                      )
                    }
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
                    <TableCell className="text-center">
                      {g.reservation.cancelled > 0 ? (
                        <Badge variant="destructive">{g.reservation.cancelled}</Badge>
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
                        <TableHead className="text-center">서류완료</TableHead>
                        <TableHead className="text-center">사전예약</TableHead>
                        <TableHead className="text-center">취소</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {g.storeBreakdown.map((store) => (
                        <TableRow
                          key={store.pCode}
                          className={store.total === 0 ? "bg-red-50" : ""}
                        >
                          <TableCell className="font-medium">
                            {store.total === 0 && (
                              <Badge variant="destructive" className="mr-2 text-xs">
                                무실적
                              </Badge>
                            )}
                            {store.storeName}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{store.pCode}</TableCell>
                          <TableCell className="text-center">
                            {store.total === 0 ? (
                              <span className="font-bold text-red-600">0</span>
                            ) : (
                              store.total
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
                            {(() => {
                              const active = store.total - store.cancelled;
                              const rate = active > 0 ? Math.round((store.docReady / active) * 100) : 0;
                              return (
                                <span className={`text-sm ${rate >= 80 ? "text-green-600" : rate >= 50 ? "text-yellow-600" : active === 0 ? "text-muted-foreground" : "text-red-600"}`}>
                                  {store.docReady}/{active} <span className="font-bold">({rate}%)</span>
                                </span>
                              );
                            })()}
                          </TableCell>
                          <TableCell className="text-center">
                            {(() => {
                              const active = store.total - store.cancelled;
                              const rate = active > 0 ? Math.round((store.hasPreOrder / active) * 100) : 0;
                              return (
                                <span className={`text-sm ${rate >= 80 ? "text-green-600" : rate >= 50 ? "text-yellow-600" : active === 0 ? "text-muted-foreground" : "text-red-600"}`}>
                                  {store.hasPreOrder}/{active} <span className="font-bold">({rate}%)</span>
                                </span>
                              );
                            })()}
                          </TableCell>
                          <TableCell className="text-center">
                            {(() => {
                              const rate = store.total > 0 ? Math.round((store.cancelled / store.total) * 100) : 0;
                              return store.cancelled > 0 ? (
                                <span className="text-sm text-red-600">
                                  <Badge variant="destructive">{store.cancelled}</Badge>
                                  <span className="ml-1 font-bold">({rate}%)</span>
                                </span>
                              ) : (
                                <span className="text-muted-foreground">0</span>
                              );
                            })()}
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

      {/* 전체 매장별 예약 순위 */}
      {(() => {
        const allStores = groups.flatMap((g) =>
          g.storeBreakdown.map((store) => ({
            ...store,
            groupName: g.groupName,
          }))
        );
        allStores.sort((a, b) => b.total - a.total);
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>전체 매장별 예약 순위</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-center w-12">순위</TableHead>
                        <TableHead>매장명</TableHead>
                        <TableHead>그룹</TableHead>
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
                      {allStores.map((store, i) => (
                        <TableRow
                          key={`${store.groupName}-${store.pCode}`}
                          className={store.total === 0 ? "bg-red-50" : ""}
                        >
                          <TableCell className="text-center font-bold">
                            {i < 3 && store.total > 0 ? (
                              <span className={
                                i === 0 ? "text-yellow-500" : i === 1 ? "text-gray-400" : "text-amber-600"
                              }>
                                {i + 1}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">{i + 1}</span>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {store.total === 0 && (
                              <Badge variant="destructive" className="mr-2 text-xs">
                                무실적
                              </Badge>
                            )}
                            {store.storeName}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {store.groupName}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {store.pCode}
                          </TableCell>
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
                            {(() => {
                              const active = store.total - store.cancelled;
                              const rate = active > 0 ? Math.round((store.docReady / active) * 100) : 0;
                              return (
                                <span className={`text-sm ${rate >= 80 ? "text-green-600" : rate >= 50 ? "text-yellow-600" : active === 0 ? "text-muted-foreground" : "text-red-600"}`}>
                                  {store.docReady}/{active} <span className="font-bold">({rate}%)</span>
                                </span>
                              );
                            })()}
                          </TableCell>
                          <TableCell className="text-center">
                            {(() => {
                              const active = store.total - store.cancelled;
                              const rate = active > 0 ? Math.round((store.hasPreOrder / active) * 100) : 0;
                              return (
                                <span className={`text-sm ${rate >= 80 ? "text-green-600" : rate >= 50 ? "text-yellow-600" : active === 0 ? "text-muted-foreground" : "text-red-600"}`}>
                                  {store.hasPreOrder}/{active} <span className="font-bold">({rate}%)</span>
                                </span>
                              );
                            })()}
                          </TableCell>
                          <TableCell className="text-center">
                            {(() => {
                              const rate = store.total > 0 ? Math.round((store.cancelled / store.total) * 100) : 0;
                              return store.cancelled > 0 ? (
                                <span className="text-sm text-red-600">
                                  <Badge variant="destructive">{store.cancelled}</Badge>
                                  <span className="ml-1 font-bold">({rate}%)</span>
                                </span>
                              ) : (
                                <span className="text-muted-foreground">0</span>
                              );
                            })()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })()}

      {/* 모델/색상별 피벗 테이블 */}
      {pivotData && pivotData.length > 0 && (() => {
        const modelList = MODELS as readonly string[];
        const getColors = (model: string) => COLORS_BY_MODEL[model as Model] || [];

        // 전체 합산
        const grandTotal = { total: 0, mnpTotal: 0, byModel: {} as Record<string, { total: number; mnp: number; colors: Record<string, number> }> };
        for (const g of pivotData) {
          grandTotal.total += g.groupPivot.total;
          grandTotal.mnpTotal += g.groupPivot.mnpTotal;
          for (const [model, data] of Object.entries(g.groupPivot.byModel)) {
            if (!grandTotal.byModel[model]) grandTotal.byModel[model] = { total: 0, mnp: 0, colors: {} };
            grandTotal.byModel[model].total += data.total;
            grandTotal.byModel[model].mnp += data.mnp;
            for (const [color, count] of Object.entries(data.colors)) {
              grandTotal.byModel[model].colors[color] = (grandTotal.byModel[model].colors[color] || 0) + count;
            }
          }
        }

        type PivotRow = { total: number; mnpTotal: number; byModel: Record<string, { total: number; mnp: number; colors: Record<string, number> }> };
        const renderRow = (label: string, data: PivotRow, bold: boolean, bg?: string) => (
          <TableRow key={label} className={bg || ""}>
            <TableCell className={`whitespace-nowrap sticky left-0 bg-white z-10 ${bold ? "font-bold" : ""} ${bg || ""}`}>
              {label}
            </TableCell>
            <TableCell className={`text-center ${bold ? "font-bold" : ""}`}>{data.total || 0}</TableCell>
            <TableCell className={`text-center ${bold ? "font-bold" : ""}`}>{data.mnpTotal || 0}</TableCell>
            {modelList.map((model) => {
              const md = data.byModel[model];
              return [
                <TableCell key={`${model}-t`} className={`text-center font-semibold ${bold ? "font-bold" : ""}`}>
                  {md?.total || 0}
                </TableCell>,
                ...getColors(model).map((color) => (
                  <TableCell key={`${model}-${color}`} className="text-center">
                    {md?.colors[color] || 0}
                  </TableCell>
                )),
                <TableCell key={`${model}-mnp`} className="text-center text-blue-600">
                  {md?.mnp || 0}
                </TableCell>,
              ];
            })}
          </TableRow>
        );

        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>모델/색상별 예약 현황</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table className="text-xs">
                    <TableHeader>
                      <TableRow>
                        <TableHead rowSpan={2} className="sticky left-0 bg-white z-10 min-w-[100px]">
                          대리점명
                        </TableHead>
                        <TableHead rowSpan={2} className="text-center min-w-[50px]">총계</TableHead>
                        <TableHead rowSpan={2} className="text-center min-w-[50px]">MNP</TableHead>
                        {modelList.map((model) => (
                          <TableHead
                            key={model}
                            colSpan={getColors(model).length + 2}
                            className="text-center border-l"
                          >
                            {model}
                          </TableHead>
                        ))}
                      </TableRow>
                      <TableRow>
                        {modelList.map((model) => [
                          <TableHead key={`${model}-t`} className="text-center border-l font-bold">합계</TableHead>,
                          ...getColors(model).map((color) => (
                            <TableHead key={`${model}-${color}`} className="text-center whitespace-nowrap">
                              {color.replace("코발트 ", "").replace("스카이 ", "")}
                            </TableHead>
                          )),
                          <TableHead key={`${model}-mnp`} className="text-center">MNP</TableHead>,
                        ])}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {renderRow("전체", grandTotal, true, "bg-yellow-50")}
                      {pivotData.map((g) => (
                        <Fragment key={g.groupName}>
                          {renderRow(g.groupName, g.groupPivot, true, "bg-gray-50")}
                          {g.stores.map((store) =>
                            renderRow(`  ${store.name}`, store, false)
                          )}
                        </Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })()}

      {/* 선택된 그룹의 예약 고객 리스트 */}
      {selectedGroup && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedGroup.name} - 예약 고객 리스트
                  {groupReservations && (
                    <Badge variant="secondary">
                      {groupReservations.length}건
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {groupReservations && groupReservations.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const today = new Date().toISOString().slice(0, 10);
                        exportReservationsToExcel(
                          groupReservations,
                          `${selectedGroup.name}_예약목록_${today}`
                        );
                      }}
                    >
                      엑셀 다운로드
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedGroup(null)}
                  >
                    닫기
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!groupReservations ? (
                <p className="text-center text-muted-foreground py-4">
                  로딩 중...
                </p>
              ) : groupReservations.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  등록된 예약이 없습니다.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>고객명</TableHead>
                        <TableHead>유치자</TableHead>
                        <TableHead>매장</TableHead>
                        <TableHead>모델</TableHead>
                        <TableHead>색상</TableHead>
                        <TableHead>가입유형</TableHead>
                        <TableHead>개통시점</TableHead>
                        <TableHead>사전예약번호</TableHead>
                        <TableHead>등록시간</TableHead>
                        <TableHead>상태</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupReservations.map((r, i) => (
                        <motion.tr
                          key={r._id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.02 }}
                          className={`border-b transition-colors hover:bg-muted/50 ${
                            r.status === "취소" ? "opacity-50" : ""
                          }`}
                        >
                          <TableCell className="font-medium">
                            {r.customerName}
                          </TableCell>
                          <TableCell className="text-sm">
                            {r.recruiter}
                          </TableCell>
                          <TableCell className="text-sm">
                            {r.storeName}
                          </TableCell>
                          <TableCell>{r.model}</TableCell>
                          <TableCell>{r.color}</TableCell>
                          <TableCell className="text-sm">
                            {r.subscriptionType}
                          </TableCell>
                          <TableCell className="text-sm">
                            {r.activationTiming}
                          </TableCell>
                          <TableCell className="text-sm">
                            {r.preOrderNumber ? (
                              <span className="text-green-600 font-medium">
                                {r.preOrderNumber}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatTime(r._creationTime)}
                          </TableCell>
                          <TableCell>
                            {r.status === "완료" ? (
                              <Badge
                                variant="default"
                                className="bg-green-600"
                              >
                                배정완료
                              </Badge>
                            ) : r.status === "취소" ? (
                              <Badge variant="destructive">취소</Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-orange-600 border-orange-300"
                              >
                                대기
                              </Badge>
                            )}
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
      {/* 서류/사전예약 상세 다이얼로그 */}
      <Dialog open={!!detailType} onOpenChange={(open) => { if (!open) setDetailType(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {detailType === "doc" ? "그룹별 서류작성 현황" : "그룹별 사전예약번호 입력 현황"}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>그룹명</TableHead>
                  <TableHead className="text-center">총 예약</TableHead>
                  <TableHead className="text-center">
                    {detailType === "doc" ? "작성완료" : "입력완료"}
                  </TableHead>
                  <TableHead className="text-center">
                    {detailType === "doc" ? "미작성" : "미입력"}
                  </TableHead>
                  <TableHead className="text-center">비율</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((g) => {
                  const total = g.reservation.total;
                  const done = detailType === "doc" ? g.reservation.docReady : g.reservation.hasPreOrder;
                  const notDone = total - done;
                  const rate = total > 0 ? Math.round((done / total) * 100) : 0;
                  return (
                    <TableRow key={g.groupId}>
                      <TableCell className="font-medium">{g.groupName}</TableCell>
                      <TableCell className="text-center">{total}</TableCell>
                      <TableCell className="text-center">
                        {done > 0 ? (
                          <Badge variant="default">{done}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {notDone > 0 ? (
                          <Badge variant="destructive">{notDone}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-bold ${
                          rate >= 80 ? "text-green-600" : rate >= 50 ? "text-yellow-600" : total === 0 ? "text-muted-foreground" : "text-red-600"
                        }`}>
                          {rate}%
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
