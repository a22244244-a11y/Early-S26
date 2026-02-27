export const SUBSCRIPTION_TYPES = ["010신규", "MNP", "기변"] as const;
export type SubscriptionType = (typeof SUBSCRIPTION_TYPES)[number];

export const MODELS = ["S26", "S26+", "S26Ultra"] as const;
export type Model = (typeof MODELS)[number];

export const COLORS_BY_MODEL: Record<Model, readonly string[]> = {
  S26: ["블랙", "화이트", "코발트 바이올렛", "스카이 블루"],
  "S26+": ["블랙", "화이트", "코발트 바이올렛", "스카이 블루"],
  S26Ultra: [
    "블랙",
    "화이트",
    "코발트 바이올렛",
    "스카이 블루",
  ],
};

export const ALL_COLORS = [
  "블랙",
  "화이트",
  "코발트 바이올렛",
  "스카이 블루",
  "핑크 골드",
  "실버 섀도우",
] as const;
export type Color = (typeof ALL_COLORS)[number];

export const STORAGES = ["256GB", "512GB", "1TB"] as const;
export type Storage = (typeof STORAGES)[number];

export const ACTIVATION_TIMINGS = [
  "당일개통_12시 이전",
  "당일개통_12시 이후",
  "당일개통불가",
] as const;
export type ActivationTiming = (typeof ACTIVATION_TIMINGS)[number];
