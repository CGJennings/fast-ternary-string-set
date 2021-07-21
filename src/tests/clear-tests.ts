import { TernaryStringSet } from "../index";

let tree: TernaryStringSet;

beforeEach(() => {
  tree = new TernaryStringSet();
});

test("Clear empty tree", () => {
  expect(tree.size).toBe(0);
  expect(() => tree.clear()).not.toThrow();
  expect(tree.size).toBe(0);
});

test("Clear non-empty tree", () => {
  tree.addAll(["chicken", "duck", "whale"]);
  expect(tree.size).toBe(3);
  tree.clear();
  expect(tree.size).toBe(0);
});
