"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth";
import { Id } from "../../../convex/_generated/dataModel";

export function MatchingPanel() {
  const { groupId } = useAuth();
  const preview = useQuery(
    api.matching.preview,
    groupId ? { groupId: groupId as Id<"groups"> } : "skip"
  );
  const executeMatch = useMutation(api.matching.execute);
  const resetAll = useMutation(api.matching.resetAll);

  const [isExecuting, setIsExecuting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [result, setResult] = useState<{
    matched: number;
    remaining: number;
    totalPending: number;
  } | null>(null);

  async function handleExecute() {
    setIsExecuting(true);
    setShowConfirm(false);
    try {
      const res = await executeMatch({ groupId: groupId as Id<"groups"> });
      setResult(res);
      toast.success(`${res.matched}건이 매칭되었습니다.`);
    } catch {
      toast.error("매칭 실행에 실패했습니다.");
    } finally {
      setIsExecuting(false);
    }
  }

  async function handleReset() {
    setShowResetConfirm(false);
    try {
      const res = await resetAll({ groupId: groupId as Id<"groups"> });
      toast.success(`${res.resetCount}건의 매칭이 초기화되었습니다.`);
      setResult(null);
    } catch {
      toast.error("초기화에 실패했습니다.");
    }
  }

  return (
    <div className="space-y-6">
      {/* 매칭 액션 카드 */}
      <Card>
        <CardHeader>
          <CardTitle>자동 매칭 실행</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            대기 중인 예약을 등록 순서(선착순)대로 입고된 재고의 일련번호와
            자동으로 매칭합니다. 동일한 모델/색상/용량 기준으로 배정됩니다.
          </p>
          <div className="flex gap-3">
            <Button
              size="lg"
              onClick={() => setShowConfirm(true)}
              disabled={
                isExecuting ||
                !preview ||
                preview.matches.length === 0
              }
            >
              {isExecuting ? "매칭 중..." : "원클릭 자동 매칭"}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowResetConfirm(true)}
            >
              전체 매칭 초기화
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 매칭 실행 결과 */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-700">매칭 결과</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-700">
                      {result.matched}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      매칭 완료
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {result.remaining}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      재고 부족
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {result.totalPending}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      전체 대기
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 매칭 미리보기 */}
      {preview && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 매칭 가능 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                매칭 예정
                <Badge variant="default">{preview.matches.length}건</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {preview.matches.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  매칭 가능한 항목이 없습니다.
                </p>
              ) : (
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>고객명</TableHead>
                        <TableHead>모델</TableHead>
                        <TableHead>색상</TableHead>
                        <TableHead>용량</TableHead>
                        <TableHead>일련번호</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.matches.map((m, i) => (
                        <motion.tr
                          key={m.reservationId}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.02 }}
                          className="border-b"
                        >
                          <TableCell className="font-medium">
                            {m.customerName}
                          </TableCell>
                          <TableCell>{m.model}</TableCell>
                          <TableCell>{m.color}</TableCell>
                          <TableCell>{m.storage}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {m.serialNumber}
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 매칭 불가 (재고 부족) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                재고 부족
                {preview.unmatched.length > 0 && (
                  <Badge variant="destructive">
                    {preview.unmatched.length}건
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {preview.unmatched.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  모든 예약에 재고가 충분합니다.
                </p>
              ) : (
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>고객명</TableHead>
                        <TableHead>모델</TableHead>
                        <TableHead>색상</TableHead>
                        <TableHead>용량</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.unmatched.map((u, i) => (
                        <motion.tr
                          key={u.reservationId}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.02 }}
                          className="border-b bg-red-50"
                        >
                          <TableCell className="font-medium">
                            {u.customerName}
                          </TableCell>
                          <TableCell>{u.model}</TableCell>
                          <TableCell>{u.color}</TableCell>
                          <TableCell>{u.storage}</TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 매칭 확인 다이얼로그 */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <DialogHeader>
              <DialogTitle>자동 매칭 실행</DialogTitle>
              <DialogDescription>
                {preview?.matches.length}건의 예약에 일련번호를 배정합니다.
                {preview && preview.unmatched.length > 0 && (
                  <span className="text-red-600 block mt-1">
                    {preview.unmatched.length}건은 재고 부족으로 매칭되지
                    않습니다.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <Separator className="my-4" />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirm(false)}>
                취소
              </Button>
              <Button onClick={handleExecute}>매칭 실행</Button>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* 초기화 확인 다이얼로그 */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>전체 매칭 초기화</DialogTitle>
            <DialogDescription>
              모든 매칭을 해제하고 예약 상태를 &quot;대기&quot;로 되돌립니다. 이
              작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <Separator className="my-4" />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResetConfirm(false)}
            >
              취소
            </Button>
            <Button variant="destructive" onClick={handleReset}>
              초기화 실행
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
