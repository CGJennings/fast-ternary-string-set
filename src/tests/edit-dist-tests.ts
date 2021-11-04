import { TernaryStringSet } from "../index";
import { wordSet } from "./utils";

let set: TernaryStringSet;

/** Calculates the edit distance between two strings. */
function editDist(from: string, to: string): number {
  // a standard Levenshtein distance function like
  // you'll find in any good algorithms textbook
  if (from.length == 0) return to.length;
  if (to.length == 0) return from.length;

  const v0: number[] = new Array(to.length + 1);
  const v1: number[] = new Array(to.length + 1);

  for (let i = 0; i < v0.length; i++) {
    v0[i] = i;
  }

  for (let i = 0; i < from.length; i++) {
    v1[0] = i + 1;

    for (let j = 0; j < to.length; j++) {
      const substCost = from[i] == to[j] ? 0 : 1;
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + substCost);
    }

    for (let j = 0; j < v0.length; j++) {
      v0[j] = v1[j];
    }
  }

  return v1[to.length];
}

/**
 * Verifies that `getWithinEditDist` returns the correct result by
 * checking the edit distance for every string in the set.
 */
function verify(set: TernaryStringSet, pattern: string, dist: number) {
  const result = new Set(set.getWithinEditDistanceOf(pattern, dist));
  for (const s of set) {
    const d = editDist(pattern, s);
    expect(`${s}: ${result.has(s)}`).toBe(`${s}: ${d <= dist}`);
  }
}

beforeEach(() => {
  set = new TernaryStringSet();
});

test("getWithinEditDistanceOf() bad arguments throw", () => {
  expect(() => set.getWithinEditDistanceOf(null, 0)).toThrow();
  expect(() => set.getWithinEditDistanceOf("", -1)).toThrow();
  expect(() => set.getWithinEditDistanceOf("", NaN)).toThrow();
  expect(() =>
    set.getWithinEditDistanceOf("", "1" as unknown as number),
  ).toThrow();
});

test("getWithinEditDistanceOf() empty tree has no results", () => {
  expect(set.getWithinEditDistanceOf("", 10)).toEqual([]);
  expect(set.getWithinEditDistanceOf("a", 10)).toEqual([]);
});

test("getWithinEditDistanceOf() can delete to empty string if present", () => {
  set.add("");
  expect(set.getWithinEditDistanceOf("", 0)).toEqual([""]);
  expect(set.getWithinEditDistanceOf("", 1)).toEqual([""]);
  expect(set.getWithinEditDistanceOf("", 2)).toEqual([""]);

  expect(set.getWithinEditDistanceOf("a", 0)).toEqual([]);
  expect(set.getWithinEditDistanceOf("a", 1)).toEqual([""]);
  expect(set.getWithinEditDistanceOf("a", 2)).toEqual([""]);

  expect(set.getWithinEditDistanceOf("ab", 0)).toEqual([]);
  expect(set.getWithinEditDistanceOf("ab", 1)).toEqual([]);
  expect(set.getWithinEditDistanceOf("ab", 2)).toEqual([""]);
  expect(set.getWithinEditDistanceOf("ab", 3)).toEqual([""]);

  set.delete("");
  expect(set.getWithinEditDistanceOf("", 0)).toEqual([]);
  expect(set.getWithinEditDistanceOf("", 1)).toEqual([]);
  expect(set.getWithinEditDistanceOf("", 2)).toEqual([]);

  expect(set.getWithinEditDistanceOf("a", 0)).toEqual([]);
  expect(set.getWithinEditDistanceOf("a", 1)).toEqual([]);
  expect(set.getWithinEditDistanceOf("a", 2)).toEqual([]);

  expect(set.getWithinEditDistanceOf("ab", 0)).toEqual([]);
  expect(set.getWithinEditDistanceOf("ab", 1)).toEqual([]);
  expect(set.getWithinEditDistanceOf("ab", 2)).toEqual([]);
  expect(set.getWithinEditDistanceOf("ab", 3)).toEqual([]);
});

test("getWithinEditDistanceOf() insert after end of pattern", () => {
  set.addAll(["a", "ab", "abc", "b"]);
  expect(set.getWithinEditDistanceOf("", 0)).toEqual([]);
  expect(set.getWithinEditDistanceOf("", 1)).toEqual(["a", "b"]);
  expect(set.getWithinEditDistanceOf("", 2)).toEqual(["a", "ab", "b"]);
  expect(set.getWithinEditDistanceOf("", 3)).toEqual(["a", "ab", "abc", "b"]);

  expect(set.getWithinEditDistanceOf("a", 0)).toEqual(["a"]);
  expect(set.getWithinEditDistanceOf("a", 1)).toEqual(["a", "ab", "b"]);

  set.clear();
  set.addAll(["ab", "abc", "abcd"]);
  expect(set.getWithinEditDistanceOf("a", 0)).toEqual([]);
  expect(set.getWithinEditDistanceOf("a", 1)).toEqual(["ab"]);
  expect(set.getWithinEditDistanceOf("a", 2)).toEqual(["ab", "abc"]);
  expect(set.getWithinEditDistanceOf("a", 3)).toEqual(["ab", "abc", "abcd"]);
});

test("getWithinEditDistanceOf() insert before end of pattern", () => {
  set.addAll(["a", "ab", "abc", "b"]);
  expect(set.getWithinEditDistanceOf("b", 0)).toEqual(["b"]);
  expect(set.getWithinEditDistanceOf("b", 1)).toEqual(["a", "ab", "b"]);
  expect(set.getWithinEditDistanceOf("b", 2)).toEqual(["a", "ab", "abc", "b"]);
  expect(set.getWithinEditDistanceOf("ac", 1)).toEqual(["a", "ab", "abc"]);
});

test("getWithinEditDistanceOf() single substitution", () => {
  set.addAll(["a", "b", "c", "d"]);
  expect(set.getWithinEditDistanceOf("z", 0)).toEqual([]);
  expect(set.getWithinEditDistanceOf("z", 1)).toEqual(["a", "b", "c", "d"]);
  expect(set.getWithinEditDistanceOf("z", 2)).toEqual(["a", "b", "c", "d"]);

  expect(set.getWithinEditDistanceOf("a", 0)).toEqual(["a"]);
  expect(set.getWithinEditDistanceOf("a", 1)).toEqual(["a", "b", "c", "d"]);
  expect(set.getWithinEditDistanceOf("a", 2)).toEqual(["a", "b", "c", "d"]);
});

test("getWithinEditDistanceOf() multiple substitutions", () => {
  const words = [
    "bat",
    "bit",
    "bye",
    "cap",
    "cat",
    "cog",
    "cot",
    "mat",
    "oat",
    "zip",
  ];
  set.addAll(words);
  expect(set.getWithinEditDistanceOf("cat", 0)).toEqual(["cat"]);
  expect(set.getWithinEditDistanceOf("cat", 1)).toEqual([
    "bat",
    "cap",
    "cat",
    "cot",
    "mat",
    "oat",
  ]);
  expect(set.getWithinEditDistanceOf("cat", 2)).toEqual([
    "bat",
    "bit",
    "cap",
    "cat",
    "cog",
    "cot",
    "mat",
    "oat",
  ]);
  expect(set.getWithinEditDistanceOf("cat", 3)).toEqual(words);
  expect(set.getWithinEditDistanceOf("cat", 4)).toEqual(words);
});

test("getWithinEditDistanceOf() delete from start of pattern", () => {
  set.addAll(["abc", "def", "ghi"]);
  expect(set.getWithinEditDistanceOf("aabc", 1)).toEqual(["abc"]);
  expect(set.getWithinEditDistanceOf("adef", 1)).toEqual(["def"]);
  expect(set.getWithinEditDistanceOf("aaabc", 2)).toEqual(["abc"]);
  expect(set.getWithinEditDistanceOf("aadef", 2)).toEqual(["def"]);
  expect(set.getWithinEditDistanceOf("xaabc", 2)).toEqual(["abc"]);
  expect(set.getWithinEditDistanceOf("xadef", 2)).toEqual(["def"]);
  expect(set.getWithinEditDistanceOf("azabc", 2)).toEqual(["abc"]);
  expect(set.getWithinEditDistanceOf("azdef", 2)).toEqual(["def"]);
});

test("getWithinEditDistanceOf() delete from middle of pattern", () => {
  set.addAll(["abc", "def", "ghi"]);
  expect(set.getWithinEditDistanceOf("axbc", 1)).toEqual(["abc"]);
  expect(set.getWithinEditDistanceOf("deef", 1)).toEqual(["def"]);
  expect(set.getWithinEditDistanceOf("axbc", 1)).toEqual(["abc"]);
  expect(set.getWithinEditDistanceOf("deeef", 2)).toEqual(["def"]);
  expect(set.getWithinEditDistanceOf("axxbc", 2)).toEqual(["abc"]);
  expect(set.getWithinEditDistanceOf("dxeef", 2)).toEqual(["def"]);
  expect(set.getWithinEditDistanceOf("abxbc", 2)).toEqual(["abc"]);
  expect(set.getWithinEditDistanceOf("dexef", 2)).toEqual(["def"]);
  expect(set.getWithinEditDistanceOf("abxbc", 2)).toEqual(["abc"]);
});

test("getWithinEditDistanceOf() delete from end of pattern", () => {
  set.addAll(["abc", "def", "ghi"]);
  expect(set.getWithinEditDistanceOf("abca", 1)).toEqual(["abc"]);
  expect(set.getWithinEditDistanceOf("abcc", 1)).toEqual(["abc"]);
  expect(set.getWithinEditDistanceOf("defe", 1)).toEqual(["def"]);
  expect(set.getWithinEditDistanceOf("deff", 1)).toEqual(["def"]);
  expect(set.getWithinEditDistanceOf("abcab", 2)).toEqual(["abc"]);
  expect(set.getWithinEditDistanceOf("abcbc", 2)).toEqual(["abc"]);
  expect(set.getWithinEditDistanceOf("defde", 2)).toEqual(["def"]);
  expect(set.getWithinEditDistanceOf("defef", 2)).toEqual(["def"]);
  expect(set.getWithinEditDistanceOf("abcdef", 3)).toEqual(["abc", "def"]);
});

function wordListTest(pattern: string, dist: number) {
  test(`getWithinEditDistanceOf() word list with pattern "${pattern}", distance ${dist}`, () => {
    set = wordSet(false);
    verify(set, pattern, dist);
  });
}

wordListTest("aardva", 3);
wordListTest("ae", 4);
wordListTest("e", 24);
wordListTest("eeeeeeeeeeee", 24);
wordListTest("ea", 2);
wordListTest("ing", 5);
wordListTest("orl", 1);
wordListTest("orl", 2);
wordListTest("pie", 2);
wordListTest("restaurant", 0);
wordListTest("estaurant", 1);
wordListTest("resturant", 1);
wordListTest("restauran", 1);
wordListTest("xrestaurant", 1);
wordListTest("restxaurant", 1);
wordListTest("resttaurant", 1);
wordListTest("restaurantx", 1);
wordListTest("restxaurant", 11);
wordListTest("rn", 3);
wordListTest("wi", 2);
wordListTest("world", 1);
wordListTest("zzz", 2);
wordListTest("", 1);
wordListTest("", 2);
wordListTest("", 3);
wordListTest("", 24);

test("getWithinEditDistanceOf() base 4 number strings", () => {
  let base4list = [];
  for (let i = 0; i < 4 ** 4; ++i) {
    base4list[base4list.length] = i.toString(4);
  }
  const base4 = new TernaryStringSet(base4list);
  base4list = null;

  verify(base4, "", 0);
  verify(base4, "", 1);
  verify(base4, "", 2);
  verify(base4, "", 3);
  verify(base4, "", 4);

  verify(base4, "3", 0);
  verify(base4, "3", 1);
  verify(base4, "3", 2);
  verify(base4, "3", 3);
  verify(base4, "3", 4);

  verify(base4, "32", 0);
  verify(base4, "32", 1);
  verify(base4, "32", 2);
  verify(base4, "32", 3);
  verify(base4, "32", 4);

  verify(base4, "321", 0);
  verify(base4, "321", 1);
  verify(base4, "321", 2);
  verify(base4, "321", 3);
  verify(base4, "321", 4);

  verify(base4, "3210", 0);
  verify(base4, "3210", 1);
  verify(base4, "3210", 2);
  verify(base4, "3210", 3);
  verify(base4, "3210", 4);
  verify(base4, "3210", 5);
  verify(base4, "3210", 6);
  verify(base4, "3210", 7);
  verify(base4, "3210", 8);
});
