import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAuthVersion = query({
  args: {},
  handler: async (ctx) => {
    const setting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "authVersion"))
      .first();
    return setting?.value ?? 0;
  },
});

export const forceLogoutAll = mutation({
  args: {},
  handler: async (ctx) => {
    const setting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "authVersion"))
      .first();
    if (setting) {
      await ctx.db.patch(setting._id, { value: setting.value + 1 });
      return setting.value + 1;
    } else {
      await ctx.db.insert("settings", { key: "authVersion", value: 1 });
      return 1;
    }
  },
});

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

    const authVersionSetting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "authVersion"))
      .first();
    const authVersion = authVersionSetting?.value ?? 0;

    return {
      _id: user._id,
      loginId: user.loginId,
      name: user.name,
      role: user.role,
      groupId: user.groupId,
      groupName,
      storeId: user.storeId,
      storeName,
      authVersion,
    };
  },
});
