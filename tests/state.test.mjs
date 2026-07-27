import assert from "node:assert/strict";
import test from "node:test";

test("salary settings persist through a fresh app-state load", async () => {
  const storage = new Map();
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key)
  };
  globalThis.window = { dispatchEvent: () => {} };
  globalThis.CustomEvent = class CustomEvent {
    constructor(type) {
      this.type = type;
    }
  };

  const firstLoad = await import(`../scripts/state.js?first=${Date.now()}`);
  firstLoad.updateSalary({ day: 10, amount: "15,000 元", account: "工资卡" });

  const secondLoad = await import(`../scripts/state.js?second=${Date.now()}`);
  assert.deepEqual(secondLoad.getState().salary, {
    ...secondLoad.getState().salary,
    day: 10,
    amount: "15,000 元",
    account: "工资卡"
  });
});
