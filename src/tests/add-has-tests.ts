import { TernaryStringSet } from "../index";
import { words } from "./utils";

let set: TernaryStringSet;

beforeEach(() => {
  set = new TernaryStringSet();
});

test("add() and addAll() are fluent", () => {
  expect(set.add("grouse")).toBe(set);
  expect(set.addAll(["cavy", "mole"])).toBe(set);
});

test("Adding non-string throws", () => {
  expect(() => set.add(null as unknown as string)).toThrow();
  expect(() => set.add(0 as unknown as string)).toThrow();
  expect(() => set.add(/x/ as unknown as string)).toThrow();
  expect(() => set.add({} as unknown as string)).toThrow();
  expect(() => set.add([] as unknown as string)).toThrow();
  expect(() => set.add(Symbol("centipede") as unknown as string)).toThrow();
});

test("Add empty string", () => {
  expect(set.size).toBe(0);
  set.add("");
  expect(set.size).toBe(1);
  expect(set.has("")).toBe(true);
  expect(set.has("c")).toBe(false);
  expect(set.toArray()).toEqual([""]);
  const a: string[] = [];
  set.forEach((s) => a.push(s));
  expect(a).toEqual([""]);
  expect(Array.from(set.entries())).toEqual([["", ""]]);
});

test("Add length 1 string", () => {
  set.add("a");
  expect(set.has("a")).toBe(true);
  expect(set.has("")).toBe(false);
  expect(set.has("c")).toBe(false);
  expect(set.has("aa")).toBe(false);
  expect(set.toArray()).toEqual(["a"]);
  const a: string[] = [];
  set.forEach((s) => a.push(s));
  expect(a).toEqual(["a"]);
  expect(Array.from(set.entries())).toEqual([["a", "a"]]);
});

test("Add singleton", () => {
  expect(set.size).toBe(0);
  set.add("cat");
  expect(set.size).toBe(1);
  expect(set.has("cat")).toBe(true);
  expect(set.has("")).toBe(false);
  expect(set.has("c")).toBe(false);
  expect(set.has("cc")).toBe(false);
  expect(set.has("ca")).toBe(false);
  expect(set.has("caa")).toBe(false);
  expect(set.has("cats")).toBe(false);
  expect(set.toArray()).toEqual(["cat"]);
  const a: string[] = [];
  set.forEach((s) => a.push(s));
  expect(a).toEqual(["cat"]);
  expect(Array.from(set.entries())).toEqual([["cat", "cat"]]);
});

test("Add multiple strings", () => {
  const words = ["maple", "dog", "cat", "egg", "snake", "zebra", "nest"];
  // test each as added
  words.forEach((s) => {
    set.add(s);
    expect(set.has(s)).toBe(true);
  });
  // retest all after adding
  words.forEach((s) => {
    expect(set.has(s)).toBe(true);
  });
  expect(set.size).toBe(words.length);
});

test("Add all with length 0", () => {
  set.addAll([]);
  expect(set.size).toBe(0);
});

test("Add all with length 1", () => {
  set.addAll(["ape"]);
  expect(set.size).toBe(1);
});

test("Add all with length 2", () => {
  set.addAll(["ape", "pancake"]);
  expect(set.size).toBe(2);
});

test("Add all with length 3", () => {
  set.addAll(["ape", "pancake", "rhubarb"]);
  expect(set.size).toBe(3);
});

test("Adding duplicate words yields correct size", () => {
  set.addAll([
    "ape",
    "crab",
    "pancake",
    "crab",
    "crab",
    "crab",
    "ape",
    "pancake",
  ]);
  expect(set.size).toBe(3);
});

test("Add all from short English list", () => {
  set.addAll(words);
  expect(set.size).toBe(words.length);
  words.forEach((s) => {
    expect(set.has(s)).toBe(true);
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
    "𝄞𝅘𝅥𝅘𝅥𝅮𝅘𝅥𝅯𝅘𝅥𝅰𝄽",
    "The \0 NUL Zone",
    "max code point \udbff\udfff",
  ];
  set.addAll(words);
  expect(set.size).toBe(words.length);
  words.forEach((s) => {
    expect(set.has(s)).toBe(true);
  });
});

const BAD_INDEX_PREFIX = "non-string at index ";
function getAddAllFailureIndex(set: unknown[]): number {
  const tst = new TernaryStringSet();
  try {
    tst.addAll(set as string[]);
  } catch (ex) {
    if (ex instanceof TypeError) {
      if (ex.message.startsWith(BAD_INDEX_PREFIX)) {
        return Number.parseFloat(ex.message.substring(BAD_INDEX_PREFIX.length));
      }
    }
    throw ex;
  }
  return -1;
}

test("addAll() throws on bad array element", () => {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  expect(() => (set as any).addAll()).toThrow();
  expect(() => (set as any).addAll(null)).toThrow();
  expect(() => (set as any).addAll("yup")).toThrow();
  expect(() => (set as any).addAll([null])).toThrow();
  expect(() => (set as any).addAll([0])).toThrow();
  expect(() => (set as any).addAll([{}])).toThrow();
  expect(() => (set as any).addAll(["yup", null])).toThrow();
  expect(() => (set as any).addAll(["yup", 0])).toThrow();
  expect(() => (set as any).addAll(["yup", {}])).toThrow();
  /* eslint-enable @typescript-eslint/no-explicit-any */
});

test("addAll() reports index of bad element", () => {
  expect(getAddAllFailureIndex([])).toBe(-1);
  expect(getAddAllFailureIndex(["bee"])).toBe(-1);
  expect(getAddAllFailureIndex(["echidna", "gopher"])).toBe(-1);
  expect(getAddAllFailureIndex([1])).toBe(0);
  expect(getAddAllFailureIndex(["wombat", Symbol("tiger")])).toBe(1);
  expect(getAddAllFailureIndex(["dingo", "python", null])).toBe(2);
  expect(getAddAllFailureIndex(["lynx", () => "", "goat", null])).toBe(1);
});

test("addAll() throws on bad start/end index", () => {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  expect(() => (set as any).addAll(["yup"], {})).toThrow();
  expect(() => (set as any).addAll(["yup"], -1)).toThrow();
  expect(() => (set as any).addAll(["yup"], 0.5)).toThrow();
  expect(() => (set as any).addAll(["yup"], NaN)).toThrow();
  expect(() => (set as any).addAll(["yup"], 2)).toThrow();
  expect(() => (set as any).addAll(["yup"], 0, -1)).toThrow();
  expect(() => (set as any).addAll(["yup"], 0, 0.5)).toThrow();
  expect(() => (set as any).addAll(["yup"], 0, NaN)).toThrow();
  expect(() => (set as any).addAll(["yup"], 0, 2)).toThrow();
  /* eslint-enable @typescript-eslint/no-explicit-any */
});

