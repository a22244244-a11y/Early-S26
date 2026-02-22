"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { Id } from "../../../convex/_generated/dataModel";

export function InventoryTable() {
  const { groupId } = useAuth();
  const [filter, setFilter] = useState<
    "all" | "available" | "matched" | "transferred"
  >("all");
  const inventory = useQuery(
    api.inventory.list,
    groupId ? { groupId: groupId as Id<"groups"> } : "skip"
  );
  const removeInventory = useMutation(api.inventory.remove);
  const unmatchInventory = useMutation(api.inventory.unmatchInventory);
  const transferInventory = useMutation(api.inventory.transfer);

  const manualMatch = useMutation(api.inventory.manualMatch);

  const [assignDialog, setAssignDialog] = useState<{
    id: string;
    serial: string;
    model: string;
    color: string;
  } | null>(null);
  const assignableReservations = useQuery(
    api.inventory.assignableReservations,
    assignDialog ? { inventoryId: assignDialog.id as Id<"inventory"> } : "skip"
  );

  const [transferDialog, setTransferDialog] = useState<{
    id: string;
    serial: string;
  } | null>(null);
  const [transferNote, setTransferNote] = useState("");

  const filteredInventory = inventory?.filter((item) => {
    if (filter === "all") return true;
    if (filter === "available") return !item.isMatched && !item.isTransferred;
    if (filter === "matched") return item.isMatched;
    if (filter === "transferred") return item.isTransferred;
    return true;
  });

  async function handleDelete(id: string) {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await removeInventory({ id: id as any });
      toast.success("재고가 삭제되었습니다.");
    } catch (error: any) {
      toast.error(error.message || "삭제에 실패했습니다.");
    }
  }

  async function handleUnmatch(id: string) {
    if (!confirm("매칭을 취소하시겠습니까? 연결된 예약이 대기 상태로 돌아갑니다."))
      return;
    try {
      await unmatchInventory({ id: id as any });
      toast.success("매칭이 취소되었습니다.");
    } catch (error: any) {
      toast.error(error.message || "매칭 취소에 실패했습니다.");
    }
  }

  async function handleTransfer() {
    if (!transferDialog) return;
    try {
      await transferInventory({
        id: transferDialog.id as any,
        transferNote: transferNote || undefined,
      });
      toast.success("타점출고 처리되었습니다.");
      setTransferDialog(null);
      setTransferNote("");
    } catch (error: any) {
      toast.error(error.message || "타점출고에 실패했습니다.");
    }
  }

  async function handleAssign(reservationId: string) {
    if (!assignDialog) return;
    try {
      await manualMatch({
        inventoryId: assignDialog.id as Id<"inventory">,
        reservationId: reservationId as Id<"reservations">,
      });
      toast.success("배정이 완료되었습니다.");
      setAssignDialog(null);
    } catch (error: any) {
      toast.error(error.message || "배정에 실패했습니다.");
    }
  }

  function getStatusBadge(item: {
    isMatched: boolean;
    isTransferred?: boolean;
  }) {
    if (item.isTransferred) {
      return <Badge variant="outline">타점출고</Badge>;
    }
    if (item.isMatched) {
      return <Badge variant="default">매칭완료</Badge>;
    }
    return <Badge variant="secondary">미매칭</Badge>;
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>재고 목록</CardTitle>
          <Tabs
            value={filter}
            onValueChange={(v) => setFilter(v as typeof filter)}
          >
            <TabsList>
              <TabsTrigger value="all">전체</TabsTrigger>
              <TabsTrigger value="available">미매칭</TabsTrigger>
              <TabsTrigger value="matched">매칭완료</TabsTrigger>
              <TabsTrigger value="transferred">타점출고</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {filteredInventory === undefined ? (
            <p className="text-center text-muted-foreground py-8">
              로딩 중...
            </p>
          ) : filteredInventory.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              등록된 재고가 없습니다.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>모델</TableHead>
                    <TableHead>색상</TableHead>
                    <TableHead>일련번호</TableHead>
                    <TableHead>입고일</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>매칭 고객</TableHead>
                    <TableHead>비고</TableHead>
                    <TableHead>작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item, i) => (
                    <motion.tr
                      key={item._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`border-b transition-colors hover:bg-muted/50 ${
                        item.isTransferred ? "opacity-60" : ""
                      }`}
                    >
                      <TableCell className="font-medium">
                        {item.model}
                      </TableCell>
                      <TableCell>{item.color}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {item.serialNumber}
                      </TableCell>
                      <TableCell>{item.arrivalDate}</TableCell>
                      <TableCell>{getStatusBadge(item)}</TableCell>
                      <TableCell className="text-sm">
                        {item.matchedCustomerName ? (
                          <span>
                            <span className="font-medium">{item.matchedCustomerName}</span>
                            <span className="text-xs text-muted-foreground ml-1">({item.matchedStoreName})</span>
                          </span>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.transferNote || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {item.isMatched && !item.isTransferred && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnmatch(item._id)}
                            >
                              매칭취소
                            </Button>
                          )}
                          {!item.isMatched && !item.isTransferred && (
                            <Button
                              size="sm"
                              onClick={() =>
                                setAssignDialog({
                                  id: item._id,
                                  serial: item.serialNumber,
                                  model: item.model,
                                  color: item.color,
                                })
                              }
                            >
                              배정
                            </Button>
                          )}
                          {!item.isMatched && !item.isTransferred && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                setTransferDialog({
                                  id: item._id,
                                  serial: item.serialNumber,
                                })
                              }
                            >
                              타점출고
                            </Button>
                          )}
                          {!item.isMatched && !item.isTransferred && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(item._id)}
                            >
                              삭제
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!transferDialog}
        onOpenChange={(open) => {
          if (!open) {
            setTransferDialog(null);
            setTransferNote("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>타점출고</DialogTitle>
            <DialogDescription>
              일련번호 {transferDialog?.serial}을(를) 타점으로 출고합니다.
              이력은 유지됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">비고 (선택)</label>
            <Input
              placeholder="출고 대리점명 등"
              value={transferNote}
              onChange={(e) => setTransferNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTransfer();
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTransferDialog(null);
                setTransferNote("");
              }}
            >
              취소
            </Button>
            <Button onClick={handleTransfer}>출고 처리</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* 배정 다이얼로그 */}
      <Dialog
        open={!!assignDialog}
        onOpenChange={(open) => {
          if (!open) setAssignDialog(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>고객 배정</DialogTitle>
            <DialogDescription>
              {assignDialog?.model} / {assignDialog?.color} (
              {assignDialog?.serial}) 재고를 배정할 고객을 선택하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto">
            {assignableReservations === undefined ? (
              <p className="text-center text-muted-foreground py-4">
                로딩 중...
              </p>
            ) : assignableReservations.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                배정 가능한 대기 고객이 없습니다.
              </p>
            ) : (
              <div className="space-y-2">
                {assignableReservations.map((r) => (
                  <div
                    key={r._id}
                    className="flex items-center justify-between border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{r.customerName}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(r._creationTime).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {r.storeName} / {r.recruiter} / {r.subscriptionType}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {r.activationTiming}
                        {r.documentStatus === "작성완료" && (
                          <Badge variant="default" className="ml-2 text-xs">서류완료</Badge>
                        )}
                        {r.preOrderNumber && (
                          <span className="ml-2 text-green-600">사전예약: {r.preOrderNumber}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAssign(r._id)}
                    >
                      배정
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog(null)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
