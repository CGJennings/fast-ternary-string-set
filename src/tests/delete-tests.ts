import { TernaryStringSet } from "../fast-ternary-string-set";
import { words, wordSet, shuffle } from "./utils";

let set: TernaryStringSet;

beforeEach(() => {
  set = new TernaryStringSet();
});

test("delete() empty string", () => {
  set.add("").add("horse");
  expect(set.size).toBe(2);
  expect(set.has("")).toBe(true);
  set.delete("");
  expect(set.size).toBe(1);
  expect(set.has("")).toBe(false);
});

test("delete() non-member", () => {
  expect(set.size).toBe(0);
  set.add("dog");
  expect(set.size).toBe(1);
  expect(set.has("cat")).toBe(false);
  expect(set.delete("cat")).toBe(false);
  expect(set.size).toBe(1);
});

test("delete() member", () => {
  expect(set.size).toBe(0);
  set.add("dog");
  expect(set.size).toBe(1);
  expect(set.has("dog")).toBe(true);
  expect(set.delete("dog")).toBe(true);
  expect(set.size).toBe(0);
});

test("delete() returns whether element was present", () => {
  set = wordSet();
  for (const el of words) {
    expect(set.delete(el)).toBe(true);
  }
  expect(set.size).toBe(0);
  expect(set.delete("")).toBe(false);
  set.add("");
  expect(set.delete("cat")).toBe(false);
  expect(set.delete("")).toBe(true);
  expect(set.delete("cat")).toBe(false);
});

test("delete() multiple", () => {
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

test("deleteAll() deletes listed elements", () => {
  set = wordSet();
  const size = set.size;
  set.deleteAll();
  expect(set.size).toBe(size);
  set.deleteAll("bear");
  expect(set.size).toBe(size - 1);
  set.deleteAll("chicken", "elephant");
  expect(set.size).toBe(size - 3);
  expect(set.has("bear")).toBeFalsy();
  expect(set.has("chicken")).toBeFalsy();
  expect(set.has("elephant")).toBeFalsy();
  set.deleteAll(...new Set(["goat", "hen"]));
  expect(set.size).toBe(size - 5);
});

test("deleteAll() returns true if all requested elements removed", () => {
  set = wordSet();
  expect(set.size).toBe(words.length);
  expect(set.deleteAll(...words)).toBe(true);
  expect(set.size).toBe(0);
  set.addAll("fish", "gerbil", "pigeon");
  expect(set.size).toBe(3);
  expect(set.deleteAll("gerbil", "mongoose", "pigeon")).toBe(false);
  set.addAll("fish", "gerbil", "pigeon");
  expect(set.deleteAll("mongoose", "gerbil", "pigeon")).toBe(false);
  set.addAll("fish", "gerbil", "pigeon");
  expect(set.deleteAll("gerbil", "pigeon", "mongoose")).toBe(false);
  set.addAll("fish", "gerbil", "pigeon");
  expect(set.deleteAll("mongoose")).toBe(false);
  set.addAll("fish", "gerbil", "pigeon");
  expect(set.deleteAll("gerbil", "pigeon")).toBe(true);
});
