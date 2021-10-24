import { TernaryStringSet } from "../index";
import { wordSet } from "./utils";

let set: TernaryStringSet;

/** Calculates the edit distance between two strings. */
function editDist(from: string, to: string): number {
  // a standard Levenshtein distance implementation
  // like you'll find in any good text on algorithms
  if (from.length === 0) {
    return to.length;
  }
  if (to.length === 0) {
    return from.length;
  }
  const matrix = Array(to.length + 1)
    .fill(0)
    .map(() => Array(from.length + 1).fill(0));
  for (let i = 0; i <= from.length; i += 1) {
    matrix[0][i] = i;
  }
  for (let j = 0; j <= to.length; j += 1) {
    matrix[j][0] = j;
  }
  for (let j = 1; j <= to.length; j += 1) {
    for (let i = 1; i <= from.length; i += 1) {
      const substCost = from[i - 1] === to[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        // deletion
        matrix[j][i - 1] + 1,
        // insertion
        matrix[j - 1][i] + 1,
        // substitution
        matrix[j - 1][i - 1] + substCost,
      );
    }
  }
  return matrix[to.length][from.length];
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

test("Empty tree has no results", () => {
  expect(set.getWithinEditDistanceOf("", 10)).toEqual([]);
  expect(set.getWithinEditDistanceOf("a", 10)).toEqual([]);
});

test("Can delete to empty string if present", () => {
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

test("Insert after end of pattern", () => {
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

test("Insert before end of pattern", () => {
  set.addAll(["a", "ab", "abc", "b"]);
  expect(set.getWithinEditDistanceOf("b", 0)).toEqual(["b"]);
  expect(set.getWithinEditDistanceOf("b", 1)).toEqual(["a", "ab", "b"]);
  expect(set.getWithinEditDistanceOf("b", 2)).toEqual(["a", "ab", "abc", "b"]);
  expect(set.getWithinEditDistanceOf("ac", 1)).toEqual(["a", "ab", "abc"]);
});

test("Single substitution", () => {
  set.addAll(["a", "b", "c", "d"]);
  expect(set.getWithinEditDistanceOf("z", 0)).toEqual([]);
  expect(set.getWithinEditDistanceOf("z", 1)).toEqual(["a", "b", "c", "d"]);
  expect(set.getWithinEditDistanceOf("z", 2)).toEqual(["a", "b", "c", "d"]);

  expect(set.getWithinEditDistanceOf("a", 0)).toEqual(["a"]);
  expect(set.getWithinEditDistanceOf("a", 1)).toEqual(["a", "b", "c", "d"]);
  expect(set.getWithinEditDistanceOf("a", 2)).toEqual(["a", "b", "c", "d"]);
});

test("Multiple substitutions", () => {
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

test("Delete from start of pattern", () => {
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

test("Delete from middle of pattern", () => {
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

test("Delete from end of pattern", () => {
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
  test(`Word list with pattern "${pattern}", distance ${dist}`, () => {
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

test("Base 4 number strings", () => {
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