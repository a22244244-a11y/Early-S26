import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  subscriptionTypeValidator,
  modelValidator,
  colorValidator,
  documentStatusValidator,
} from "./schema";

export const list = query({
  args: {
    groupId: v.id("groups"),
    storeName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.storeName) {
      return await ctx.db
        .query("reservations")
        .withIndex("by_group_store", (q) =>
          q.eq("groupId", args.groupId).eq("storeName", args.storeName!)
        )
        .order("desc")
        .collect();
    }
    return await ctx.db
      .query("reservations")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .order("desc")
      .collect();
  },
});

export const countByModelColor = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("reservations")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();
    const map = new Map<string, { model: string; color: string; total: number; matched: number; docCompleted: number; hasPreOrder: number }>();
    for (const r of all) {
      if (r.status === "취소") continue;
      const key = `${r.model}__${r.color}`;
      if (!map.has(key)) map.set(key, { model: r.model, color: r.color, total: 0, matched: 0, docCompleted: 0, hasPreOrder: 0 });
      const entry = map.get(key)!;
      entry.total++;
      if (r.status === "완료") entry.matched++;
      if (r.documentStatus === "작성완료") entry.docCompleted++;
      if (r.preOrderNumber) entry.hasPreOrder++;
    }
    return Array.from(map.values());
  },
});

// 그룹 내 유치자별 순위
export const recruiterRanking = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("reservations")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();
    const active = all.filter((r) => r.status !== "취소");
    const map = new Map<string, { recruiter: string; storeName: string; total: number; mnp: number; completed: number; docReady: number; hasPreOrder: number }>();
    for (const r of active) {
      const key = r.recruiter;
      if (!map.has(key)) map.set(key, { recruiter: r.recruiter, storeName: r.storeName, total: 0, mnp: 0, completed: 0, docReady: 0, hasPreOrder: 0 });
      const e = map.get(key)!;
      e.total++;
      if (r.subscriptionType === "MNP") e.mnp++;
      if (r.status === "완료") e.completed++;
      if (r.documentStatus === "작성완료") e.docReady++;
      if (r.preOrderNumber) e.hasPreOrder++;
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  },
});

// 그룹 내 매장별 순위
export const storeRanking = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("reservations")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();
    const active = all.filter((r) => r.status !== "취소");
    const map = new Map<string, { storeName: string; total: number; mnp: number; completed: number; docReady: number; hasPreOrder: number }>();
    for (const r of active) {
      const key = r.storeName;
      if (!map.has(key)) map.set(key, { storeName: r.storeName, total: 0, mnp: 0, completed: 0, docReady: 0, hasPreOrder: 0 });
      const e = map.get(key)!;
      e.total++;
      if (r.subscriptionType === "MNP") e.mnp++;
      if (r.status === "완료") e.completed++;
      if (r.documentStatus === "작성완료") e.docReady++;
      if (r.preOrderNumber) e.hasPreOrder++;
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  },
});

// 전체 유치자 순위 (superadmin)
export const globalRecruiterRanking = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("reservations").collect();
    const active = all.filter((r) => r.status !== "취소");
    const groups = await ctx.db.query("groups").collect();
    const stores = await ctx.db.query("stores").collect();
    const groupMap = new Map(groups.map((g) => [g._id, g.name]));
    // storeName → { 정식매장명, 그룹명 } 매핑
    const storeToGroup = new Map(stores.map((s) => [s.name, { storeName: s.name, groupName: groupMap.get(s.groupId) ?? "" }]));
    const map = new Map<string, { recruiter: string; storeName: string; groupName: string; total: number; mnp: number; completed: number; docReady: number; hasPreOrder: number }>();
    for (const r of active) {
      const storeInfo = storeToGroup.get(r.storeName);
      const groupName = r.groupId ? (groupMap.get(r.groupId) ?? "") : (storeInfo?.groupName ?? "");
      const key = `${r.recruiter}__${r.storeName}`;
      if (!map.has(key)) map.set(key, { recruiter: r.recruiter, storeName: r.storeName, groupName, total: 0, mnp: 0, completed: 0, docReady: 0, hasPreOrder: 0 });
      const e = map.get(key)!;
      e.total++;
      if (r.subscriptionType === "MNP") e.mnp++;
      if (r.status === "완료") e.completed++;
      if (r.documentStatus === "작성완료") e.docReady++;
      if (r.preOrderNumber) e.hasPreOrder++;
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  },
});

export const create = mutation({
  args: {
    groupId: v.id("groups"),
    storeName: v.string(),
    recruiter: v.string(),
    subscriptionType: subscriptionTypeValidator,
    customerName: v.string(),
    productNumber: v.string(),
    model: modelValidator,
    color: colorValidator,
    activationTiming: v.string(),
    preOrderNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("reservations", {
      ...args,
      preOrderNumber: args.preOrderNumber || undefined,
      matchedSerialNumber: undefined,
      status: "대기",
      documentStatus: "미작성",
    });
  },
});

export const updatePreOrderNumber = mutation({
  args: {
    id: v.id("reservations"),
    preOrderNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const reservation = await ctx.db.get(args.id);
    if (!reservation) throw new Error("예약을 찾을 수 없습니다.");
    await ctx.db.patch(args.id, {
      preOrderNumber: args.preOrderNumber || undefined,
    });
  },
});

export const cancel = mutation({
  args: { id: v.id("reservations") },
  handler: async (ctx, args) => {
    const reservation = await ctx.db.get(args.id);
    if (!reservation) throw new Error("예약을 찾을 수 없습니다.");
    if (reservation.status === "완료") throw new Error("매칭 완료된 예약은 취소할 수 없습니다. 먼저 매칭을 해제하세요.");
    if (reservation.status === "취소") throw new Error("이미 취소된 예약입니다.");
    await ctx.db.patch(args.id, { status: "취소" });
  },
});

export const remove = mutation({
  args: { id: v.id("reservations") },
  handler: async (ctx, args) => {
    const reservation = await ctx.db.get(args.id);
    if (reservation && reservation.matchedSerialNumber) {
      const inventoryItems = await ctx.db
        .query("inventory")
        .withIndex("by_serial", (q) =>
          q.eq("serialNumber", reservation.matchedSerialNumber!)
        )
        .collect();
      for (const item of inventoryItems) {
        await ctx.db.patch(item._id, { isMatched: false });
      }
    }
    await ctx.db.delete(args.id);
  },
});

export const unmatch = mutation({
  args: { id: v.id("reservations") },
  handler: async (ctx, args) => {
    const reservation = await ctx.db.get(args.id);
    if (!reservation) throw new Error("예약을 찾을 수 없습니다.");
    if (reservation.matchedSerialNumber) {
      const inventoryItems = await ctx.db
        .query("inventory")
        .withIndex("by_serial", (q) =>
          q.eq("serialNumber", reservation.matchedSerialNumber!)
        )
        .collect();
      for (const item of inventoryItems) {
        await ctx.db.patch(item._id, { isMatched: false });
      }
    }
    await ctx.db.patch(args.id, {
      matchedSerialNumber: undefined,
      status: "대기",
    });
  },
});

export const updateModel = mutation({
  args: {
    id: v.id("reservations"),
    model: modelValidator,
    color: colorValidator,
  },
  handler: async (ctx, args) => {
    const reservation = await ctx.db.get(args.id);
    if (!reservation) throw new Error("예약을 찾을 수 없습니다.");
    if (reservation.status === "완료") throw new Error("매칭 완료된 예약은 변경할 수 없습니다.");
    await ctx.db.patch(args.id, { model: args.model, color: args.color });
  },
});

export const updateColor = mutation({
  args: {
    id: v.id("reservations"),
    color: colorValidator,
  },
  handler: async (ctx, args) => {
    const reservation = await ctx.db.get(args.id);
    if (!reservation) throw new Error("예약을 찾을 수 없습니다.");
    if (reservation.status === "완료") throw new Error("매칭 완료된 예약은 변경할 수 없습니다.");
    await ctx.db.patch(args.id, { color: args.color });
  },
});

export const updateDocumentStatus = mutation({
  args: {
    id: v.id("reservations"),
    documentStatus: documentStatusValidator,
  },
  handler: async (ctx, args) => {
    const reservation = await ctx.db.get(args.id);
    if (!reservation) throw new Error("예약을 찾을 수 없습니다.");
    await ctx.db.patch(args.id, { documentStatus: args.documentStatus });
  },
});
