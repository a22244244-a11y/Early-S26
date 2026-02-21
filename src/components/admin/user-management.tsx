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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Id } from "../../../convex/_generated/dataModel";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "시스템관리자",
  group_admin: "그룹관리자",
  staff: "직원",
};

export function UserManagement() {
  const groups = useQuery(api.admin.listGroups);
  const [filterGroupId, setFilterGroupId] = useState<string>("");
  const users = useQuery(
    api.admin.listUsers,
    filterGroupId ? { groupId: filterGroupId as Id<"groups"> } : {}
  );
  const createUser = useMutation(api.admin.createUser);
  const updateUser = useMutation(api.admin.updateUser);
  const removeUser = useMutation(api.admin.removeUser);

  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    loginId: "",
    password: "admin123",
    name: "",
    groupId: "",
  });

  function resetForm() {
    setForm({
      loginId: "",
      password: "admin123",
      name: "",
      groupId: filterGroupId || "",
    });
  }

  async function handleCreate() {
    if (!form.loginId.trim() || !form.name.trim()) {
      toast.error("아이디와 이름을 입력하세요.");
      return;
    }
    if (!form.groupId) {
      toast.error("그룹을 선택하세요.");
      return;
    }
    try {
      await createUser({
        loginId: form.loginId.trim(),
        password: form.password,
        name: form.name.trim(),
        groupId: form.groupId as Id<"groups">,
      });
      toast.success(`그룹관리자 "${form.loginId}"이(가) 생성되었습니다.`);
      setShowDialog(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "생성에 실패했습니다.");
    }
  }

  async function handleToggleActive(id: any, isActive: boolean) {
    try {
      await updateUser({ id, isActive: !isActive });
      toast.success(isActive ? "비활성화되었습니다." : "활성화되었습니다.");
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleDelete(id: any, loginId: string) {
    if (!confirm(`사용자 "${loginId}"을(를) 삭제하시겠습니까?`)) return;
    try {
      await removeUser({ id });
      toast.success("삭제되었습니다.");
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  // group_admin만 필터링하여 표시
  const adminUsers = users?.filter((u) => u.role === "group_admin");

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>그룹 관리자 계정</CardTitle>
          <Button
            onClick={() => {
              resetForm();
              setShowDialog(true);
            }}
          >
            관리자 추가
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={filterGroupId} onValueChange={setFilterGroupId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="전체 그룹" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 그룹</SelectItem>
              {groups?.map((group) => (
                <SelectItem key={group._id} value={group._id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {adminUsers === undefined ? (
            <p className="text-center text-muted-foreground py-4">로딩 중...</p>
          ) : adminUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              등록된 그룹 관리자가 없습니다.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>아이디</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>그룹</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminUsers.map((user, i) => (
                  <motion.tr
                    key={user._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b"
                  >
                    <TableCell className="font-mono text-sm">
                      {user.loginId}
                    </TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.groupName || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={user.isActive ? "default" : "secondary"}
                      >
                        {user.isActive ? "활성" : "비활성"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleToggleActive(user._id, user.isActive)
                          }
                        >
                          {user.isActive ? "비활성화" : "활성화"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            handleDelete(user._id, user.loginId)
                          }
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

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>그룹 관리자 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>그룹</Label>
              <Select
                value={form.groupId}
                onValueChange={(v) => setForm({ ...form, groupId: v })}
              >
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label>아이디</Label>
              <Input
                placeholder="admin_chungbuk"
                value={form.loginId}
                onChange={(e) => setForm({ ...form, loginId: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>이름</Label>
              <Input
                placeholder="충북그룹 관리자"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>비밀번호</Label>
              <Input
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                기본값: admin123
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              취소
            </Button>
            <Button onClick={handleCreate}>생성</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
