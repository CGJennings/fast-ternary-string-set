import { TernaryStringSet } from "../index";
import { words, wordSet } from "./word-list-loader";

const compactWords = wordSet();
compactWords.compact();

let set: TernaryStringSet;

beforeEach(() => {
  set = new TernaryStringSet();
});

test("Trivial compaction", () => {
  // compacting an empty set or set with only "" has no effect
  // since these sets have no tree
  set.compact();
  expect(set.stats.nodes).toBe(0);
  set.add("");
  set.compact();
  expect(set.stats.nodes).toBe(0);
  expect(set.has("")).toBeTruthy();

  // for compaction to have an effect, there must be
  // strings with common suffixes
  set.clear();
  set.add("A");
  set.compact();
  expect(set.stats.nodes).toBe(1);
  expect(set.has("A")).toBeTruthy();
  set.add("B");
  set.compact();
  expect(set.stats.nodes).toBe(2);
  expect(set.has("A")).toBeTruthy();
  expect(set.has("B")).toBeTruthy();
});

test("Basic suffix sharing", () => {
  // here we add strings with a common suffix "-ing"
  // but different prefixes; in the original tree
  // each string will have its own subtree for its "ing"
  // but in the compacted tree they will share one subtree
  set.clear();
  set.addAll(["abcing", "defing", "ghiing", "jkling", "mnoing"]);
  const preCompactSize = set.stats.nodes;
  set.compact();
  expect(preCompactSize - set.stats.nodes).toBe(3 * (set.size - 1));
});

test("Non-trivial suffix sharing", () => {
  // a more complex example than the basic test;
  // in this case each string has a unique prefix "a"-"d",
  // all have a common suffix "ing", but two share the
  // suffix "_aing" and two share the suffix "_bing".
  // Before compaction there is a node for each letter of
  // each string (6 chars * 4 strings) since there are no
  // shared prefixes. After compaction we expect a node
  // each for the prefixes, three nodes for the shared
  // "ing", two nodes for the shared "_a", and two for "_b"
  // (4 + 3 + 2 + 2)
  // three nodes for the common "ing",
  const words = ["a_aing", "b_aing", "c_bing", "d_bing"];
  set.addAll(words);
  expect(set.stats.nodes).toBe(24);
  set.compact();
  expect(set.stats.nodes).toBe(11);

  // if we add "e_ai", this will add 4 nodes since the prefix
  // e is unique and _ai was previously an infix, not a suffix!
  set.add("e_ai");
  set.compact();
  expect(set.stats.nodes).toBe(15);

  // whereas if we add "fng", only one 1 more node is needed
  // (for the "f"); since the suffix "ng" is part of the
  // existing "ing" subtree.
  set.add("fng");
  set.compact();
  expect(set.stats.nodes).toBe(16);
});

test("Dictionary compaction", () => {
  set = compactWords;
  expect(set.size).toBe(words.length);
  // non-trivial compacted set should have fewer nodes...
  // (in fact for our word list it is less than half as many nodes)
  expect(set.stats.nodes).toBeLessThan(wordSet(false).stats.nodes);
  // ...but all the same words
  for (const s of words) {
    expect(set.has(s)).toBeTruthy();
  }
});

test("Decompaction", () => {
  // attempting to mutate a compact set must leave it uncompacted
  const compactOriginal = set;
  compactOriginal.addAll([
    "apple",
    "baby",
    "cart",
    "dart",
    "ear",
    "flustering",
  ]);
  compactOriginal.compact();
  expect(compactOriginal.stats.compact).toBeTruthy();

  // copying a compact set yields a compact copy
  set = new TernaryStringSet(compactOriginal);
  expect(set.stats.compact).toBeTruthy();

  // adding a string already in the set has no effect
  set.add("apple");
  expect(set.stats.compact).toBeTruthy();
  // adding a string not in the set undoes compaction
  set.add("carts");
  expect(set.stats.compact).toBeFalsy();
  // as does adding via addAll
  set = new TernaryStringSet(compactOriginal);
  set.addAll(["carts"]);
  expect(set.stats.compact).toBeFalsy();

  // likewise, deleting a string not in the set has no effect
  // while actually deleting a string undoes compaction
  set = new TernaryStringSet(compactOriginal);
  set.delete("zzzzz");
  expect(set.stats.compact).toBeTruthy();
  set.delete("apple");
  expect(set.stats.compact).toBeFalsy();

  // balance() undoes compaction
  set = new TernaryStringSet(compactOriginal);
  set.balance();
  expect(set.stats.compact).toBeFalsy();

  // clear() trivially resets the compaction state
  set = new TernaryStringSet(compactOriginal);
  set.clear();
  expect(set.stats.compact).toBeFalsy();
});

test("Non-mutating methods do not decompact", () => {
  const rhs = new TernaryStringSet(["list", "wrestle"]);
  set = compactWords;
  set.entries();
  set.equals(rhs);
  set.forEach((s) => s);
  set.getArrangementsOf("coat");
  set.getCompletionsOf("win");
  set.getPartialMatchesOf("cu.");
  set.getWithinHammingDistanceOf("cat", 1);
  set.has("cat");
  set.isSubsetOf(rhs);
  set.isSupersetOf(rhs);
  set.keys();
  set.size;
  set.values();
  expect(set.stats.compact).toBeTruthy();
});

test("Operation results are never compacted", () => {
  const compactOriginal = set;
  compactOriginal.addAll([
    "apple",
    "baby",
    "cart",
    "dart",
    "ear",
    "flustering",
  ]);
  compactOriginal.compact();

  set = new TernaryStringSet(["ear", "guest"]);
  expect(compactOriginal.union(set).stats.compact).toBeFalsy();
  expect(set.union(compactOriginal).stats.compact).toBeFalsy();
  expect(compactOriginal.intersection(set).stats.compact).toBeFalsy();
  expect(set.intersection(compactOriginal).stats.compact).toBeFalsy();
  expect(compactOriginal.subtract(set).stats.compact).toBeFalsy();
  expect(set.subtract(compactOriginal).stats.compact).toBeFalsy();
  expect(compactOriginal.symmetricDifference(set).stats.compact).toBeFalsy();
  expect(set.symmetricDifference(compactOriginal).stats.compact).toBeFalsy();
});
