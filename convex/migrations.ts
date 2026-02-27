import { mutation } from "./_generated/server";

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
