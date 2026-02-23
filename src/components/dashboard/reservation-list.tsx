"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { MODELS, COLORS_BY_MODEL, type Model } from "@/lib/constants";
import { Id } from "../../../convex/_generated/dataModel";

function formatTime(ts: number) {
  const d = new Date(ts);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi}`;
}

const DOC_STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  미작성: { label: "미작성", variant: "secondary" },
  작성완료: { label: "작성완료", variant: "default" },
};

export function ReservationList() {
  const { groupId, isAdmin, user } = useAuth();
  const storeName = !isAdmin ? user?.storeName : undefined;
  const reservations = useQuery(
    api.reservations.list,
    groupId
      ? { groupId: groupId as Id<"groups">, storeName }
      : "skip"
  );
  const updateDocumentStatus = useMutation(api.reservations.updateDocumentStatus);
  const cancelReservation = useMutation(api.reservations.cancel);
  const removeReservation = useMutation(api.reservations.remove);
  const updateColor = useMutation(api.reservations.updateColor);
  const updateModel = useMutation(api.reservations.updateModel);
  const updatePreOrderNumber = useMutation(api.reservations.updatePreOrderNumber);

  // 다이얼로그 상태
  const [colorDialog, setColorDialog] = useState<{ id: string; model: string; color: string } | null>(null);
  const [modelDialog, setModelDialog] = useState<{ id: string; model: string; color: string } | null>(null);
  const [preOrderDialog, setPreOrderDialog] = useState<{ id: string; current: string } | null>(null);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedModelColor, setSelectedModelColor] = useState("");
  const [preOrderNumber, setPreOrderNumber] = useState("");

  // 대기 + 취소 예약 표시 (완료 제외)
  const visibleReservations = reservations?.filter((r) => r.status === "대기" || r.status === "취소") ?? [];
  const pendingCount = visibleReservations.filter((r) => r.status === "대기").length;

  async function handleDocStatus(id: string) {
    try {
      await updateDocumentStatus({
        id: id as Id<"reservations">,
        documentStatus: "작성완료",
      });
      toast.success("서류 작성완료 처리되었습니다.");
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleCancel(id: string, customerName: string) {
    if (!confirm(`${customerName} 고객의 예약을 취소하시겠습니까?`)) return;
    try {
      await cancelReservation({ id: id as Id<"reservations"> });
      toast.success("예약이 취소되었습니다.");
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleDelete(id: string, customerName: string) {
    if (!confirm(`${customerName} 고객의 예약을 완전히 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;
    try {
      await removeReservation({ id: id as Id<"reservations"> });
      toast.success("예약이 삭제되었습니다.");
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleColorChange() {
    if (!colorDialog || !selectedColor) return;
    try {
      await updateColor({
        id: colorDialog.id as Id<"reservations">,
        color: selectedColor as any,
      });
      toast.success("색상이 변경되었습니다.");
      setColorDialog(null);
      setSelectedColor("");
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleModelChange() {
    if (!modelDialog || !selectedModel || !selectedModelColor) return;
    try {
      await updateModel({
        id: modelDialog.id as Id<"reservations">,
        model: selectedModel as any,
        color: selectedModelColor as any,
      });
      toast.success("모델이 변경되었습니다.");
      setModelDialog(null);
      setSelectedModel("");
      setSelectedModelColor("");
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handlePreOrderNumber() {
    if (!preOrderDialog || !preOrderNumber.trim()) return;
    try {
      await updatePreOrderNumber({
        id: preOrderDialog.id as Id<"reservations">,
        preOrderNumber: preOrderNumber.trim(),
      });
      toast.success("사전예약번호가 저장되었습니다.");
      setPreOrderDialog(null);
      setPreOrderNumber("");
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            예약 고객 리스트
            {pendingCount > 0 && (
              <Badge variant="secondary">{pendingCount}건 대기</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {visibleReservations.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              등록된 예약이 없습니다.
            </p>
          ) : (
            <>
              {/* Mobile card layout */}
              <div className="space-y-3 md:hidden">
                {visibleReservations.map((r, i) => {
                  const isCancelled = r.status === "취소";
                  const docStatus = r.documentStatus || "미작성";
                  const config = DOC_STATUS_CONFIG[docStatus] ?? DOC_STATUS_CONFIG["미작성"];
                  return (
                    <motion.div
                      key={r._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`border rounded-lg p-3 space-y-2 ${isCancelled ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-base">{r.customerName}</span>
                        {isCancelled ? (
                          <Badge variant="destructive">취소</Badge>
                        ) : (
                          <Badge variant={config.variant}>{config.label}</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        <span>{r.model} / {r.color}</span>
                        <span>{r.activationTiming}</span>
                        <span>{formatTime(r._creationTime)}</span>
                      </div>
                      <div className="text-sm">
                        사전예약번호:{" "}
                        {r.preOrderNumber ? (
                          <span className="text-green-600 font-medium">{r.preOrderNumber}</span>
                        ) : (
                          <span className="text-muted-foreground">미입력</span>
                        )}
                      </div>
                      {!isCancelled && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {docStatus !== "작성완료" && (
                            <Button
                              size="sm"
                              className="h-9"
                              onClick={() => handleDocStatus(r._id)}
                            >
                              서류 작성완료
                            </Button>
                          )}
                          {docStatus === "작성완료" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9"
                              onClick={() =>
                                updateDocumentStatus({
                                  id: r._id as Id<"reservations">,
                                  documentStatus: "미작성",
                                })
                              }
                            >
                              서류초기화
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9"
                            onClick={() => {
                              setPreOrderDialog({ id: r._id, current: r.preOrderNumber || "" });
                              setPreOrderNumber(r.preOrderNumber || "");
                            }}
                          >
                            사전예약번호
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9"
                            onClick={() => {
                              setColorDialog({ id: r._id, model: r.model, color: r.color });
                              setSelectedColor(r.color);
                            }}
                          >
                            색상변경
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9"
                            onClick={() => {
                              setModelDialog({ id: r._id, model: r.model, color: r.color });
                              setSelectedModel(r.model);
                              setSelectedModelColor(r.color);
                            }}
                          >
                            모델변경
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-9 col-span-2"
                            onClick={() => handleCancel(r._id, r.customerName)}
                          >
                            취소
                          </Button>
                        </div>
                      )}
                      {isCancelled && isAdmin && (
                        <div className="pt-1">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-9 w-full"
                            onClick={() => handleDelete(r._id, r.customerName)}
                          >
                            삭제
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Desktop table layout */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>고객명</TableHead>
                      <TableHead>모델</TableHead>
                      <TableHead>색상</TableHead>
                      <TableHead>등록시간</TableHead>
                      <TableHead>개통시점</TableHead>
                      <TableHead>사전예약번호</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleReservations.map((r, i) => {
                      const isCancelled = r.status === "취소";
                      const docStatus = r.documentStatus || "미작성";
                      const config = DOC_STATUS_CONFIG[docStatus] ?? DOC_STATUS_CONFIG["미작성"];
                      return (
                        <motion.tr
                          key={r._id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className={`border-b transition-colors hover:bg-muted/50 ${isCancelled ? "opacity-50" : ""}`}
                        >
                          <TableCell className="font-medium">{r.customerName}</TableCell>
                          <TableCell>{r.model}</TableCell>
                          <TableCell>{r.color}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatTime(r._creationTime)}</TableCell>
                          <TableCell className="text-sm">{r.activationTiming}</TableCell>
                          <TableCell className="text-sm">
                            {r.preOrderNumber ? (
                              <span className="text-green-600 font-medium">{r.preOrderNumber}</span>
                            ) : (
                              <span className="text-muted-foreground">미입력</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {isCancelled ? (
                              <Badge variant="destructive">취소</Badge>
                            ) : (
                              <Badge variant={config.variant}>{config.label}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {!isCancelled && (
                              <div className="flex flex-wrap gap-1">
                                {docStatus !== "작성완료" && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleDocStatus(r._id)}
                                  >
                                    서류 작성완료
                                  </Button>
                                )}
                                {docStatus === "작성완료" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      updateDocumentStatus({
                                        id: r._id as Id<"reservations">,
                                        documentStatus: "미작성",
                                      })
                                    }
                                  >
                                    서류초기화
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setPreOrderDialog({ id: r._id, current: r.preOrderNumber || "" });
                                    setPreOrderNumber(r.preOrderNumber || "");
                                  }}
                                >
                                  사전예약번호
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setColorDialog({ id: r._id, model: r.model, color: r.color });
                                    setSelectedColor(r.color);
                                  }}
                                >
                                  색상변경
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setModelDialog({ id: r._id, model: r.model, color: r.color });
                                    setSelectedModel(r.model);
                                    setSelectedModelColor(r.color);
                                  }}
                                >
                                  모델변경
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleCancel(r._id, r.customerName)}
                                >
                                  취소
                                </Button>
                              </div>
                            )}
                            {isCancelled && isAdmin && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(r._id, r.customerName)}
                              >
                                삭제
                              </Button>
                            )}
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 색상변경 다이얼로그 */}
      <Dialog open={!!colorDialog} onOpenChange={() => setColorDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>색상 변경</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedColor} onValueChange={setSelectedColor}>
              <SelectTrigger>
                <SelectValue placeholder="색상 선택" />
              </SelectTrigger>
              <SelectContent>
                {colorDialog &&
                  COLORS_BY_MODEL[colorDialog.model as Model]?.map((color) => (
                    <SelectItem key={color} value={color}>
                      {color}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setColorDialog(null)}>
              닫기
            </Button>
            <Button
              onClick={handleColorChange}
              disabled={!selectedColor || selectedColor === colorDialog?.color}
            >
              변경
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 모델변경 다이얼로그 */}
      <Dialog open={!!modelDialog} onOpenChange={() => setModelDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>모델 변경</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <Select
              value={selectedModel}
              onValueChange={(val) => {
                setSelectedModel(val);
                const colors = COLORS_BY_MODEL[val as Model];
                if (colors && !colors.includes(selectedModelColor)) {
                  setSelectedModelColor(colors[0]);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="모델 선택" />
              </SelectTrigger>
              <SelectContent>
                {MODELS.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedModelColor} onValueChange={setSelectedModelColor}>
              <SelectTrigger>
                <SelectValue placeholder="색상 선택" />
              </SelectTrigger>
              <SelectContent>
                {selectedModel &&
                  COLORS_BY_MODEL[selectedModel as Model]?.map((color) => (
                    <SelectItem key={color} value={color}>
                      {color}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModelDialog(null)}>
              닫기
            </Button>
            <Button
              onClick={handleModelChange}
              disabled={
                !selectedModel ||
                !selectedModelColor ||
                (selectedModel === modelDialog?.model && selectedModelColor === modelDialog?.color)
              }
            >
              변경
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 사전예약번호 입력 다이얼로그 */}
      <Dialog open={!!preOrderDialog} onOpenChange={() => setPreOrderDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>사전예약번호 입력</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={preOrderNumber}
              onChange={(e) => setPreOrderNumber(e.target.value)}
              placeholder="사전예약번호를 입력하세요"
              onKeyDown={(e) => {
                if (e.key === "Enter") handlePreOrderNumber();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreOrderDialog(null)}>
              닫기
            </Button>
            <Button onClick={handlePreOrderNumber} disabled={!preOrderNumber.trim()}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
