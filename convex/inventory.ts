import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { modelValidator, colorValidator } from "./schema";

export const list = query({
  args: {
    groupId: v.id("groups"),
    isMatched: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("inventory")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .order("desc")
      .collect();
    const filtered = args.isMatched !== undefined
      ? all.filter((item) => item.isMatched === args.isMatched)
      : all;

    const matchedSerials = filtered.filter((item) => item.isMatched).map((item) => item.serialNumber);
    const reservations = matchedSerials.length > 0
      ? await ctx.db
          .query("reservations")
          .withIndex("by_group_status", (q) =>
            q.eq("groupId", args.groupId).eq("status", "완료")
          )
          .collect()
      : [];

    const serialToCustomer = new Map<string, { customerName: string; storeName: string }>();
    for (const r of reservations) {
      if (r.matchedSerialNumber) {
        serialToCustomer.set(r.matchedSerialNumber, {
          customerName: r.customerName,
          storeName: r.storeName,
        });
      }
    }

    return filtered.map((item) => {
      const matched = item.isMatched ? serialToCustomer.get(item.serialNumber) : undefined;
      return {
        ...item,
        matchedCustomerName: matched?.customerName,
        matchedStoreName: matched?.storeName,
      };
    });
  },
});

export const countByModelColor = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("inventory")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();
    const map = new Map<string, { model: string; color: string; total: number; available: number; transferred: number }>();
    for (const item of all) {
      const key = `${item.model}__${item.color}`;
      if (!map.has(key)) map.set(key, { model: item.model, color: item.color, total: 0, available: 0, transferred: 0 });
      const entry = map.get(key)!;
      entry.total++;
      if (item.isTransferred) {
        entry.transferred++;
      } else if (!item.isMatched) {
        entry.available++;
      }
    }
    return Array.from(map.values());
  },
});

export const assignableReservations = query({
  args: { inventoryId: v.id("inventory") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.inventoryId);
    if (!item) throw new Error("재고 항목을 찾을 수 없습니다.");

    const allReservations = await ctx.db
      .query("reservations")
      .withIndex("by_model_color_status", (q) =>
        q.eq("model", item.model).eq("color", item.color).eq("status", "대기")
      )
      .order("asc")
      .collect();
    // 같은 그룹의 예약만 필터
    const reservations = allReservations.filter((r) => r.groupId === item.groupId);

    // 우선순위: MNP우선 > 서류작성완료+등록순 > 서류미작성+등록순
    reservations.sort((a, b) => {
      const aIsMNP = a.subscriptionType === "MNP" ? 0 : 1;
      const bIsMNP = b.subscriptionType === "MNP" ? 0 : 1;
      if (aIsMNP !== bIsMNP) return aIsMNP - bIsMNP;

      const aDocDone = a.documentStatus === "작성완료" ? 0 : 1;
      const bDocDone = b.documentStatus === "작성완료" ? 0 : 1;
      if (aDocDone !== bDocDone) return aDocDone - bDocDone;

      return a._creationTime - b._creationTime;
    });

    return reservations.map((r) => ({
      _id: r._id,
      _creationTime: r._creationTime,
      customerName: r.customerName,
      storeName: r.storeName,
      recruiter: r.recruiter,
      subscriptionType: r.subscriptionType,
      activationTiming: r.activationTiming,
      documentStatus: r.documentStatus,
      preOrderNumber: r.preOrderNumber,
    }));
  },
});

export const manualMatch = mutation({
  args: {
    inventoryId: v.id("inventory"),
    reservationId: v.id("reservations"),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.inventoryId);
    if (!item) throw new Error("재고 항목을 찾을 수 없습니다.");
    if (item.isMatched) throw new Error("이미 매칭된 재고입니다.");
    if (item.isTransferred) throw new Error("타점출고된 재고는 배정할 수 없습니다.");

    const reservation = await ctx.db.get(args.reservationId);
    if (!reservation) throw new Error("예약을 찾을 수 없습니다.");
    if (reservation.status === "완료") throw new Error("이미 매칭된 예약입니다.");

    await ctx.db.patch(args.reservationId, {
      status: "완료",
      matchedSerialNumber: item.serialNumber,
    });
    await ctx.db.patch(args.inventoryId, { isMatched: true });
  },
});

export const create = mutation({
  args: {
    groupId: v.id("groups"),
    model: modelValidator,
    color: colorValidator,
    serialNumber: v.string(),
    arrivalDate: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("inventory")
      .withIndex("by_serial", (q) => q.eq("serialNumber", args.serialNumber))
      .first();
    if (existing) {
      throw new Error(
        `일련번호 ${args.serialNumber} 이(가) 이미 등록되어 있습니다.`
      );
    }
    return await ctx.db.insert("inventory", {
      ...args,
      isMatched: false,
    });
  },
});

export const createBulk = mutation({
  args: {
    groupId: v.id("groups"),
    items: v.array(
      v.object({
        model: modelValidator,
        color: colorValidator,
        serialNumber: v.string(),
        arrivalDate: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const results: string[] = [];
    for (const item of args.items) {
      const existing = await ctx.db
        .query("inventory")
        .withIndex("by_serial", (q) => q.eq("serialNumber", item.serialNumber))
        .first();
      if (existing) {
        throw new Error(
          `일련번호 ${item.serialNumber} 이(가) 이미 등록되어 있습니다.`
        );
      }
      const id = await ctx.db.insert("inventory", {
        ...item,
        groupId: args.groupId,
        isMatched: false,
      });
      results.push(id);
    }
    return results;
  },
});

export const unmatchInventory = mutation({
  args: { id: v.id("inventory") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("재고 항목을 찾을 수 없습니다.");
    if (!item.isMatched) throw new Error("매칭되지 않은 재고입니다.");

    const reservation = await ctx.db
      .query("reservations")
      .withIndex("by_status", (q) => q.eq("status", "완료"))
      .collect();
    const matched = reservation.find(
      (r) => r.matchedSerialNumber === item.serialNumber
    );
    if (matched) {
      await ctx.db.patch(matched._id, {
        matchedSerialNumber: undefined,
        status: "대기",
      });
    }

    await ctx.db.patch(args.id, { isMatched: false });
  },
});

export const transfer = mutation({
  args: {
    id: v.id("inventory"),
    transferNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("재고 항목을 찾을 수 없습니다.");
    if (item.isMatched) {
      throw new Error("매칭된 재고는 타점출고할 수 없습니다. 먼저 매칭을 해제하세요.");
    }
    if (item.isTransferred) {
      throw new Error("이미 타점출고된 재고입니다.");
    }

    await ctx.db.patch(args.id, {
      isTransferred: true,
      transferNote: args.transferNote || undefined,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("inventory") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("재고 항목을 찾을 수 없습니다.");
    if (item.isMatched) {
      throw new Error(
        "매칭된 재고는 삭제할 수 없습니다. 먼저 매칭을 해제하세요."
      );
    }
    await ctx.db.delete(args.id);
  },
});
