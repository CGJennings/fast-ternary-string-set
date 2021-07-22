import { TernaryStringSet } from "../index";
import { load } from "./word-list-loader";

let set: TernaryStringSet;
const words = load("short-english");

beforeEach(() => {
  set = new TernaryStringSet();
});

test("arrangements do not allow reuse or use of characters not present", () => {
  set.addAll([
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
  expect(set.getArrangementsOf("nicer")).toEqual([
    "ice",
    "ire",
    "nice",
    "rein",
    "rice",
  ]);
});

test("arrangements allow use of characters as many times as they are specified", () => {
  set.addAll([
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
  expect(set.getArrangementsOf("ardvark")).toEqual(["a", "aa", "dark"]);
  expect(set.getArrangementsOf("aardvark")).toEqual([
    "a",
    "aa",
    "aaa",
    "aardvark",
    "dark",
  ]);
  expect(set.getArrangementsOf("")).toEqual([]);
  expect(set.getArrangementsOf("a")).toEqual(["a"]);
  expect(set.getArrangementsOf("aa")).toEqual(["a", "aa"]);
  expect(set.getArrangementsOf("aaa")).toEqual(["a", "aa", "aaa"]);
  expect(set.getArrangementsOf("aaaa")).toEqual(["a", "aa", "aaa"]);
});

test("arrangements include empty string if present", () => {
  set.addAll(["a", "b", "c"]);
  expect(set.getArrangementsOf("")).toEqual([]);
  set.add("");
  expect(set.getArrangementsOf("")).toEqual([""]);
});

test("basic partial matches test", () => {
  const elements = ["a", "aa", "aaa", "aab", "aaaa", "aaaaa", "aaaab", "aaaac"];
  set.addAll(elements);
  expect(set.getPartialMatchesOf("?", "?")).toEqual(["a"]);
  expect(set.getPartialMatchesOf("")).toEqual([]);
  expect(set.getPartialMatchesOf("a.")).toEqual(["aa"]);
  expect(set.getPartialMatchesOf("a..")).toEqual(["aaa", "aab"]);
  expect(set.getPartialMatchesOf("aa.")).toEqual(["aaa", "aab"]);
  expect(set.getPartialMatchesOf("...")).toEqual(["aaa", "aab"]);
  expect(set.getPartialMatchesOf(".aa")).toEqual(["aaa"]);
  expect(set.getPartialMatchesOf(".ab")).toEqual(["aab"]);
  expect(set.getPartialMatchesOf("..a")).toEqual(["aaa"]);
  expect(set.getPartialMatchesOf("..b")).toEqual(["aab"]);
  expect(set.getPartialMatchesOf(".a.")).toEqual(["aaa", "aab"]);
  expect(set.getPartialMatchesOf(".....")).toEqual(["aaaaa", "aaaab", "aaaac"]);
  expect(set.getPartialMatchesOf("aaaa.")).toEqual(["aaaaa", "aaaab", "aaaac"]);
  // strings with no don't care can only match their exact string
  for (const el of elements) {
    expect(set.getPartialMatchesOf(el)).toEqual([el]);
  }
  expect(set.getPartialMatchesOf("Z")).toEqual([]);
});

test("partial matches against real word list", () => {
  set.addAll(words);
  expect(set.getPartialMatchesOf(".")).toEqual(["I", "a"]);
  expect(set.getPartialMatchesOf(".e.n")).toEqual(["bean", "mean"]);
  expect(set.getPartialMatchesOf("........e")).toEqual([
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
  expect(set.getPartialMatchesOf("j...")).toEqual(["join", "jump", "just"]);
  expect(set.getPartialMatchesOf(".u..e")).toEqual(["juice", "quite"]);
  expect(set.getPartialMatchesOf("public")).toEqual(["public"]);
  expect(set.getPartialMatchesOf(".a.")).toEqual([
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
  expect(set.getPartialMatchesOf("...........")).toEqual([
    "comfortable",
    "examination",
    "grandfather",
    "grandmother",
  ]);
});

test("partial matches empty string handling", () => {
  set.addAll(["", "a", "b"]);
  expect(set.getPartialMatchesOf("")).toEqual([""]);
  expect(set.getPartialMatchesOf(".")).toEqual(["a", "b"]);
  expect(set.getPartialMatchesOf("a")).toEqual(["a"]);
  expect(set.getPartialMatchesOf("b")).toEqual(["b"]);
});

test("Hamming dist 0 is exact match", () => {
  set.addAll(["a", "aa", "aaa", "aaaa", "aac", "abc", "xyz"]);
  expect(set.getWithinHammingDistanceOf("abc", 0)).toEqual(["abc"]);
  expect(set.getWithinHammingDistanceOf("abz", 0)).toEqual([]);
  expect(set.getWithinHammingDistanceOf("azz", 0)).toEqual([]);
  expect(set.getWithinHammingDistanceOf("zzz", 0)).toEqual([]);
});

test("Hamming dist >= n matches all strings with pattern's length", () => {
  set.addAll(["a", "aa", "aaa", "aaaa", "aac", "abc", "xyz"]);
  expect(set.getWithinHammingDistanceOf("abc", 3)).toEqual([
    "aaa",
    "aac",
    "abc",
    "xyz",
  ]);
  expect(set.getWithinHammingDistanceOf("abc", 4)).toEqual([
    "aaa",
    "aac",
    "abc",
    "xyz",
  ]);
});

test("Hamming dist 1..n-1 matches strings <= dist", () => {
  set.addAll(["a", "aa", "aaa", "aaaa", "aac", "abc", "xyz"]);
  expect(set.getWithinHammingDistanceOf("abc", 1)).toEqual(["aac", "abc"]);
  expect(set.getWithinHammingDistanceOf("abc", 2)).toEqual([
    "aaa",
    "aac",
    "abc",
  ]);
});

test("Hamming dist for cats", () => {
  set.addAll(words);
  expect(set.getWithinHammingDistanceOf("cat", 0)).toEqual(["cat"]);
  expect(set.getWithinHammingDistanceOf("cat", 1)).toEqual(
    words.filter((s) => /^.at$/.test(s) || /^c.t$/.test(s) || /^ca.$/.test(s)),
  );
  expect(set.getWithinHammingDistanceOf("cat", 2)).toEqual(
    words.filter((s) => /^..t$/.test(s) || /^c..$/.test(s) || /^.a.$/.test(s)),
  );
  expect(set.getWithinHammingDistanceOf("cat", 3)).toEqual(
    words.filter((s) => s.length == 3),
  );
});

test("Hamming dist empty string handling", () => {
  set.addAll(["", "a", "b"]);
  expect(set.getWithinHammingDistanceOf("", 0)).toEqual([""]);
  expect(set.getWithinHammingDistanceOf("", 1)).toEqual([""]);
  set.delete("");
  expect(set.getWithinHammingDistanceOf("", 0)).toEqual([]);
});
