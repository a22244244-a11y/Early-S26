"use client";

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
import { useAuth } from "@/lib/auth";
import { Id } from "../../../convex/_generated/dataModel";

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-yellow-500 font-bold text-lg">🥇</span>;
  if (rank === 2) return <span className="text-gray-400 font-bold text-lg">🥈</span>;
  if (rank === 3) return <span className="text-amber-600 font-bold text-lg">🥉</span>;
  return <span className="text-muted-foreground">{rank}</span>;
}

export function RecruiterRanking() {
  const { groupId } = useAuth();
  const ranking = useQuery(
    api.reservations.recruiterRanking,
    groupId ? { groupId: groupId as Id<"groups"> } : "skip"
  );

  if (!ranking) {
    return (
      <Card>
        <CardHeader><CardTitle>전체 유치자별 순위</CardTitle></CardHeader>
        <CardContent><p className="text-center text-muted-foreground py-4">로딩 중...</p></CardContent>
      </Card>
    );
  }

  if (ranking.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>전체 유치자별 순위</CardTitle></CardHeader>
        <CardContent><p className="text-center text-muted-foreground py-4">등록된 예약이 없습니다.</p></CardContent>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <Card>
        <CardHeader>
          <CardTitle>전체 유치자별 순위</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center w-12">순위</TableHead>
                  <TableHead>유치자</TableHead>
                  <TableHead>매장</TableHead>
                  <TableHead className="text-center">예약</TableHead>
                  <TableHead className="text-center">MNP</TableHead>
                  <TableHead className="text-center">서류완료</TableHead>
                  <TableHead className="text-center">사전예약</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranking.map((r, i) => (
                  <TableRow key={`${r.recruiter}-${r.storeName}`} className={i < 3 ? "bg-yellow-50/50" : ""}>
                    <TableCell className="text-center"><RankBadge rank={i + 1} /></TableCell>
                    <TableCell className="font-medium">{r.recruiter}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.storeName}</TableCell>
                    <TableCell className="text-center font-bold">{r.total}</TableCell>
                    <TableCell className="text-center text-blue-600">{r.mnp}</TableCell>
                    <TableCell className="text-center">
                      <span className={r.docReady === r.total ? "text-green-600" : "text-muted-foreground"}>
                        {r.docReady}/{r.total}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={r.hasPreOrder === r.total ? "text-green-600" : "text-muted-foreground"}>
                        {r.hasPreOrder}/{r.total}
                      </span>
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
}

export function StoreRanking() {
  const { groupId, user } = useAuth();
  const ranking = useQuery(
    api.reservations.storeRanking,
    groupId ? { groupId: groupId as Id<"groups"> } : "skip"
  );

  if (!ranking) {
    return (
      <Card>
        <CardHeader><CardTitle>전체 매장별 순위</CardTitle></CardHeader>
        <CardContent><p className="text-center text-muted-foreground py-4">로딩 중...</p></CardContent>
      </Card>
    );
  }

  if (ranking.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>전체 매장별 순위</CardTitle></CardHeader>
        <CardContent><p className="text-center text-muted-foreground py-4">등록된 예약이 없습니다.</p></CardContent>
      </Card>
    );
  }

  const myStore = user?.storeName;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
      <Card>
        <CardHeader>
          <CardTitle>전체 매장별 순위</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center w-12">순위</TableHead>
                  <TableHead>매장명</TableHead>
                  <TableHead className="text-center">예약</TableHead>
                  <TableHead className="text-center">MNP</TableHead>
                  <TableHead className="text-center">서류완료</TableHead>
                  <TableHead className="text-center">사전예약</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranking.map((r, i) => {
                  const isMyStore = myStore === r.storeName;
                  return (
                    <TableRow
                      key={r.storeName}
                      className={isMyStore ? "bg-blue-100 border-l-4 border-l-blue-500" : i < 3 ? "bg-yellow-50/50" : ""}
                    >
                      <TableCell className="text-center"><RankBadge rank={i + 1} /></TableCell>
                      <TableCell className="font-medium">
                        {r.storeName}
                        {isMyStore && <Badge variant="default" className="ml-2 text-xs">내 매장</Badge>}
                      </TableCell>
                      <TableCell className="text-center font-bold">{r.total}</TableCell>
                      <TableCell className="text-center text-blue-600">{r.mnp}</TableCell>
                      <TableCell className="text-center">
                        <span className={r.docReady === r.total ? "text-green-600" : "text-muted-foreground"}>
                          {r.docReady}/{r.total}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={r.hasPreOrder === r.total ? "text-green-600" : "text-muted-foreground"}>
                          {r.hasPreOrder}/{r.total}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function GlobalRecruiterRanking() {
  const ranking = useQuery(api.reservations.globalRecruiterRanking);

  if (!ranking) {
    return (
      <Card>
        <CardHeader><CardTitle>전체 유치자 순위</CardTitle></CardHeader>
        <CardContent><p className="text-center text-muted-foreground py-4">로딩 중...</p></CardContent>
      </Card>
    );
  }

  if (ranking.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
      <Card>
        <CardHeader>
          <CardTitle>전체 유치자 순위</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center w-12">순위</TableHead>
                  <TableHead>유치자</TableHead>
                  <TableHead>매장</TableHead>
                  <TableHead>그룹</TableHead>
                  <TableHead className="text-center">예약</TableHead>
                  <TableHead className="text-center">MNP</TableHead>
                  <TableHead className="text-center">서류완료</TableHead>
                  <TableHead className="text-center">사전예약</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranking.map((r, i) => (
                  <TableRow key={`${r.recruiter}-${r.storeName}`} className={i < 3 ? "bg-yellow-50/50" : ""}>
                    <TableCell className="text-center"><RankBadge rank={i + 1} /></TableCell>
                    <TableCell className="font-medium">{r.recruiter}</TableCell>
                    <TableCell className="text-sm">{r.storeName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.groupName}</TableCell>
                    <TableCell className="text-center font-bold">{r.total}</TableCell>
                    <TableCell className="text-center text-blue-600">{r.mnp}</TableCell>
                    <TableCell className="text-center">
                      <span className={r.docReady === r.total ? "text-green-600" : "text-muted-foreground"}>
                        {r.docReady}/{r.total}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={r.hasPreOrder === r.total ? "text-green-600" : "text-muted-foreground"}>
                        {r.hasPreOrder}/{r.total}
                      </span>
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
}

export function GlobalStoreRanking() {
  const { user } = useAuth();
  const ranking = useQuery(api.reservations.globalStoreRanking);

  if (!ranking) {
    return (
      <Card>
        <CardHeader><CardTitle>전체 매장별 순위</CardTitle></CardHeader>
        <CardContent><p className="text-center text-muted-foreground py-4">로딩 중...</p></CardContent>
      </Card>
    );
  }

  if (ranking.length === 0) return null;

  const myStore = user?.storeName;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
      <Card>
        <CardHeader>
          <CardTitle>전체 매장별 순위</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center w-12">순위</TableHead>
                  <TableHead>매장명</TableHead>
                  <TableHead>그룹</TableHead>
                  <TableHead className="text-center">예약</TableHead>
                  <TableHead className="text-center">MNP</TableHead>
                  <TableHead className="text-center">서류완료</TableHead>
                  <TableHead className="text-center">사전예약</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranking.map((r, i) => {
                  const isMyStore = myStore === r.storeName;
                  return (
                    <TableRow
                      key={r.storeName}
                      className={isMyStore ? "bg-blue-100 border-l-4 border-l-blue-500" : i < 3 ? "bg-yellow-50/50" : ""}
                    >
                      <TableCell className="text-center"><RankBadge rank={i + 1} /></TableCell>
                      <TableCell className="font-medium">
                        {r.storeName}
                        {isMyStore && <Badge variant="default" className="ml-2 text-xs">내 매장</Badge>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.groupName}</TableCell>
                      <TableCell className="text-center font-bold">{r.total}</TableCell>
                      <TableCell className="text-center text-blue-600">{r.mnp}</TableCell>
                      <TableCell className="text-center">
                        <span className={r.docReady === r.total ? "text-green-600" : "text-muted-foreground"}>
                          {r.docReady}/{r.total}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={r.hasPreOrder === r.total ? "text-green-600" : "text-muted-foreground"}>
                          {r.hasPreOrder}/{r.total}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
