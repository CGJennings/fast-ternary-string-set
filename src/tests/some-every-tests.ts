import { TernaryStringSet } from "../index";
import { wordSet } from "./utils";

let set: TernaryStringSet;

beforeEach(() => {
  set = new TernaryStringSet();
});

function some(
  set: string[],
  expected: boolean,
  predicate: (value: string) => boolean,
): void {
  expect(new TernaryStringSet(set).some(predicate)).toBe(expected);
}

function every(
  set: string[],
  expected: boolean,
  predicate: (value: string) => boolean,
): void {
  expect(new TernaryStringSet(set).every(predicate)).toBe(expected);
}

test("some() throws if passed non-function", () => {
  expect(() => set.some(null)).toThrow();
  expect(() => set.some(1 as unknown as (s: string) => boolean)).toThrow();
  expect(() => set.some({} as unknown as (s: string) => boolean)).toThrow();
});

test("some() with empty set is false", () => {
  expect(set.some(() => true)).toBeFalsy();
});

test("some() with empty string", () => {
  some([""], true, () => true);
  some([""], true, (s) => s === "");
  some([""], false, (s) => s === "crayfish");
  some(["", "ant"], true, () => true);
  some(["", "ant"], true, (s) => s === "");
  some(["", "ant"], false, (s) => s === "crayfish");
});

test("some() with singleton", () => {
  some(["rat"], true, (s) => s === "rat");
  some(["rat"], false, (s) => s === "cat");
  some(["rat"], false, (s) => s === "");
});

test("some() with multiple elements", () => {
  some(["lion", "leopard", "lynx"], true, (s) => s === "lynx");
  some(["lion", "leopard", "lynx"], true, (s) => s.startsWith("l"));
  some(["lion", "leopard", "lynx"], false, (s) => s === "");
});

test("some() against word list", () => {
  expect(wordSet(false).some((s) => s.length > 0)).toBeTruthy();
  expect(wordSet(false).some((s) => s.endsWith("ing"))).toBeTruthy();
  expect(wordSet(false).some((s) => s.endsWith("zzz"))).toBeFalsy();
});

test("every() throws if passed non-function", () => {
  expect(() => set.every(null)).toThrow();
  expect(() => set.every(1 as unknown as (s: string) => boolean)).toThrow();
  expect(() => set.every({} as unknown as (s: string) => boolean)).toThrow();
});

test("every() with empty set is true", () => {
  expect(set.every(() => false)).toBeTruthy();
});

test("every() with empty string", () => {
  every([""], true, () => true);
  every([""], true, (s) => s === "");
  every([""], false, (s) => s === "crayfish");
  every(["", "ant"], true, () => true);
  every(["", "ant"], false, (s) => s === "");
  every(["", "ant"], false, (s) => s === "crayfish");
  every(["", "ant"], false, (s) => s.length > 2);
});

test("every() with singleton", () => {
  every(["rat"], true, (s) => s === "rat");
  every(["rat"], false, (s) => s === "cat");
  every(["rat"], false, (s) => s === "");
});

test("every() with multiple elements", () => {
  every(["lion", "leopard", "lynx"], false, (s) => s === "lynx");
  every(["lion", "leopard", "lynx"], true, (s) => s.startsWith("l"));
  every(["lion", "leopard", "lynx"], false, (s) => s === "");
});

test("every() against word list", () => {
  expect(wordSet(false).every((s) => s.length > 0)).toBeTruthy();
  expect(wordSet(false).every((s) => s.endsWith("ing"))).toBeFalsy();
  expect(wordSet(false).every((s) => s.endsWith("zzz"))).toBeFalsy();
});
