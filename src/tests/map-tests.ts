import { TernaryStringSet } from "../fast-ternary-string-set";

let set: TernaryStringSet;

beforeEach(() => {
  set = new TernaryStringSet();
});

function map(
  set: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mappingFn: (value: string, index: number, set: TernaryStringSet) => any,
  expectedSet: string[],
  thisArg?: unknown,
): void {
  const tst = new TernaryStringSet(set).map(mappingFn, thisArg);
  expect(tst.toArray()).toEqual(expectedSet);
  expect(tst.size).toBe(expectedSet.length);
}

test("map() throws if passed non-function", () => {
  expect(() => set.map(null)).toThrow();
  expect(() => set.map(1 as unknown as (s: string) => boolean)).toThrow();
  expect(() => set.map({} as unknown as (s: string) => boolean)).toThrow();
});

test("map() with empty set returns empty set", () => {
  expect(set.map(() => true).size).toBe(0);
});

test("map() mapping function values coerced to string", () => {
  map(["ant"], () => true, ["true"]);
  map(["eel"], () => 1, ["1"]);
});

test("map() with singleton", () => {
  map(["stoat"], (s) => `${s.substring(1, 4)}${s[0]}${s[4]}`, ["toast"]);
  map(["regret"], (s) => s.substring(1), ["egret"]);
});

test("map() with multiple elements", () => {
  map(["mite", "serval"], (s) => s.toUpperCase(), ["MITE", "SERVAL"]);
  map(["afgoiogfa", "xela alex"], (s) => [...s].reverse().join(""), [
    "afgoiogfa",
    "xela alex",
  ]);
  map(
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    // prettier-ignore
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    (n) => String((y=>y(g=>n=>n<2?1:n*g(n-1))(n|0))(l=>(f=>f(f))(f=>l(x=>f(f)(x))))).padStart(7," "),
    [
      "      1",
      "      2",
      "      6",
      "     24",
      "    120",
      "    720",
      "   5040",
      "  40320",
      " 362880",
      "3628800",
    ],
  );
});

test("map() mapping function called with thisArg", () => {
  const thisArg: unknown = "newt";
  function callback(this: unknown) {
    return this === thisArg;
  }
  map([""], callback, ["true"], thisArg);
});
