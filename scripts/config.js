export const STORAGE_KEY = "yoyuan-ledger:v2";
export const INSTALLATION_KEY = "yoyuan-ledger:installation-id";

export const APP_META = {
  productName: "薪期台账",
  descriptor: "Payroll & Due Desk"
};

export const REMINDER_CATEGORIES = ["账单", "会员", "证件", "合同", "家庭", "其他"];

export const REMINDER_FILTERS = {
  all: "all",
  upcoming: "upcoming",
  overdue: "overdue"
};

export const DEFAULT_STATE = {
  salary: {
    day: 15,
    amount: "",
    account: "",
    notification: {
      enabled: false,
      leadDays: 0,
      hour: 9,
      timezone: "Asia/Shanghai",
      permission: "default",
      endpoint: "",
      lastSyncedAt: "",
      lastTestedAt: "",
      lastError: ""
    }
  },
  reminders: [],
  preferences: {
    city: "",
    reminderFilter: REMINDER_FILTERS.all
  },
  weather: {
    status: "idle",
    payload: null,
    updatedAt: null,
    error: ""
  }
};

export const WEATHER_CODES = {
  0: "晴朗",
  1: "大致晴",
  2: "局部多云",
  3: "阴天",
  45: "雾",
  48: "冻雾",
  51: "小毛毛雨",
  53: "毛毛雨",
  55: "强毛毛雨",
  61: "小雨",
  63: "中雨",
  65: "大雨",
  71: "小雪",
  73: "中雪",
  75: "大雪",
  80: "阵雨",
  81: "较强阵雨",
  82: "强阵雨",
  95: "雷暴"
};
