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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { useGroupStores } from "@/lib/useStores";
import { Id } from "../../../convex/_generated/dataModel";

function PreOrderNumberCell({
  reservationId,
  currentValue,
}: {
  reservationId: string;
  currentValue?: string;
}) {
  const updatePreOrderNumber = useMutation(api.reservations.updatePreOrderNumber);
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(currentValue || "");

  async function handleSave() {
    try {
      await updatePreOrderNumber({
        id: reservationId as any,
        preOrderNumber: value,
      });
      toast.success("사전예약번호가 저장되었습니다.");
      setIsEditing(false);
    } catch {
      toast.error("저장에 실패했습니다.");
    }
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-7 w-28 text-xs"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") setIsEditing(false);
          }}
        />
        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={handleSave}>
          저장
        </Button>
      </div>
    );
  }

  return (
    <span
      className="cursor-pointer hover:underline text-xs"
      onClick={() => {
        setValue(currentValue || "");
        setIsEditing(true);
      }}
    >
      {currentValue || <span className="text-muted-foreground">클릭하여 입력</span>}
    </span>
  );
}

export function ReservationTable() {
  const { groupId } = useAuth();
  const stores = useGroupStores();
  const [storeFilter, setStoreFilter] = useState<string>("all");

  const reservations = useQuery(
    api.reservations.list,
    groupId
      ? storeFilter === "all"
        ? { groupId: groupId as Id<"groups"> }
        : { groupId: groupId as Id<"groups">, storeName: storeFilter }
      : "skip"
  );
  const removeReservation = useMutation(api.reservations.remove);
  const unmatchReservation = useMutation(api.reservations.unmatch);

  async function handleDelete(id: string) {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await removeReservation({ id: id as any });
      toast.success("예약이 삭제되었습니다.");
    } catch {
      toast.error("삭제에 실패했습니다.");
    }
  }

  async function handleUnmatch(id: string) {
    if (!confirm("매칭을 해제하시겠습니까?")) return;
    try {
      await unmatchReservation({ id: id as any });
      toast.success("매칭이 해제되었습니다.");
    } catch {
      toast.error("매칭 해제에 실패했습니다.");
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>예약 목록</CardTitle>
        <Select value={storeFilter} onValueChange={setStoreFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 매장</SelectItem>
            {stores.map((store) => (
              <SelectItem key={store._id} value={store.name}>
                {store.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {reservations === undefined ? (
          <p className="text-center text-muted-foreground py-8">
            로딩 중...
          </p>
        ) : reservations.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            등록된 예약이 없습니다.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>매장</TableHead>
                  <TableHead>고객명</TableHead>
                  <TableHead>유치자</TableHead>
                  <TableHead>가입구분</TableHead>
                  <TableHead>모델</TableHead>
                  <TableHead>색상</TableHead>
                  <TableHead>개통시점</TableHead>
                  <TableHead>사전예약번호</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>일련번호</TableHead>
                  <TableHead>작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((r, i) => (
                  <motion.tr
                    key={r._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <TableCell>{r.storeName}</TableCell>
                    <TableCell className="font-medium">
                      {r.customerName}
                    </TableCell>
                    <TableCell>{r.recruiter}</TableCell>
                    <TableCell>{r.subscriptionType}</TableCell>
                    <TableCell>{r.model}</TableCell>
                    <TableCell>{r.color}</TableCell>
                    <TableCell>{r.activationTiming}</TableCell>
                    <TableCell>
                      <PreOrderNumberCell
                        reservationId={r._id}
                        currentValue={r.preOrderNumber}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          r.status === "완료" ? "default" : "secondary"
                        }
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {r.matchedSerialNumber || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {r.status === "완료" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnmatch(r._id)}
                          >
                            해제
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(r._id)}
                        >
                          삭제
                        </Button>
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
  );
}
