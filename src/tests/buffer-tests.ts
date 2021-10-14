import { TernaryStringSet } from "../index";
import { wordSet } from "./word-list-loader";

let set: TernaryStringSet;

beforeEach(() => {
  set = new TernaryStringSet();
});

test("empty tree has header only", () => {
  expect(set.toBuffer().byteLength).toBe(8);
});

test("non-empty tree has node bytes", () => {
  set.add("a");
  expect(set.toBuffer().byteLength).toBe(8 + 4 * 4);
});

test("roundtrip a small set", () => {
  set.addAll(["", "apple", "ankle", "ball", "pi", "piano", "pink", "ukulele"]);
  let buff = set.toBuffer();
  const newTree = TernaryStringSet.fromBuffer(buff);
  buff = null;
  expect(newTree.size).toBe(set.size);
  expect(newTree.stats).toEqual(set.stats);
  for (const s of set) {
    expect(newTree.has(s)).toBe(true);
  }
});

test("roundtrip a large set", () => {
  set = wordSet(false);
  let buff = set.toBuffer();
  const newTree = TernaryStringSet.fromBuffer(buff);
  buff = null;
  expect(newTree.size).toBe(set.size);
  expect(newTree.stats).toEqual(set.stats);
  for (const s of set) {
    expect(newTree.has(s)).toBe(true);
  }
});
