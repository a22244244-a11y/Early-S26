import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const setDefaultStorage = mutation({
  args: {},
  handler: async (ctx) => {
    // 예약 데이터 중 storage가 없는 것들 512GB로 설정
    const allReservations = await ctx.db.query("reservations").collect();
    let resCount = 0;
    for (const r of allReservations) {
      if (!r.storage) {
        await ctx.db.patch(r._id, { storage: "512GB" });
        resCount++;
      }
    }

    // 재고 데이터 중 storage가 없는 것들 512GB로 설정
    const allInventory = await ctx.db.query("inventory").collect();
    let invCount = 0;
    for (const item of allInventory) {
      if (!item.storage) {
        await ctx.db.patch(item._id, { storage: "512GB" });
        invCount++;
      }
    }

    return { reservationsUpdated: resCount, inventoryUpdated: invCount };
  },
});

export const updateStorePassword = mutation({
  args: {
    storeName: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const store = await ctx.db
      .query("stores")
      .withIndex("by_name", (q) => q.eq("name", args.storeName))
      .first();
    if (!store) throw new Error(`매장 "${args.storeName}"을 찾을 수 없습니다.`);

    const allUsers = await ctx.db.query("users").collect();
    const storeUsers = allUsers.filter((u) => u.storeId === store._id);

    let updated = 0;
    const names: string[] = [];
    for (const user of storeUsers) {
      await ctx.db.patch(user._id, { passwordHash: args.newPassword });
      names.push(user.name);
      updated++;
    }
    return { storeName: args.storeName, usersUpdated: updated, userNames: names };
  },
});
