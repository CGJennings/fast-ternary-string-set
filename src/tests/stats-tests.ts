import { TernaryStringSet } from "../index";
import { load } from "./word-list-loader";

let tree: TernaryStringSet;
const words = load("short-english");

beforeEach(() => {
  tree = new TernaryStringSet();
});

test("Stats for base cases", () => {
  expect(tree.stats).toEqual({
    depth: 0,
    nodes: 0,
    size: 0,
    surrogates: 0,
  });
  tree.add("a");
  expect(tree.stats).toEqual({
    depth: 1,
    nodes: 1,
    size: 1,
    surrogates: 0,
  });
});

test("String count matches size", () => {
  expect(tree.stats.size).toBe(tree.size);

  tree.add("");
  expect(tree.has("")).toBe(true);
  expect(tree.stats.size).toBe(tree.size);

  tree.clear();
  expect(tree.has("")).toBe(false);
  expect(tree.stats.size).toBe(tree.size);

  tree.add("kitten");
  expect(tree.has("kitten")).toBe(true);
  expect(tree.stats.size).toBe(tree.size);

  tree.addAll(["kitten", "puppy", "kid", "owlet"]);
  expect(tree.stats.size).toBe(tree.size);
});

test("Balancing reduces depth", () => {
  words.forEach((s) => tree.add(s));
  const bad = tree.stats;
  tree.clear();
  tree.addAll(words);
  const good = tree.stats;
  expect(good.size).toBe(bad.size);
  expect(good.depth).toBeLessThan(bad.depth);
});

test("Surrogate pair detection", () => {
  tree.addAll(["kitten", "linear\ud800\udc00B", "😀"]);
  const stats = tree.stats;
  expect(stats.surrogates).toBe(2);
});
