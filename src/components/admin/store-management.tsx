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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Id } from "../../../convex/_generated/dataModel";

export function StoreManagement() {
  const groups = useQuery(api.admin.listGroups);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const stores = useQuery(
    api.admin.listStores,
    selectedGroupId
      ? { groupId: selectedGroupId as Id<"groups"> }
      : {}
  );
  const createStore = useMutation(api.admin.createStore);
  const updateStore = useMutation(api.admin.updateStore);
  const removeStore = useMutation(api.admin.removeStore);

  const [newName, setNewName] = useState("");
  const [newPCode, setNewPCode] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  async function handleCreate() {
    if (!newName.trim() || !newPCode.trim() || !selectedGroupId) return;
    setIsAdding(true);
    try {
      await createStore({
        groupId: selectedGroupId as Id<"groups">,
        name: newName.trim(),
        pCode: newPCode.trim(),
      });
      toast.success(`매장 "${newName.trim()}" (${newPCode.trim()}) 생성되었습니다.`);
      setNewName("");
      setNewPCode("");
    } catch (error: any) {
      toast.error(error.message || "생성에 실패했습니다.");
    } finally {
      setIsAdding(false);
    }
  }

  async function handleToggleActive(id: any, isActive: boolean) {
    try {
      await updateStore({ id, isActive: !isActive });
      toast.success(isActive ? "비활성화되었습니다." : "활성화되었습니다.");
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleDelete(id: any, name: string) {
    if (!confirm(`매장 "${name}"을(를) 삭제하시겠습니까?`)) return;
    try {
      await removeStore({ id });
      toast.success("삭제되었습니다.");
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  const selectedGroup = groups?.find((g) => g._id === selectedGroupId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>매장 관리</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="그룹 선택" />
            </SelectTrigger>
            <SelectContent>
              {groups?.map((group) => (
                <SelectItem key={group._id} value={group._id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedGroupId && (
          <div className="flex gap-2">
            <Input
              placeholder="매장명 (예: 충의팀)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Input
              placeholder="P코드 (예: P008992)"
              value={newPCode}
              onChange={(e) => setNewPCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
            />
            <Button
              onClick={handleCreate}
              disabled={isAdding || !newName.trim() || !newPCode.trim()}
            >
              {isAdding ? "생성 중..." : "추가"}
            </Button>
          </div>
        )}

        {!selectedGroupId ? (
          <p className="text-center text-muted-foreground py-4">
            그룹을 선택하세요.
          </p>
        ) : stores === undefined ? (
          <p className="text-center text-muted-foreground py-4">로딩 중...</p>
        ) : stores.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            {selectedGroup?.name}에 등록된 매장이 없습니다.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {selectedGroup?.name} - {stores.length}개 매장 (최소 4개 ~ 최대 20개)
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>매장명</TableHead>
                  <TableHead>P코드 (로그인ID)</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stores.map((store, i) => (
                  <motion.tr
                    key={store._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b"
                  >
                    <TableCell className="font-medium">{store.name}</TableCell>
                    <TableCell className="font-mono text-sm">{store.pCode}</TableCell>
                    <TableCell>
                      <Badge
                        variant={store.isActive ? "default" : "secondary"}
                      >
                        {store.isActive ? "활성" : "비활성"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleToggleActive(store._id, store.isActive)
                          }
                        >
                          {store.isActive ? "비활성화" : "활성화"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(store._id, store.name)}
                        >
                          삭제
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
}
