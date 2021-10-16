import { TernaryStringSet } from "../index";
import { words, wordSet, shuffle } from "./utils";

let set: TernaryStringSet;

beforeEach(() => {
  set = new TernaryStringSet();
});

test("Delete empty string", () => {
  set.add("").add("horse");
  expect(set.size).toBe(2);
  expect(set.has("")).toBe(true);
  set.delete("");
  expect(set.size).toBe(1);
  expect(set.has("")).toBe(false);
});

test("Delete non-member", () => {
  expect(set.size).toBe(0);
  set.add("dog");
  expect(set.size).toBe(1);
  expect(set.has("cat")).toBe(false);
  expect(set.delete("cat")).toBe(false);
  expect(set.size).toBe(1);
});

test("Delete member", () => {
  expect(set.size).toBe(0);
  set.add("dog");
  expect(set.size).toBe(1);
  expect(set.has("dog")).toBe(true);
  expect(set.delete("dog")).toBe(true);
  expect(set.size).toBe(0);
});

test("Delete multiple", () => {
  set = wordSet();
  let size = set.size;
  const randomOrder = shuffle([...words]);

  for (const w of randomOrder) {
    expect(set.size).toBe(size--);
    expect(set.has(w)).toBe(true);
    expect(set.delete(w)).toBe(true);
    expect(set.has(w)).toBe(false);
  }
  expect(set.size).toBe(0);
});
