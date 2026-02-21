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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function GroupManagement() {
  const groups = useQuery(api.admin.listGroups);
  const createGroup = useMutation(api.admin.createGroup);
  const updateGroup = useMutation(api.admin.updateGroup);
  const removeGroup = useMutation(api.admin.removeGroup);

  const [newName, setNewName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  async function handleCreate() {
    if (!newName.trim()) return;
    setIsAdding(true);
    try {
      await createGroup({ name: newName.trim() });
      toast.success(`그룹 "${newName.trim()}"이(가) 생성되었습니다.`);
      setNewName("");
    } catch (error: any) {
      toast.error(error.message || "생성에 실패했습니다.");
    } finally {
      setIsAdding(false);
    }
  }

  async function handleToggleActive(id: any, isActive: boolean) {
    try {
      await updateGroup({ id, isActive: !isActive });
      toast.success(isActive ? "비활성화되었습니다." : "활성화되었습니다.");
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleDelete(id: any, name: string) {
    if (!confirm(`그룹 "${name}"을(를) 삭제하시겠습니까?`)) return;
    try {
      await removeGroup({ id });
      toast.success("삭제되었습니다.");
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>그룹 관리</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="새 그룹명 입력 (예: 충북그룹)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
          />
          <Button onClick={handleCreate} disabled={isAdding || !newName.trim()}>
            {isAdding ? "생성 중..." : "추가"}
          </Button>
        </div>

        {groups === undefined ? (
          <p className="text-center text-muted-foreground py-4">로딩 중...</p>
        ) : groups.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            등록된 그룹이 없습니다. 위에서 그룹을 추가하세요.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>그룹명</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((group, i) => (
                <motion.tr
                  key={group._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b"
                >
                  <TableCell className="font-medium">{group.name}</TableCell>
                  <TableCell>
                    <Badge variant={group.isActive ? "default" : "secondary"}>
                      {group.isActive ? "활성" : "비활성"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleToggleActive(group._id, group.isActive)
                        }
                      >
                        {group.isActive ? "비활성화" : "활성화"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(group._id, group.name)}
                      >
                        삭제
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
