import { TernaryStringSet } from "../index";
import { load } from "./word-list-loader";

let tree: TernaryStringSet;
const words = load("short-english");

beforeEach(() => {
  tree = new TernaryStringSet();
});

test("arrangements do not allow reuse or use of characters not present", () => {
  tree.addAll([
    "apple",
    "bag",
    "ice",
    "iced",
    "icicle",
    "ire",
    "mice",
    "nice",
    "niece",
    "rein",
    "rice",
    "spice",
  ]);
  expect(tree.getArrangementsOf("nicer")).toEqual([
    "ice",
    "ire",
    "nice",
    "rein",
    "rice",
  ]);
});

test("arrangements allow use of characters as many times as they are specified", () => {
  tree.addAll([
    "aah",
    "aardvark",
    "bar",
    "bazaar",
    "dark",
    "a",
    "aa",
    "aaa",
    "baa",
  ]);
  expect(tree.getArrangementsOf("ardvark")).toEqual(["a", "aa", "dark"]);
  expect(tree.getArrangementsOf("aardvark")).toEqual([
    "a",
    "aa",
    "aaa",
    "aardvark",
    "dark",
  ]);
  expect(tree.getArrangementsOf("")).toEqual([]);
  expect(tree.getArrangementsOf("a")).toEqual(["a"]);
  expect(tree.getArrangementsOf("aa")).toEqual(["a", "aa"]);
  expect(tree.getArrangementsOf("aaa")).toEqual(["a", "aa", "aaa"]);
  expect(tree.getArrangementsOf("aaaa")).toEqual(["a", "aa", "aaa"]);
});

test("arrangements include empty string if present", () => {
  tree.addAll(["a", "b", "c"]);
  expect(tree.getArrangementsOf("")).toEqual([]);
  tree.add("");
  expect(tree.getArrangementsOf("")).toEqual([""]);
});

test("basic partial matches test", () => {
  const elements = ["a", "aa", "aaa", "aab", "aaaa", "aaaaa", "aaaab", "aaaac"];
  tree.addAll(elements);
  expect(tree.getPartialMatchesOf("?", "?")).toEqual(["a"]);
  expect(tree.getPartialMatchesOf("")).toEqual([]);
  expect(tree.getPartialMatchesOf("a.")).toEqual(["aa"]);
  expect(tree.getPartialMatchesOf("a..")).toEqual(["aaa", "aab"]);
  expect(tree.getPartialMatchesOf("aa.")).toEqual(["aaa", "aab"]);
  expect(tree.getPartialMatchesOf("...")).toEqual(["aaa", "aab"]);
  expect(tree.getPartialMatchesOf(".aa")).toEqual(["aaa"]);
  expect(tree.getPartialMatchesOf(".ab")).toEqual(["aab"]);
  expect(tree.getPartialMatchesOf("..a")).toEqual(["aaa"]);
  expect(tree.getPartialMatchesOf("..b")).toEqual(["aab"]);
  expect(tree.getPartialMatchesOf(".a.")).toEqual(["aaa", "aab"]);
  expect(tree.getPartialMatchesOf(".....")).toEqual([
    "aaaaa",
    "aaaab",
    "aaaac",
  ]);
  expect(tree.getPartialMatchesOf("aaaa.")).toEqual([
    "aaaaa",
    "aaaab",
    "aaaac",
  ]);
  // strings with no don't care can only match their exact string
  for(const el of elements) {
    expect(tree.getPartialMatchesOf(el)).toEqual([el]);
  }
  expect(tree.getPartialMatchesOf("Z")).toEqual([]);
});

test("partial matches against real word list", () => {
  tree.addAll(words);
  expect(tree.getPartialMatchesOf(".")).toEqual(["I", "a"]);
  expect(tree.getPartialMatchesOf(".e.n")).toEqual(["bean", "mean"]);
  expect(tree.getPartialMatchesOf("........e")).toEqual([
    "chocolate",
    "expensive",
    "furniture",
    "introduce",
    "structure",
    "substance",
    "telephone",
    "therefore",
    "vegetable",
    "xylophone",
  ]);
  expect(tree.getPartialMatchesOf("j...")).toEqual(["join", "jump", "just"]);
  expect(tree.getPartialMatchesOf(".u..e")).toEqual(["juice", "quite"]);
  expect(tree.getPartialMatchesOf("public")).toEqual(["public"]);
  expect(tree.getPartialMatchesOf(".a.")).toEqual([
    "bad",
    "bag",
    "can",
    "cap",
    "car",
    "cat",
    "day",
    "ear",
    "eat",
    "far",
    "hat",
    "man",
    "map",
    "may",
    "pan",
    "pay",
    "sad",
    "say",
    "was",
    "way",
  ]);
  expect(tree.getPartialMatchesOf("...........")).toEqual([
    "comfortable",
    "examination",
    "grandfather",
    "grandmother",
  ]);
});

test("partial matches empty string handling", () => {
  tree.addAll(["", "a", "b"]);
  expect(tree.getPartialMatchesOf("")).toEqual([""]);
  expect(tree.getPartialMatchesOf(".")).toEqual(["a", "b"]);
  expect(tree.getPartialMatchesOf("a")).toEqual(["a"]);
  expect(tree.getPartialMatchesOf("b")).toEqual(["b"]);
});

test("Hamming dist 0 is exact match", () => {
  tree.addAll(["a", "aa", "aaa", "aaaa", "aac", "abc", "xyz"]);
  expect(tree.getWithinHammingDistanceOf("abc", 0)).toEqual(["abc"]);
  expect(tree.getWithinHammingDistanceOf("abz", 0)).toEqual([]);
  expect(tree.getWithinHammingDistanceOf("azz", 0)).toEqual([]);
  expect(tree.getWithinHammingDistanceOf("zzz", 0)).toEqual([]);
});

test("Hamming dist >= n matches all strings with pattern's length", () => {
  tree.addAll(["a", "aa", "aaa", "aaaa", "aac", "abc", "xyz"]);
  expect(tree.getWithinHammingDistanceOf("abc", 3)).toEqual([
    "aaa",
    "aac",
    "abc",
    "xyz",
  ]);
  expect(tree.getWithinHammingDistanceOf("abc", 4)).toEqual([
    "aaa",
    "aac",
    "abc",
    "xyz",
  ]);
});

test("Hamming dist 1..n-1 matches strings <= dist", () => {
  tree.addAll(["a", "aa", "aaa", "aaaa", "aac", "abc", "xyz"]);
  expect(tree.getWithinHammingDistanceOf("abc", 1)).toEqual(["aac", "abc"]);
  expect(tree.getWithinHammingDistanceOf("abc", 2)).toEqual([
    "aaa",
    "aac",
    "abc",
  ]);
});

test("Hamming dist for cats", () => {
  tree.addAll(words);
  expect(tree.getWithinHammingDistanceOf("cat", 0)).toEqual(["cat"]);
  expect(tree.getWithinHammingDistanceOf("cat", 1)).toEqual(
    words.filter((s) => /^.at$/.test(s) || /^c.t$/.test(s) || /^ca.$/.test(s)),
  );
  expect(tree.getWithinHammingDistanceOf("cat", 2)).toEqual(
    words.filter((s) => /^..t$/.test(s) || /^c..$/.test(s) || /^.a.$/.test(s)),
  );
  expect(tree.getWithinHammingDistanceOf("cat", 3)).toEqual(
    words.filter((s) => s.length == 3),
  );
});

test("Hamming dist empty string handling", () => {
  tree.addAll(["", "a", "b"]);
  expect(tree.getWithinHammingDistanceOf("", 0)).toEqual([""]);
  expect(tree.getWithinHammingDistanceOf("", 1)).toEqual([""]);
  tree.delete("");
  expect(tree.getWithinHammingDistanceOf("", 0)).toEqual([]);
});
