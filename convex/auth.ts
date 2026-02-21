import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const login = mutation({
  args: {
    loginId: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_loginId", (q) => q.eq("loginId", args.loginId))
      .first();

    if (!user || user.passwordHash !== args.password || !user.isActive) {
      return null;
    }

    let groupName: string | undefined;
    let storeName: string | undefined;

    if (user.groupId) {
      const group = await ctx.db.get(user.groupId);
      groupName = group?.name;
    }
    if (user.storeId) {
      const store = await ctx.db.get(user.storeId);
      storeName = store?.name;
    }

    return {
      _id: user._id,
      loginId: user.loginId,
      name: user.name,
      role: user.role,
      groupId: user.groupId,
      groupName,
      storeId: user.storeId,
      storeName,
    };
  },
});
