import { TernaryStringSet } from "../index";
import { wordSet, readBuffer } from "./utils";

let set: TernaryStringSet;

beforeEach(() => {
  set = new TernaryStringSet();
});

test("empty tree has header only", () => {
  expect(set.toBuffer().byteLength).toBe(8);
});

test("non-empty tree has node bytes", () => {
  set.add("a");
  // HEADER + 4 byte char + 2 byte branches (x3)
  expect(set.toBuffer().byteLength).toBe(8 + (4 + 3 * 2));
});

test("roundtrip a small set", () => {
  set.addAll(["", "apple", "ankle", "ball", "pi", "piano", "pink", "ukulele"]);
  let buff = set.toBuffer();
  let newTree = TernaryStringSet.fromBuffer(buff);
  buff = null;
  expect(newTree.size).toBe(set.size);
  expect(newTree.stats.toString()).toEqual(set.stats.toString());
  expect(newTree.equals(set)).toBeTruthy();

  set.compact();
  buff = set.toBuffer();
  newTree = TernaryStringSet.fromBuffer(buff);
  expect(newTree.equals(set)).toBeTruthy();
});

test("roundtrip a large set", () => {
  set = wordSet(false);
  let buff = set.toBuffer();
  let newTree = TernaryStringSet.fromBuffer(buff);
  buff = null;
  expect(newTree.size).toBe(set.size);
  expect(newTree.stats.toString()).toEqual(set.stats.toString());
  expect(newTree.equals(set)).toBeTruthy();

  set.compact();
  buff = set.toBuffer();
  newTree = TernaryStringSet.fromBuffer(buff);
  expect(newTree.equals(set)).toBeTruthy();
});

test("roundtrip a set with 32-bit branches", () => {
  let s: string[] = [];
  for (let cp = 0; cp < 0x10001; ++cp) {
    s[s.length] = String.fromCodePoint(cp);
  }
  set = new TernaryStringSet(s);
  s = null;

  let buff = set.toBuffer();
  const newTree = TernaryStringSet.fromBuffer(buff);
  buff = null;
  expect(newTree.size).toBe(set.size);
  expect(newTree.stats.toString()).toEqual(set.stats.toString());
  expect(newTree.equals(set)).toBeTruthy();
});

["version1", "version2int32", "version2int16", "version2compact"].forEach(
  (file) => {
    test(`restore ${file} buffer from file`, () => {
      const restored = TernaryStringSet.fromBuffer(readBuffer(file));
      expect(restored.equals(wordSet(false))).toBeTruthy();
    });
  },
);
