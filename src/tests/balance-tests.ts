import { TernaryStringSet } from "../index";
import { words } from "./utils";

let set: TernaryStringSet;

beforeEach(() => {
  set = new TernaryStringSet();
});

test("balanced tree is better constructed", () => {
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

test("contents preserved after balancing", () => {
  const words = [
    "",
    "a",
    "ape",
    "apple",
    "apples",
    "bee",
    "bees",
    "car",
    "cars",
  ];
  // add words in worst possible order
  for (const s of words) {
    set.add(s);
  }
  set.balance();
  expect(set.toArray()).toEqual(words);
});

test("balancing empty tree is safe", () => {
  expect(() => set.balance()).not.toThrow();
  expect(set.size).toBe(0);
  set.add("");
  expect(() => set.balance()).not.toThrow();
  expect(set.size).toBe(1);
});
