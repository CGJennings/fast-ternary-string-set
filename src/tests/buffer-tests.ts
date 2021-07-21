import { TernaryStringSet } from "../index";
import { load } from "./word-list-loader";

let tree: TernaryStringSet;
const words = load("short-english");

beforeEach(() => {
  tree = new TernaryStringSet();
});

test("empty tree has header only", () => {
  expect(tree.toBuffer().byteLength).toBe(8);
});

test("non-empty tree has node bytes", () => {
  tree.add("a");
  expect(tree.toBuffer().byteLength).toBe(8 + 4 * 4);
});

test("roundtrip a small set", () => {
  tree.addAll(["", "apple", "ankle", "ball", "pi", "piano", "pink", "ukulele"]);
  let buff = tree.toBuffer();
  const newTree = TernaryStringSet.fromBuffer(buff);
  buff = null;
  expect(newTree.size).toBe(tree.size);
  expect(newTree.stats).toEqual(tree.stats);
  for (const s of tree) {
    expect(newTree.has(s)).toBe(true);
  }
});

test("roundtrip a large set", () => {
  tree.addAll(words);
  let buff = tree.toBuffer();
  const newTree = TernaryStringSet.fromBuffer(buff);
  buff = null;
  expect(newTree.size).toBe(tree.size);
  expect(newTree.stats).toEqual(tree.stats);
  for (const s of tree) {
    expect(newTree.has(s)).toBe(true);
  }
});
