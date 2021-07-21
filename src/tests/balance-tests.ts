import { TernaryStringSet } from "../index";
import { load } from "./word-list-loader";

let tree: TernaryStringSet;
const words = load("short-english");

beforeEach(() => {
  tree = new TernaryStringSet();
});

test("balanced tree is better constructed", () => {
  // add words in worst possible order
  for (const s of words) {
    tree.add(s);
  }
  const badStats = tree.stats;
  tree.balance();
  const goodStats = tree.stats;
  expect(Array.from(tree)).toEqual(words);
  expect(badStats.depth).toBeGreaterThan(goodStats.depth);
  expect(tree.has("")).toBe(false);
});

test("empty string is preserved after balancing", () => {
  // add words in worst possible order
  for (const s of words) {
    tree.add(s);
  }
  tree.add("");
  tree.balance();
  expect(tree.has("")).toBe(true);
});
