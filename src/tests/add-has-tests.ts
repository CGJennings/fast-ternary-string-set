import { TernaryStringSet } from "../index";
import { load } from "./word-list-loader";

let tree: TernaryStringSet;
const words = load("short-english");

beforeEach(() => {
  tree = new TernaryStringSet();
});

test("Adding non-string throws", () => {
  expect(() => tree.add(null as unknown as string)).toThrow();
  expect(() => tree.add(0 as unknown as string)).toThrow();
  expect(() => tree.add(/x/ as unknown as string)).toThrow();
  expect(() => tree.add({} as unknown as string)).toThrow();
  expect(() => tree.add([] as unknown as string)).toThrow();
});

test("Add empty string", () => {
  expect(tree.size).toBe(0);
  tree.add("");
  expect(tree.size).toBe(1);
  expect(tree.has("")).toBe(true);
  expect(tree.has("c")).toBe(false);
});

test("Add singleton", () => {
  expect(tree.size).toBe(0);
  tree.add("cat");
  expect(tree.size).toBe(1);
  expect(tree.has("cat")).toBe(true);
  expect(tree.has("")).toBe(false);
  expect(tree.has("c")).toBe(false);
  expect(tree.has("cc")).toBe(false);
  expect(tree.has("ca")).toBe(false);
  expect(tree.has("caa")).toBe(false);
  expect(tree.has("cats")).toBe(false);
});

test("Add length 1 string", () => {
  tree.add("a");
  expect(tree.has("a")).toBe(true);
  expect(tree.has("")).toBe(false);
  expect(tree.has("c")).toBe(false);
  expect(tree.has("aa")).toBe(false);
});

test("Add multiple strings", () => {
  const words = ["maple", "dog", "cat", "egg", "snake", "zebra", "nest"];
  // test each as added
  words.forEach((s) => {
    tree.add(s);
    expect(tree.has(s)).toBe(true);
  });
  // retest all after adding
  words.forEach((s) => {
    expect(tree.has(s)).toBe(true);
  });
  expect(tree.size).toBe(words.length);
});

test("Add all with length 0", () => {
  tree.addAll([]);
  expect(tree.size).toBe(0);
});

test("Add all with length 1", () => {
  tree.addAll(["ape"]);
  expect(tree.size).toBe(1);
});

test("Add all with length 2", () => {
  tree.addAll(["ape", "pancake"]);
  expect(tree.size).toBe(2);
});

test("Add all with length 3", () => {
  tree.addAll(["ape", "pancake", "rhubarb"]);
  expect(tree.size).toBe(3);
});

test("Add all with duplicate words", () => {
  tree.addAll([
    "ape",
    "crab",
    "pancake",
    "crab",
    "crab",
    "crab",
    "ape",
    "pancake",
  ]);
  expect(tree.size).toBe(3);
});

test("Add all from short English list", () => {
  tree.addAll(words);
  expect(tree.size).toBe(words.length);
  words.forEach((s) => {
    expect(tree.has(s)).toBe(true);
  });
});

test("Add strings with spaces, punctuation, emoji, etc.", () => {
  const words = [
    "Mt. Doom",
    "a dog—smelly",
    "line 1\nline2",
    "🙂",
    "I have a pet 🐈",
    "good 🍀 luck!",
    "程序设计员在用电脑。",
    "The \0 NUL Zone",
    "max code point \udbff\udfff",
  ];
  tree.addAll(words);
  expect(tree.size).toBe(words.length);
  words.forEach((s) => {
    expect(tree.has(s)).toBe(true);
  });
});
