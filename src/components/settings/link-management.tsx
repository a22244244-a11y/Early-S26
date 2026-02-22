"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { Id } from "../../../convex/_generated/dataModel";

export function LinkManagement() {
  const { groupId } = useAuth();
  const groupLinks = useQuery(
    api.groupLinks.get,
    groupId ? { groupId: groupId as Id<"groups"> } : "skip"
  );
  const upsertLinks = useMutation(api.groupLinks.upsert);

  const [preOrderUrl, setPreOrderUrl] = useState("");
  const [onsaleDeviceChangeUrl, setOnsaleDeviceChangeUrl] = useState("");
  const [onsaleMNPUrl, setOnsaleMNPUrl] = useState("");
  const [onsaleNewUrl, setOnsaleNewUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (groupLinks) {
      setPreOrderUrl(groupLinks.preOrderUrl || "");
      setOnsaleDeviceChangeUrl(groupLinks.onsaleDeviceChangeUrl || "");
      setOnsaleMNPUrl(groupLinks.onsaleMNPUrl || "");
      setOnsaleNewUrl(groupLinks.onsaleNewUrl || "");
    }
  }, [groupLinks]);

  async function handleSave() {
    if (!groupId) return;
    setIsSaving(true);
    try {
      await upsertLinks({
        groupId: groupId as Id<"groups">,
        preOrderUrl: preOrderUrl.trim() || undefined,
        onsaleDeviceChangeUrl: onsaleDeviceChangeUrl.trim() || undefined,
        onsaleMNPUrl: onsaleMNPUrl.trim() || undefined,
        onsaleNewUrl: onsaleNewUrl.trim() || undefined,
      });
      toast.success("링크가 저장되었습니다.");
    } catch (error: any) {
      toast.error(error.message || "저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>링크 관리</CardTitle>
        <CardDescription>
          대시보드에 표시되는 외부 링크를 관리합니다. 빈 칸으로 두면 해당 버튼이 표시되지 않습니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="preOrderUrl">사전예약 공식홈페이지 URL</Label>
            <Input
              id="preOrderUrl"
              placeholder="https://pre-salemobile.uplus.co.kr"
              value={preOrderUrl}
              onChange={(e) => setPreOrderUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              비워두면 기본 URL(https://pre-salemobile.uplus.co.kr)이 사용됩니다.
            </p>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-3">온세일링크</h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="onsaleDeviceChange">기기변경 URL</Label>
                <Input
                  id="onsaleDeviceChange"
                  placeholder="https://example.com/device-change"
                  value={onsaleDeviceChangeUrl}
                  onChange={(e) => setOnsaleDeviceChangeUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="onsaleMNP">번호이동 URL</Label>
                <Input
                  id="onsaleMNP"
                  placeholder="https://example.com/mnp"
                  value={onsaleMNPUrl}
                  onChange={(e) => setOnsaleMNPUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="onsaleNew">신규 URL</Label>
                <Input
                  id="onsaleNew"
                  placeholder="https://example.com/new"
                  value={onsaleNewUrl}
                  onChange={(e) => setOnsaleNewUrl(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "저장 중..." : "저장"}
        </Button>
      </CardContent>
    </Card>
  );
}
