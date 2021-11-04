import { TernaryStringSet, TernaryTreeStats } from "../index";

let set: TernaryStringSet;
let st: TernaryTreeStats;

beforeEach(() => {
  set = new TernaryStringSet();
  st = null;
});

test("stats for empty set", () => {
  // trivial stats for empty set
  st = set.stats;
  expect(st.size).toBe(0);
  expect(st.nodes).toBe(0);
  expect(st.depth).toBe(0);
  expect(st.breadth).toEqual([]);
  expect(st.minCodePoint).toBe(0);
  expect(st.maxCodePoint).toBe(0);
  expect(st.surrogates).toBe(0);
});

test("stats for empty string", () => {
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
});

test("stats for singleton length 1 string", () => {
  // adding B adds a single root node
  set.add("B");
  st = set.stats;
  expect(st.size).toBe(1);
  expect(st.nodes).toBe(1);
  expect(st.depth).toBe(1);
  expect(st.breadth).toEqual([1]);
  expect(st.minCodePoint).toBe(66);
  expect(st.maxCodePoint).toBe(66);
  expect(st.surrogates).toBe(0);
});

test("stats for tree with single left child", () => {
  // the A will be the left child of root B
  set.add("B");
  set.add("A");
  st = set.stats;
  expect(st.size).toBe(2);
  expect(st.nodes).toBe(2);
  expect(st.depth).toBe(2);
  expect(st.breadth).toEqual([1, 1]);
  expect(st.minCodePoint).toBe(65);
  expect(st.maxCodePoint).toBe(66);
  expect(st.surrogates).toBe(0);
});

test("stats for tree with less than/greater than children", () => {
  // the C will be the right child of root B
  set.add("B");
  set.add("A");
  set.add("C");
  st = set.stats;
  expect(st.size).toBe(3);
  expect(st.nodes).toBe(3);
  expect(st.depth).toBe(2);
  expect(st.breadth).toEqual([1, 2]);
  expect(st.minCodePoint).toBe(65);
  expect(st.maxCodePoint).toBe(67);
  expect(st.surrogates).toBe(0);
});

test("stats for three-level tree", () => {
  // the D will be the right child of C
  set.add("B");
  set.add("A");
  set.add("C");
  set.add("D");
  st = set.stats;
  expect(st.size).toBe(4);
  expect(st.nodes).toBe(4);
  expect(st.depth).toBe(3);
  expect(st.breadth).toEqual([1, 2, 1]);
  expect(st.minCodePoint).toBe(65);
  expect(st.maxCodePoint).toBe(68);
  expect(st.surrogates).toBe(0);
});

test("stats for deleted word indicate note remains", () => {
  // deleting C removes the end-of-string flag but does not
  // remove any nodes
  set.add("B");
  set.add("A");
  set.add("C");
  set.add("D");  
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
});

test("stats for singleton must have one node per letter", () => {
  // a set with exactly one string must have a node for each letter
  // all following the equals branches
  set.add("blisters");
  st = set.stats;
  expect(st.size).toBe(1);
  expect(st.nodes).toBe(8);
  expect(st.depth).toBe(8);
  expect(st.breadth).toEqual([1, 1, 1, 1, 1, 1, 1, 1]);
});

test("stats surrogate pair detection", () => {
  set.addAll(["kitten", "linear\ud800\udc00B", "😀"]);
  st = set.stats;
  expect(st.surrogates).toBe(2);
});
