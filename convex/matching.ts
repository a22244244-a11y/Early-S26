import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const preview = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const allPending = await ctx.db
      .query("reservations")
      .withIndex("by_group_status", (q) =>
        q.eq("groupId", args.groupId).eq("status", "대기")
      )
      .collect();
    // 서류 작성완료된 예약만 매칭 대상
    const pendingReservations = allPending
      .filter((r) => r.documentStatus === "작성완료")
      .sort((a, b) => {
        const aIsMNP = a.subscriptionType === "MNP" ? 0 : 1;
        const bIsMNP = b.subscriptionType === "MNP" ? 0 : 1;
        if (aIsMNP !== bIsMNP) return aIsMNP - bIsMNP;
        return a._creationTime - b._creationTime;
      });

    const allInventory = await ctx.db
      .query("inventory")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();
    const available = allInventory.filter((i) => !i.isMatched && !i.isTransferred);

    const inventoryMap: Record<string, typeof available> = {};
    for (const item of available) {
      const key = `${item.model}__${item.color}__${item.storage || "512GB"}`;
      if (!inventoryMap[key]) inventoryMap[key] = [];
      inventoryMap[key].push(item);
    }

    const matches: Array<{
      reservationId: string;
      customerName: string;
      model: string;
      color: string;
      storage: string;
      serialNumber: string;
    }> = [];
    const unmatched: Array<{
      reservationId: string;
      customerName: string;
      model: string;
      color: string;
      storage: string;
    }> = [];

    const consumed = new Set<string>();

    for (const reservation of pendingReservations) {
      const storage = reservation.storage || "512GB";
      const key = `${reservation.model}__${reservation.color}__${storage}`;
      const pool = inventoryMap[key] || [];
      const availableItem = pool.find((i) => !consumed.has(i._id));

      if (availableItem) {
        consumed.add(availableItem._id);
        matches.push({
          reservationId: reservation._id,
          customerName: reservation.customerName,
          model: reservation.model,
          color: reservation.color,
          storage,
          serialNumber: availableItem.serialNumber,
        });
      } else {
        unmatched.push({
          reservationId: reservation._id,
          customerName: reservation.customerName,
          model: reservation.model,
          color: reservation.color,
          storage,
        });
      }
    }

    return { matches, unmatched, totalPending: pendingReservations.length };
  },
});

export const execute = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const allPending = await ctx.db
      .query("reservations")
      .withIndex("by_group_status", (q) =>
        q.eq("groupId", args.groupId).eq("status", "대기")
      )
      .collect();
    // 서류 작성완료된 예약만 매칭 대상, MNP 우선 + 등록순
    const pendingReservations = allPending
      .filter((r) => r.documentStatus === "작성완료")
      .sort((a, b) => {
        const aIsMNP = a.subscriptionType === "MNP" ? 0 : 1;
        const bIsMNP = b.subscriptionType === "MNP" ? 0 : 1;
        if (aIsMNP !== bIsMNP) return aIsMNP - bIsMNP;
        return a._creationTime - b._creationTime;
      });

    const modelColorStoragePairs = new Set<string>();
    for (const r of pendingReservations) {
      modelColorStoragePairs.add(`${r.model}__${r.color}__${r.storage || "512GB"}`);
    }

    const inventoryMap: Record<
      string,
      Array<{ _id: string; serialNumber: string }>
    > = {};

    for (const triple of modelColorStoragePairs) {
      const [model, color, storage] = triple.split("__");
      const items = await ctx.db
        .query("inventory")
        .withIndex("by_model_color_matched", (q) =>
          q
            .eq("model", model as "S26" | "S26+" | "S26Ultra")
            .eq("color", color as "블랙" | "화이트" | "코발트 바이올렛" | "스카이 블루" | "핑크 골드" | "실버 섀도우")
            .eq("isMatched", false)
        )
        .collect();
      // 그룹 내 + 같은 용량 재고만 필터
      const groupItems = items.filter((i) => i.groupId === args.groupId && (i.storage || "512GB") === storage);
      inventoryMap[triple] = groupItems.map((i) => ({
        _id: i._id,
        serialNumber: i.serialNumber,
      }));
    }

    let matchedCount = 0;
    const usedIndexes: Record<string, number> = {};

    for (const reservation of pendingReservations) {
      const key = `${reservation.model}__${reservation.color}__${reservation.storage || "512GB"}`;
      const pool = inventoryMap[key] || [];
      const currentIndex = usedIndexes[key] || 0;

      if (currentIndex < pool.length) {
        const inventoryItem = pool[currentIndex];
        usedIndexes[key] = currentIndex + 1;

        await ctx.db.patch(reservation._id, {
          matchedSerialNumber: inventoryItem.serialNumber,
          status: "완료",
        });

        await ctx.db.patch(inventoryItem._id as any, {
          isMatched: true,
        });

        matchedCount++;
      }
    }

    return {
      totalPending: pendingReservations.length,
      matched: matchedCount,
      remaining: pendingReservations.length - matchedCount,
    };
  },
});

export const resetAll = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    const matchedReservations = await ctx.db
      .query("reservations")
      .withIndex("by_group_status", (q) =>
        q.eq("groupId", args.groupId).eq("status", "완료")
      )
      .collect();

    for (const r of matchedReservations) {
      await ctx.db.patch(r._id, {
        matchedSerialNumber: undefined,
        status: "대기",
      });
    }

    const allInventory = await ctx.db
      .query("inventory")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();
    for (const item of allInventory) {
      if (item.isMatched) {
        await ctx.db.patch(item._id, { isMatched: false });
      }
    }

    return { resetCount: matchedReservations.length };
  },
});
