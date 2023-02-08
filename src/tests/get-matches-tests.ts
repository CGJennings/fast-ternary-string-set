import { TernaryStringSet } from "../fast-ternary-string-set";
import { wordSet, words } from "./utils";

let set: TernaryStringSet;

beforeEach(() => {
  set = new TernaryStringSet();
});

/** Tests that result is identical to `Array.filter`, requires sorted input. */
function matches(set: readonly string[], predicate: (s: string) => boolean) {
  expect(new TernaryStringSet(set).getMatchesOf(predicate)).toEqual(
    set.filter(predicate),
  );
}

test("getMatchesOf() throws if passed non-function", () => {
  expect(() => set.getMatchesOf(null)).toThrow();
  expect(() =>
    set.getMatchesOf(1 as unknown as (s: string) => boolean),
  ).toThrow();
  expect(() =>
    set.getMatchesOf({} as unknown as (s: string) => boolean),
  ).toThrow();
});

test("getMatchesOf() empty set", () => {
  expect(set.getMatchesOf(() => true).length).toBe(0);
  expect(wordSet(false).getMatchesOf(() => false).length).toBe(0);
});

test("getMatchesOf() empty string", () => {
  set.add("");
  expect(set.getMatchesOf((s) => s === "").length).toBe(1);
  expect(set.getMatchesOf((s) => s !== "").length).toBe(0);
});

test("getMatchesOf() simple sets", () => {
  let str = ["ant", "bear", "cat", "dog", "elephant"];
  matches(str, (s) => s.length === 3);
  matches(str, (s) => s.length !== 3);
  matches(str, () => true);
  matches(str, () => false);

  str = ["", "owl", "rhino"];
  matches(str, (s) => s.length === 3);
  matches(str, (s) => s.length !== 3);
  matches(str, () => true);
  matches(str, () => false);
});

test("getMatchesOf() word list", () => {
  expect(words.length).toBeGreaterThan(0);
  matches(words, (s) => s.startsWith("e"));
  matches(words, (s) => s.includes("e"));
  matches(words, (s) => s.length === 3);
  matches(words, (s) => s.length !== 3);
  matches(words, () => true);
  matches(words, () => false);
});
