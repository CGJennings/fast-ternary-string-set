import { TernaryStringSet } from "../index";
import { load } from "./word-list-loader";

let set: TernaryStringSet;
const words = load("short-english");

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

test("empty string is preserved after balancing", () => {
  // add words in worst possible order
  for (const s of words) {
    set.add(s);
  }
  set.add("");
  set.balance();
  expect(set.has("")).toBe(true);
});
