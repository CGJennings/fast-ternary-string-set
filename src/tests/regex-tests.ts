import { TernaryStringSet } from "../fast-ternary-string-set";
import { wordSet, words } from "./utils";

let set: TernaryStringSet;

beforeEach(() => {
  set = new TernaryStringSet();
});

function regex(
  set: readonly string[] | TernaryStringSet,
  regex: RegExp | string,
  expected: string[],
): void {
  if (!(set instanceof TernaryStringSet)) {
    set = new TernaryStringSet(set);
  }
  expect(set.getRegexMatchesOf(regex)).toEqual(expected);
}

/** Test any regular expression against the word list. */
function regexList(pattern: RegExp) {
  const expected = words.filter((s) => {
    const m = s.match(pattern);
    return m && m[0].length === s.length;
  });
  regex(wordSet(false), pattern, expected);
}

test("getRegexMatchesOf() throws if not passed RegExp or string", () => {
  expect(() => set.getRegexMatchesOf(null)).toThrow();
  expect(() => set.getRegexMatchesOf(1 as unknown as RegExp)).toThrow();
  expect(() => set.getRegexMatchesOf({} as unknown as RegExp)).toThrow();
  expect(() => set.getRegexMatchesOf("")).not.toThrow();
});

test("getRegexMatchesOf() throws if passed invalid regex string", () => {
  expect(() => set.getRegexMatchesOf("(")).toThrow();
});

test("getRegexMatchesOf() with empty set returns empty set", () => {
  expect(set.getRegexMatchesOf("")).toEqual([]);
  expect(set.getRegexMatchesOf("a")).toEqual([]);
  expect(set.getRegexMatchesOf(/.*/)).toEqual([]);
});

test("getRegexMatchesOf() with empty string", () => {
  regex([""], "", [""]);
  regex([""], /()/, [""]);
  regex([""], /.*/, [""]);
  regex([""], /^$/, [""]);
  regex([""], /a+/, []);
  regex(["", "aaa"], /a+/, ["aaa"]);
  regex(["", "aaa"], /.*/, ["", "aaa"]);
  regex(["", "a", "aaa"], /.*/, ["", "a", "aaa"]);
});

test("getRegexMatchesOf() must match entire string", () => {
  regex(["aaa", "aab", "baa", "bab"], /a+/, ["aaa"]);
  regex(["aaa", "aab", "baa", "bab"], /a*ba*/, ["aab", "baa"]);
  regex(["aaa", "aab", "baa", "bab"], /[ab]*a/, ["aaa", "baa"]);
  regex(["aaa", "aab", "baa", "bab"], /[ab]*c[ab]*/, []);
});

test("getRegexMatchesOf() with literal prefixes", () => {
  regex(["", "a", "ab", "abc", "abcd"], /abc/, ["abc"]);
  regex(["", "a", "ab", "abc", "abcd", "abcde", "abce", "abd"], /abc.*/, [
    "abc",
    "abcd",
    "abcde",
    "abce",
  ]);
  regex(["", "a", "ab", "abb", "abbb", "b", "ba", "bb"], /ab+/, [
    "ab",
    "abb",
    "abbb",
  ]);
  regex(["", "a", "aa", "ab", "a\\", "a\\w"], /a\w/, ["aa", "ab"]);
  regex(
    ["", "a", "ab", "abc", "abcd", "abd", "ab[", "ab[c", "ab[cd", "ab[cd]"],
    /ab[cd]/,
    ["abc", "abd"],
  );
  regex(["", "a", "ab", "abc", "abcd", "abcde", "abce", "abd"], /ab(cd)/, [
    "abcd",
  ]);
});

test("getRegexMatchesOf() prefix skips implied ^ anchor", () => {
  regex(["", "a", "^", "^a", "^^", "^^^"], /^a/, ["a"]);
  regex(["", "a", "^", "^a", "^^", "^^^"], /^\^/, ["^"]);
  regex(["", "a", "^", "^a", "^^", "^^^"], /\^/, ["^"]);
});

test("getRegexMatchesOf() with prefixes ending in 0+ quantifiers", () => {
  regex(["", "a", "aa", "aaa", "ab", "aab", "b", "ba"], /a*/, [
    "",
    "a",
    "aa",
    "aaa",
  ]);
  regex(["a", "aa", "aaa", "ab", "aab"], /a*/, ["a", "aa", "aaa"]);
  regex(["", "a", "aa", "aaa", "ab", "aab", "b", "ba"], /a*b?/, [
    "",
    "a",
    "aa",
    "aaa",
    "aab",
    "ab",
    "b",
  ]);
  regex(["", "a", "ab", "abb", "abbb", "b", "ba", "bb"], /ab*/, [
    "a",
    "ab",
    "abb",
    "abbb",
  ]);
  regex(["", "a", "aa", "ab", "b", "bb"], /b?/, ["", "b"]);
  regex(["a", "aa", "ab", "b", "bb"], /b?/, ["b"]);
  regex(
    ["", "a", "aa", "aaa", "aaaa", "ab", "aab", "aaab", "b", "ba"],
    /a{3,}/,
    ["aaa", "aaaa"],
  );
  regex(
    ["", "a", "aa", "aaa", "aaaa", "ab", "aab", "aaab", "b", "ba"],
    /aa{2,}/,
    ["aaa", "aaaa"],
  );
  regex(["", "{", "{{"], /{/, ["{"]);
});

test("getRegexMatchesOf() with false prefix due to pipe", () => {
  regex(
    [
      "",
      "a",
      "ab",
      "abc",
      "abcd",
      "abcde",
      "abcdef",
      "abd",
      "abdef",
      "def",
      "defa",
      "defabc",
    ],
    /abc|def/,
    ["abc", "def"],
  );
});

test("getRegexMatchesOf() against word list", () => {
  // these tests do not rely on regexList(), which uses
  // similar logic to getRegexMatchesOf() to filter
  // the word list and so might have a common flaw
  regex(
    wordSet(false),
    /wise/,
    words.filter((w) => w === "wise"),
  );
  regex(
    wordSet(false),
    /wi.*/,
    words.filter((w) => w.startsWith("wi")),
  );
  regex(
    wordSet(false),
    /.*ing/,
    words.filter((w) => w.endsWith("ing")),
  );
  regex(
    wordSet(false),
    /.*e.*/,
    words.filter((w) => w.includes("e")),
  );

  // more general tests using regexList
  regexList(/st.*[gs]/);
  regexList(/s[aeiou]\w/);
  regexList(/(a|b|c|dog)[aeiou]?[a-z]?/);
  regexList(/[a-z]{3,}/);
  regexList(/m[a-z]{3,}/);
  regexList(/mo*n/);
  regexList(/moo*n/);
  regexList(/mo+n/);
  regexList(/mooo*n/);
  regexList(/moooo*n/);
  regexList(/mo?n/);
  regexList(/moo?n/);
  regexList(/mooo?n/);
  regexList(/moooo?n/);
  regexList(/[a-z]{,7}ed/);
});
