import { TernaryStringSet } from "../index";
import { words, wordSet } from "./word-list-loader";

let set: TernaryStringSet;

beforeEach(() => {
  set = new TernaryStringSet();
});

test("Not double counted", () => {
  expect(set.size).toBe(0);
  set.add("peach");
  expect(set.size).toBe(1);
  set.add("peach");
  expect(set.size).toBe(1);
});

test("Not double deleted", () => {
  expect(set.size).toBe(0);
  set.add("peach");
  expect(set.size).toBe(1);
  set.delete("peach");
  expect(set.size).toBe(0);
  set.delete("peach");
  expect(set.size).toBe(0);
});

test("Empty string", () => {
  expect(set.size).toBe(0);
  set.add("");
  expect(set.size).toBe(1);
  set.add("");
  expect(set.size).toBe(1);
  set.delete("");
  expect(set.size).toBe(0);
  set.delete("");
  expect(set.size).toBe(0);
});

test("Accurate for many words/addAll", () => {
  expect(set.size).toBe(0);
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
