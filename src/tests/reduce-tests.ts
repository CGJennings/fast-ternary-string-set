import { TernaryStringSet } from "../index";

let set: TernaryStringSet;

function reduce(
  set: string[],
  expected: string,
  reducer: (acc: string, el: string, i: number) => string,
  initial?: string,
) {
  const tst = new TernaryStringSet(set);
  const actual = tst.reduce(reducer, initial);
  expect(actual).toBe(expected);
}

beforeEach(() => {
  set = new TernaryStringSet();
});

test("reduce() throws if passed non-function", () => {
  expect(() =>
    set.reduce(1 as unknown as (acc: string, el: string) => string),
  ).toThrow();
});

test("reduce() throws on empty set with no initial value", () => {
  expect(() => set.reduce((acc, el) => acc + el)).toThrow();
});

test("reduce() on empty set with initial value returns initial value", () => {
  reduce([], "initial", (acc, el) => acc + el, "initial");
});

test("reduce() with empty string", () => {
  reduce([""], "", (acc, el, i) => `${acc}${i}:${el}`);
  reduce(["", "a"], "1:a", (acc, el, i) => `${acc}${i}:${el}`);
  reduce(["", "a"], "0:1:a", (acc, el, i) => `${acc}${i}:${el}`, "");
});

test("reduce() with singletons", () => {
  reduce(["lobster"], "lobster", (acc, el) => el + acc);
  reduce(["lobster"], "lobsters", (acc, el) => el + acc, "s");
});

test("reduce() with multiple elements", () => {
  reduce(["cat", "dog"], "cat > dog", (acc, el) => `${acc} > ${el}`);
  reduce(["iga", "tor", "all"], "alligator", (acc, el) => acc + el);
  reduce(["ant", "bat", "cat"], "cat, bat, ant", (acc, el) => `${el}, ${acc}`);
});

test("reduce() with non-string accumulator", () => {
  set.addAll(["ant", "ape", "bat", "bee", "eel", "fox", "orca", "owl", "ox"]);
  const actual = set.reduce((acc, el) => {
    const group = el.charAt(0);
    if (acc[group] === undefined) {
      acc[group] = 1;
    } else {
      ++acc[group];
    }
    return acc;
  }, {} as { [key: string]: number });
  expect(actual).toEqual({ a: 2, b: 2, e: 1, f: 1, o: 3 });
});
