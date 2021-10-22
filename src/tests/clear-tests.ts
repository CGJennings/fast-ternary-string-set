import { TernaryStringSet } from "../index";

let set: TernaryStringSet;

beforeEach(() => {
  set = new TernaryStringSet();
});

test("clear() is fluent", () => {
  expect(set.clear()).toBe(set);
});

test("Clear empty tree", () => {
  expect(set.size).toBe(0);
  expect(() => set.clear()).not.toThrow();
  expect(set.size).toBe(0);
});

test("Clear non-empty tree", () => {
  set.addAll(["chicken", "duck", "whale"]);
  expect(set.size).toBe(3);
  set.clear();
  expect(set.size).toBe(0);
});

test("Clear tree with empty string", () => {
  set.add("horse").add("");
  expect(set.size).toBe(2);
  expect(set.has("")).toBe(true);
  set.clear();
  expect(set.size).toBe(0);
  expect(set.has("")).toBe(false);
});
