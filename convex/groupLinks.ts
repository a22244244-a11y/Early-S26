import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("groupLinks")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .first();
  },
});

export const upsert = mutation({
  args: {
    groupId: v.id("groups"),
    preOrderUrl: v.optional(v.string()),
    onsaleDeviceChangeUrl: v.optional(v.string()),
    onsaleMNPUrl: v.optional(v.string()),
    onsaleNewUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("groupLinks")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .first();

    const data = {
      preOrderUrl: args.preOrderUrl || undefined,
      onsaleDeviceChangeUrl: args.onsaleDeviceChangeUrl || undefined,
      onsaleMNPUrl: args.onsaleMNPUrl || undefined,
      onsaleNewUrl: args.onsaleNewUrl || undefined,
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    } else {
      return await ctx.db.insert("groupLinks", {
        groupId: args.groupId,
        ...data,
      });
    }
  },
});
