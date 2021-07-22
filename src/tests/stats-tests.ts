import { TernaryStringSet } from "../index";
import { load } from "./word-list-loader";

let set: TernaryStringSet;
const words = load("short-english");

beforeEach(() => {
  set = new TernaryStringSet();
});

test("stats for base cases", () => {
  expect(set.stats).toEqual({
    depth: 0,
    nodes: 0,
    size: 0,
    surrogates: 0,
  });
  set.add("");
  expect(set.stats).toEqual({
    depth: 0,
    nodes: 0,
    size: 1,
    surrogates: 0,
  });
  set.clear();  
  set.add("a");
  expect(set.stats).toEqual({
    depth: 1,
    nodes: 1,
    size: 1,
    surrogates: 0,
  });
});

test("string count matches size", () => {
  expect(set.stats.size).toBe(set.size);

  set.add("");
  expect(set.has("")).toBe(true);
  expect(set.stats.size).toBe(set.size);

  set.clear();
  expect(set.has("")).toBe(false);
  expect(set.stats.size).toBe(set.size);

  set.add("kitten");
  expect(set.has("kitten")).toBe(true);
  expect(set.stats.size).toBe(set.size);

  set.addAll(["kitten", "puppy", "kid", "owlet"]);
  expect(set.stats.size).toBe(set.size);
});

test("balancing reduces depth", () => {
  words.forEach((s) => set.add(s));
  const bad = set.stats;
  set.clear();
  set.addAll(words);
  const good = set.stats;
  expect(good.size).toBe(bad.size);
  expect(good.depth).toBeLessThan(bad.depth);
});

test("surrogate pair detection", () => {
  set.addAll(["kitten", "linear\ud800\udc00B", "😀"]);
  const stats = set.stats;
  expect(stats.surrogates).toBe(2);
});
