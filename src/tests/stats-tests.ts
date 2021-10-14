import { TernaryStringSet } from "../index";

let set: TernaryStringSet;

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

// effects of balancing on stats are tested in balance-tests.ts

test("surrogate pair detection", () => {
  set.addAll(["kitten", "linear\ud800\udc00B", "😀"]);
  const stats = set.stats;
  expect(stats.surrogates).toBe(2);
});
