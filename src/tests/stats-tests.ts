import { TernaryStringSet, TernaryTreeStats } from "../index";

let set: TernaryStringSet;
let st: TernaryTreeStats;

beforeEach(() => {
  set = new TernaryStringSet();
  st = null;
});

test("stats for base cases", () => {
  // trivial stats for empty set
  st = set.stats;
  expect(st.size).toBe(0);
  expect(st.nodes).toBe(0);
  expect(st.depth).toBe(0);
  expect(st.breadth).toEqual([]);
  expect(st.minCodePoint).toBe(0);
  expect(st.maxCodePoint).toBe(0);
  expect(st.surrogates).toBe(0);

  // empty string increments size but adds no nodes
  set.add("");
  st = set.stats;
  expect(st.size).toBe(1);
  expect(st.nodes).toBe(0);
  expect(st.depth).toBe(0);
  expect(st.breadth).toEqual([]);
  expect(st.minCodePoint).toBe(0);
  expect(st.maxCodePoint).toBe(0);
  expect(st.surrogates).toBe(0);

  // adding B adds a single root node
  set.delete("");
  set.add("B");
  st = set.stats;
  expect(st.size).toBe(1);
  expect(st.nodes).toBe(1);
  expect(st.depth).toBe(1);
  expect(st.breadth).toEqual([1]);
  expect(st.minCodePoint).toBe(66);
  expect(st.maxCodePoint).toBe(66);
  expect(st.surrogates).toBe(0);

  // the A will be the left child of root B
  set.add("A");
  st = set.stats;
  expect(st.size).toBe(2);
  expect(st.nodes).toBe(2);
  expect(st.depth).toBe(2);
  expect(st.breadth).toEqual([1, 1]);
  expect(st.minCodePoint).toBe(65);
  expect(st.maxCodePoint).toBe(66);
  expect(st.surrogates).toBe(0);

  // the C will be the right child of root B
  set.add("C");
  st = set.stats;
  expect(st.size).toBe(3);
  expect(st.nodes).toBe(3);
  expect(st.depth).toBe(2);
  expect(st.breadth).toEqual([1, 2]);
  expect(st.minCodePoint).toBe(65);
  expect(st.maxCodePoint).toBe(67);
  expect(st.surrogates).toBe(0);

  // the D will be the right child of C
  set.add("D");
  st = set.stats;
  expect(st.size).toBe(4);
  expect(st.nodes).toBe(4);
  expect(st.depth).toBe(3);
  expect(st.breadth).toEqual([1, 2, 1]);
  expect(st.minCodePoint).toBe(65);
  expect(st.maxCodePoint).toBe(68);
  expect(st.surrogates).toBe(0);

  // deleting C removes the end-of-string flag but does not
  // remove any nodes
  set.delete("C");
  st = set.stats;
  expect(st.size).toBe(3);
  expect(st.nodes).toBe(4);
  expect(st.depth).toBe(3);
  expect(st.breadth).toEqual([1, 2, 1]);
  expect(st.minCodePoint).toBe(65);
  expect(st.maxCodePoint).toBe(68);
  expect(st.surrogates).toBe(0);

  // likewise deleting D
  set.delete("D");
  st = set.stats;
  expect(st.size).toBe(2);
  expect(st.nodes).toBe(4);
  expect(st.depth).toBe(3);
  expect(st.breadth).toEqual([1, 2, 1]);
  expect(st.minCodePoint).toBe(65);
  expect(st.maxCodePoint).toBe(68);
  expect(st.surrogates).toBe(0);

  // after balancing it should be exactly as it was after
  // adding just B and A since they were added in ideal order;
  // the unused C and D nodes are now gone
  set.balance();
  st = set.stats;
  expect(st.size).toBe(2);
  expect(st.nodes).toBe(2);
  expect(st.depth).toBe(2);
  expect(st.breadth).toEqual([1, 1]);
  expect(st.minCodePoint).toBe(65);
  expect(st.maxCodePoint).toBe(66);
  expect(st.surrogates).toBe(0);

  // a set with exactly one word must have a node for each letter
  // all following the equals branches
  set.clear();
  set.add("blisters");
  st = set.stats;
  expect(st.size).toBe(1);
  expect(st.nodes).toBe(8);
  expect(st.depth).toBe(8);
  expect(st.breadth).toEqual([1, 1, 1, 1, 1, 1, 1, 1]);
});

test("surrogate pair detection", () => {
  set.addAll(["kitten", "linear\ud800\udc00B", "😀"]);
  st = set.stats;
  expect(st.surrogates).toBe(2);
});
