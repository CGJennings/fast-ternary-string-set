import { TernaryStringSet } from "../fast-ternary-string-set";
import { words } from "./utils";

let set: TernaryStringSet;

beforeEach(() => {
  set = new TernaryStringSet();
});

test("balance() improves bad tree structure", () => {
  // add words in worst possible order
  for (const s of words) {
    set.add(s);
  }
  const badStats = set.stats;
  set.balance();
  const goodStats = set.stats;
  expect(Array.from(set)).toEqual(words);
  expect(badStats.depth).toBeGreaterThan(goodStats.depth);
  expect(set.has("")).toBe(false);
});

test("balance() preserves contents", () => {
  const words = [
    "",
    "a",
    "ape",
    "aphid",
    "aphids",
    "bee",
    "bees",
    "cat",
    "cats",
  ];
  // add words in worst possible order
  for (const s of words) {
    set.add(s);
  }
  set.balance();
  expect(set.toArray()).toEqual(words);
});

test("balance() of empty tree is safe", () => {
  expect(() => set.balance()).not.toThrow();
  expect(set.size).toBe(0);
  set.add("");
  expect(() => set.balance()).not.toThrow();
  expect(set.size).toBe(1);
});
