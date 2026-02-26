"use client";

import { Fragment } from "react";
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
import { useAuth } from "@/lib/auth";
import { Id } from "../../../convex/_generated/dataModel";
import { MODELS, COLORS_BY_MODEL, type Model } from "@/lib/constants";

export function GroupPivotTable() {
  const { groupId } = useAuth();
  const pivotData = useQuery(
    api.admin.groupReservationPivot,
    groupId ? { groupId: groupId as Id<"groups"> } : "skip"
  );

  if (!pivotData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>모델/색상별 예약 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">로딩 중...</p>
        </CardContent>
      </Card>
    );
  }

  const modelList = MODELS as readonly string[];
  const getColors = (model: string) => COLORS_BY_MODEL[model as Model] || [];

  type PivotRow = {
    total: number;
    mnpTotal: number;
    byModel: Record<string, { total: number; mnp: number; colorCounts: Array<{ color: string; count: number }> }>;
  };

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
              {md?.colorCounts.find(c => c.color === color)?.count || 0}
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
      transition={{ delay: 0.3 }}
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
                    매장명
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
                {renderRow(`${pivotData.groupName} 합계`, pivotData.groupPivot, true, "bg-yellow-50")}
                {pivotData.stores.map((store) =>
                  renderRow(store.name, store, false)
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
