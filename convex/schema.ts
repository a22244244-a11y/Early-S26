import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const roleValidator = v.union(
  v.literal("super_admin"),
  v.literal("group_admin"),
  v.literal("staff")
);

export const subscriptionTypeValidator = v.union(
  v.literal("010신규"),
  v.literal("MNP"),
  v.literal("기변")
);

export const modelValidator = v.union(
  v.literal("S26"),
  v.literal("S26+"),
  v.literal("S26Ultra")
);

export const colorValidator = v.union(
  v.literal("블랙"),
  v.literal("화이트"),
  v.literal("코발트 바이올렛"),
  v.literal("스카이 블루"),
  v.literal("핑크 골드"),
  v.literal("실버 섀도우")
);

export const reservationStatusValidator = v.union(
  v.literal("대기"),
  v.literal("완료"),
  v.literal("개통완료"),
  v.literal("취소")
);

export const storageValidator = v.union(
  v.literal("256GB"),
  v.literal("512GB"),
  v.literal("1TB")
);

export const documentStatusValidator = v.union(
  v.literal("미작성"),
  v.literal("작성완료"),
  v.literal("보류")
);

export default defineSchema({
  groups: defineTable({
    name: v.string(),
    isActive: v.boolean(),
  }).index("by_name", ["name"]),

  stores: defineTable({
    groupId: v.id("groups"),
    name: v.string(),
    pCode: v.string(),
    isActive: v.boolean(),
  })
    .index("by_group", ["groupId"])
    .index("by_name", ["name"])
    .index("by_pCode", ["pCode"]),

  users: defineTable({
    loginId: v.string(),
    passwordHash: v.string(),
    name: v.string(),
    role: roleValidator,
    groupId: v.optional(v.id("groups")),
    storeId: v.optional(v.id("stores")),
    isActive: v.boolean(),
  })
    .index("by_loginId", ["loginId"])
    .index("by_group", ["groupId"])
    .index("by_group_role", ["groupId", "role"]),

  reservations: defineTable({
    groupId: v.optional(v.id("groups")),
    storeName: v.string(),
    recruiter: v.string(),
    subscriptionType: subscriptionTypeValidator,
    customerName: v.string(),
    productNumber: v.string(),
    model: modelValidator,
    color: colorValidator,
    storage: v.optional(storageValidator),
    activationTiming: v.string(),
    preOrderNumber: v.optional(v.string()),
    matchedSerialNumber: v.optional(v.string()),
    status: reservationStatusValidator,
    documentStatus: v.optional(documentStatusValidator),
  })
    .index("by_model_color_status", ["model", "color", "status"])
    .index("by_store", ["storeName"])
    .index("by_status", ["status"])
    .index("by_group", ["groupId"])
    .index("by_group_store", ["groupId", "storeName"])
    .index("by_group_status", ["groupId", "status"]),

  inventory: defineTable({
    groupId: v.optional(v.id("groups")),
    model: modelValidator,
    color: colorValidator,
    storage: v.optional(storageValidator),
    serialNumber: v.string(),
    isMatched: v.boolean(),
    isTransferred: v.optional(v.boolean()),
    transferNote: v.optional(v.string()),
    isActivated: v.optional(v.boolean()),
    arrivalDate: v.string(),
  })
    .index("by_model_color_matched", ["model", "color", "isMatched"])
    .index("by_serial", ["serialNumber"])
    .index("by_group", ["groupId"]),

  groupLinks: defineTable({
    groupId: v.id("groups"),
    preOrderUrl: v.optional(v.string()),
    onsaleDeviceChangeUrl: v.optional(v.string()),
    onsaleMNPUrl: v.optional(v.string()),
    onsaleNewUrl: v.optional(v.string()),
  }).index("by_group", ["groupId"]),
});
