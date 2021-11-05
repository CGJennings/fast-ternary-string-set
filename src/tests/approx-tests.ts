import { TernaryStringSet } from "../index";
import { words, wordSet } from "./utils";

let set: TernaryStringSet;

beforeEach(() => {
  set = new TernaryStringSet();
});

test("getArrangementsOf() bad arguments throw", () => {
  expect(() => set.getArrangementsOf(null)).toThrow();
});

test("getArrangementsOf() doesn't allow reuse or use of characters not present", () => {
  set.addAll([
    "apple",
    "baboon",
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

test("getArrangementsOf() allows use of characters as many times as they are specified", () => {
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

test("getArrangementsOf() includes empty string if present", () => {
  set.addAll(["a", "b", "c"]);
  expect(set.getArrangementsOf("")).toEqual([]);
  set.add("");
  expect(set.getArrangementsOf("")).toEqual([""]);
  expect(set.getArrangementsOf("z")).toEqual([""]);
  expect(set.getArrangementsOf("a")).toEqual(["", "a"]);
});

test("getCompletionsOf() bad arguments throw", () => {
  expect(() => set.getCompletionsOf(null)).toThrow();
});

test("getCompletionsOf() basic completions", () => {
  const elements = [
    "",
    "aardvark",
    "aardvarks",
    "armadillo",
    "baboon",
    "badger",
    "cats",
  ];
  set.addAll(elements);
  expect(set.getCompletionsOf("")).toEqual(elements);
  expect(set.getCompletionsOf("a")).toEqual([
    "aardvark",
    "aardvarks",
    "armadillo",
  ]);
  expect(set.getCompletionsOf("aa")).toEqual(["aardvark", "aardvarks"]);
  expect(set.getCompletionsOf("aardvark")).toEqual(["aardvark", "aardvarks"]);
  expect(set.getCompletionsOf("aardvarks")).toEqual(["aardvarks"]);
  expect(set.getCompletionsOf("aardvarkz")).toEqual([]);
  expect(set.getCompletionsOf("aardvarksz")).toEqual([]);
  expect(set.getCompletionsOf("b")).toEqual(["baboon", "badger"]);
  expect(set.getCompletionsOf("ba")).toEqual(["baboon", "badger"]);
  expect(set.getCompletionsOf("bab")).toEqual(["baboon"]);
  expect(set.getCompletionsOf("baboon")).toEqual(["baboon"]);
  expect(set.getCompletionsOf("z")).toEqual([]);
  expect(set.getCompletionsOf("zaa")).toEqual([]);
  expect(set.getCompletionsOf("babz")).toEqual([]);
});

/** Get completions the hard way for comparison. */
function completions(prefix: string, elements: readonly string[]): string[] {
  const results = [];
  for (const s of elements) {
    if (s.startsWith(prefix)) results.push(s);
  }
  return results;
}

test("getCompletionsOf() test against word list", () => {
  set = wordSet(false);
  expect(set.getCompletionsOf("z")).toEqual(completions("z", words));
  expect(set.getCompletionsOf("wi")).toEqual(completions("wi", words));
  expect(set.getCompletionsOf("wi").length).toEqual(14);
  expect(set.getCompletionsOf("she")).toEqual([
    "she",
    "sheep",
    "sheet",
    "shelf",
  ]);
});

test("getCompletedBy() bad arguments throw", () => {
  expect(() => set.getCompletedBy(null)).toThrow();
});

test("getCompletedBy() basic completions", () => {
  const elements = [
    "",
    "aardvark",
    "bumping",
    "jumping",
    "lamb",
    "lifting",
    "muskrat",
    "trying",
    "turtles",
  ];
  set.addAll(elements);
  expect(set.getCompletedBy("")).toEqual(elements);
  expect(set.getCompletedBy("ing")).toEqual([
    "bumping",
    "jumping",
    "lifting",
    "trying",
  ]);
});

/** Get completions the hard way for comparison. */
function completedBy(prefix: string, elements: readonly string[]): string[] {
  const results = [];
  for (const s of elements) {
    if (s.endsWith(prefix)) results.push(s);
  }
  return results;
}

test("getCompletedBy() test against word list", () => {
  set = wordSet(false);
  expect(set.getCompletedBy("s")).toEqual(completedBy("s", words));
  expect(set.getCompletedBy("ing")).toEqual(completedBy("ing", words));
  expect(set.getCompletedBy("zzz").length).toEqual(0);
});

test("getPartialMatchesOf() bad arguments throw", () => {
  expect(() => set.getPartialMatchesOf(null)).toThrow();
  expect(() => set.getPartialMatchesOf("", null)).toThrow();
});

test("getPartialMatchesOf() basic partial matches", () => {
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

test("getPartialMatchesOf() test matches against word list", () => {
  set = wordSet(false);
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

test("getPartialMatchesOf() empty string handling", () => {
  set.addAll(["", "a", "b"]);
  expect(set.getPartialMatchesOf("")).toEqual([""]);
  expect(set.getPartialMatchesOf(".")).toEqual(["a", "b"]);
  expect(set.getPartialMatchesOf("a")).toEqual(["a"]);
  expect(set.getPartialMatchesOf("b")).toEqual(["b"]);
});

test("getPartialMatchesOf() matches with non-default don't care", () => {
  set.addAll(["c.t", "cat", "cot", "cup", "cut"]);
  expect(set.getPartialMatchesOf("c?t", "?")).toEqual([
    "c.t",
    "cat",
    "cot",
    "cut",
  ]);
  expect(set.getPartialMatchesOf("c??", "?")).toEqual([
    "c.t",
    "cat",
    "cot",
    "cup",
    "cut",
  ]);
  expect(set.getPartialMatchesOf("##p", "#")).toEqual(["cup"]);
});

test("getWithinHammingDistanceOf() bad arguments throw", () => {
  expect(() => set.getWithinHammingDistanceOf(null, 0)).toThrow();
  expect(() => set.getWithinHammingDistanceOf(null, -1)).toThrow();
  expect(() => set.getWithinHammingDistanceOf(null, NaN)).toThrow();
  expect(() =>
    set.getWithinHammingDistanceOf(null, "1" as unknown as number),
  ).toThrow();
});

test("getWithinHammingDistanceOf() distance 0 is exact match", () => {
  set.addAll(["a", "aa", "aaa", "aaaa", "aac", "abc", "xyz"]);
  expect(set.getWithinHammingDistanceOf("abc", 0)).toEqual(["abc"]);
  expect(set.getWithinHammingDistanceOf("abz", 0)).toEqual([]);
  expect(set.getWithinHammingDistanceOf("azz", 0)).toEqual([]);
  expect(set.getWithinHammingDistanceOf("zzz", 0)).toEqual([]);
});

test("getWithinHammingDistanceOf() distance >= n matches all strings with pattern's length", () => {
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
  expect(set.getWithinHammingDistanceOf("abc", Infinity)).toEqual([
    "aaa",
    "aac",
    "abc",
    "xyz",
  ]);
});

test("getWithinHammingDistanceOf() distance 1..n-1 matches strings <= dist", () => {
  set.addAll(["a", "aa", "aaa", "aaaa", "aac", "abc", "xyz"]);
  expect(set.getWithinHammingDistanceOf("abc", 1)).toEqual(["aac", "abc"]);
  expect(set.getWithinHammingDistanceOf("abc", 2)).toEqual([
    "aaa",
    "aac",
    "abc",
  ]);
});

test("getWithinHammingDistanceOf() for cats", () => {
  set = wordSet(false);
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

test("getWithinHammingDistanceOf() empty string handling", () => {
  set.addAll(["", "a", "b"]);
  expect(set.getWithinHammingDistanceOf("", 0)).toEqual([""]);
  expect(set.getWithinHammingDistanceOf("", 1)).toEqual([""]);
  set.delete("");
  expect(set.getWithinHammingDistanceOf("", 0)).toEqual([]);
});
