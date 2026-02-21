import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { roleValidator } from "./schema";

// ========== Groups ==========

export const listGroups = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("groups").collect();
  },
});

export const createGroup = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("groups")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
    if (existing) {
      throw new Error(`그룹 "${args.name}"이(가) 이미 존재합니다.`);
    }
    return await ctx.db.insert("groups", { name: args.name, isActive: true });
  },
});

export const updateGroup = mutation({
  args: {
    id: v.id("groups"),
    name: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.id);
    if (!group) throw new Error("그룹을 찾을 수 없습니다.");
    const patch: Record<string, unknown> = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.isActive !== undefined) patch.isActive = args.isActive;
    await ctx.db.patch(args.id, patch);
  },
});

export const removeGroup = mutation({
  args: { id: v.id("groups") },
  handler: async (ctx, args) => {
    const stores = await ctx.db
      .query("stores")
      .withIndex("by_group", (q) => q.eq("groupId", args.id))
      .collect();
    if (stores.length > 0) {
      throw new Error("소속 매장이 있는 그룹은 삭제할 수 없습니다. 먼저 매장을 삭제하세요.");
    }
    const users = await ctx.db
      .query("users")
      .withIndex("by_group", (q) => q.eq("groupId", args.id))
      .collect();
    if (users.length > 0) {
      throw new Error("소속 사용자가 있는 그룹은 삭제할 수 없습니다. 먼저 사용자를 삭제하세요.");
    }
    await ctx.db.delete(args.id);
  },
});

// ========== Stores ==========

export const listStores = query({
  args: { groupId: v.optional(v.id("groups")) },
  handler: async (ctx, args) => {
    if (args.groupId) {
      return await ctx.db
        .query("stores")
        .withIndex("by_group", (q) => q.eq("groupId", args.groupId!))
        .collect();
    }
    return await ctx.db.query("stores").collect();
  },
});

export const storesByGroup = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("stores")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const createStore = mutation({
  args: {
    groupId: v.id("groups"),
    name: v.string(),
    pCode: v.string(),
  },
  handler: async (ctx, args) => {
    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("그룹을 찾을 수 없습니다.");

    const existingStores = await ctx.db
      .query("stores")
      .withIndex("by_group", (q) => q.eq("groupId", args.groupId))
      .collect();

    if (existingStores.length >= 20) {
      throw new Error("그룹당 최대 20개 매장까지 등록 가능합니다.");
    }

    const duplicate = existingStores.find((s) => s.name === args.name);
    if (duplicate) {
      throw new Error(`매장 "${args.name}"이(가) 이미 존재합니다.`);
    }

    // P코드 중복 확인
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_loginId", (q) => q.eq("loginId", args.pCode))
      .first();
    if (existingUser) {
      throw new Error(`P코드 "${args.pCode}"이(가) 이미 사용 중입니다.`);
    }

    // 매장 생성
    const storeId = await ctx.db.insert("stores", {
      groupId: args.groupId,
      name: args.name,
      pCode: args.pCode,
      isActive: true,
    });

    // P코드로 staff 계정 자동 생성
    await ctx.db.insert("users", {
      loginId: args.pCode,
      passwordHash: "password123",
      name: args.name,
      role: "staff",
      groupId: args.groupId,
      storeId: storeId,
      isActive: true,
    });

    return storeId;
  },
});

export const updateStore = mutation({
  args: {
    id: v.id("stores"),
    name: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.id);
    if (!store) throw new Error("매장을 찾을 수 없습니다.");
    const patch: Record<string, unknown> = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.isActive !== undefined) patch.isActive = args.isActive;
    await ctx.db.patch(args.id, patch);
  },
});

export const removeStore = mutation({
  args: { id: v.id("stores") },
  handler: async (ctx, args) => {
    const store = await ctx.db.get(args.id);
    if (!store) throw new Error("매장을 찾을 수 없습니다.");

    // 연결된 staff 계정도 삭제
    const staffUser = await ctx.db
      .query("users")
      .withIndex("by_loginId", (q) => q.eq("loginId", store.pCode))
      .first();
    if (staffUser) {
      await ctx.db.delete(staffUser._id);
    }

    await ctx.db.delete(args.id);
  },
});

// ========== Users ==========

export const listUsers = query({
  args: { groupId: v.optional(v.id("groups")) },
  handler: async (ctx, args) => {
    let users;
    if (args.groupId) {
      users = await ctx.db
        .query("users")
        .withIndex("by_group", (q) => q.eq("groupId", args.groupId!))
        .collect();
    } else {
      users = await ctx.db.query("users").collect();
    }

    const result = [];
    for (const user of users) {
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
      result.push({
        ...user,
        passwordHash: undefined,
        groupName,
        storeName,
      });
    }
    return result;
  },
});

export const createUser = mutation({
  args: {
    loginId: v.string(),
    password: v.string(),
    name: v.string(),
    groupId: v.id("groups"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_loginId", (q) => q.eq("loginId", args.loginId))
      .first();
    if (existing) {
      throw new Error(`아이디 "${args.loginId}"이(가) 이미 존재합니다.`);
    }

    const group = await ctx.db.get(args.groupId);
    if (!group) throw new Error("그룹을 찾을 수 없습니다.");

    return await ctx.db.insert("users", {
      loginId: args.loginId,
      passwordHash: args.password,
      name: args.name,
      role: "group_admin",
      groupId: args.groupId,
      isActive: true,
    });
  },
});

export const updateUser = mutation({
  args: {
    id: v.id("users"),
    name: v.optional(v.string()),
    password: v.optional(v.string()),
    role: v.optional(roleValidator),
    groupId: v.optional(v.id("groups")),
    storeId: v.optional(v.id("stores")),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) throw new Error("사용자를 찾을 수 없습니다.");
    const patch: Record<string, unknown> = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.password !== undefined) patch.passwordHash = args.password;
    if (args.role !== undefined) patch.role = args.role;
    if (args.groupId !== undefined) patch.groupId = args.groupId;
    if (args.storeId !== undefined) patch.storeId = args.storeId;
    if (args.isActive !== undefined) patch.isActive = args.isActive;
    await ctx.db.patch(args.id, patch);
  },
});

export const removeUser = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) throw new Error("사용자를 찾을 수 없습니다.");
    if (user.role === "super_admin") {
      throw new Error("최고 관리자 계정은 삭제할 수 없습니다.");
    }
    await ctx.db.delete(args.id);
  },
});
