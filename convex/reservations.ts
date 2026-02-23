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
