import { mutation } from "./_generated/server";

export const init = mutation({
  args: {},
  handler: async (ctx) => {
    // super_admin 이미 존재하는지 확인
    const existing = await ctx.db
      .query("users")
      .withIndex("by_loginId", (q) => q.eq("loginId", "superadmin"))
      .first();

    if (existing) {
      throw new Error("이미 초기화되었습니다. super_admin 계정이 존재합니다.");
    }

    // super_admin 계정 생성
    await ctx.db.insert("users", {
      loginId: "superadmin",
      passwordHash: "admin123",
      name: "시스템관리자",
      role: "super_admin",
      isActive: true,
    });

    return "초기화 완료: super_admin 계정이 생성되었습니다.";
  },
});
