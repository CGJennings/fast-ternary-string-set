import { TernaryStringSet } from "../fast-ternary-string-set";
import { words, wordSet } from "./utils";

let set: TernaryStringSet;

beforeEach(() => {
  set = new TernaryStringSet();
});

test("size not double counted", () => {
  expect(set.size).toBe(0);
  set.add("peach");
  expect(set.size).toBe(1);
  set.add("peach");
  expect(set.size).toBe(1);
});

test("size not double deleted", () => {
  expect(set.size).toBe(0);
  set.add("peach");
  expect(set.size).toBe(1);
  set.delete("peach");
  expect(set.size).toBe(0);
  set.delete("peach");
  expect(set.size).toBe(0);
});

test("size with empty string", () => {
  expect(set.size).toBe(0);
  set.add("");
  expect(set.size).toBe(1);
  set.add("");
  expect(set.size).toBe(1);
  set.delete("");
  expect(set.size).toBe(0);
  set.delete("");
  expect(set.size).toBe(0);
  set.add("");
  expect(set.size).toBe(1);
  set.add("whale");
  expect(set.size).toBe(2);
});

test("size accurate after addAll() of word list", () => {
  expect(set.size).toBe(0);
  set = wordSet();
  expect(set.size).toBe(words.length);
  set.balance();
  set.compact();
  expect(set.size).toBe(words.length);
  let i = 0;
  for (const el of set) {
    set.delete(el);
    expect(set.size).toBe(words.length - ++i);
  }
  for (const el of words) {
    set.delete(el);
    expect(set.size).toBe(0);
  }
});

test("size accurate after sequential delete() of word list", () => {
  set = wordSet();
  expect(set.size).toBe(words.length);
  let i = 0;
  for (const el of set) {
    set.delete(el);
    expect(set.size).toBe(words.length - ++i);
  }
  for (const el of words) {
    set.delete(el);
    expect(set.size).toBe(0);
  }
});
