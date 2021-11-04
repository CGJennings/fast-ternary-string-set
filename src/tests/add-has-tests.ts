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

test("add() non-string throws", () => {
  expect(() => set.add(null as unknown as string)).toThrow();
  expect(() => set.add(0 as unknown as string)).toThrow();
  expect(() => set.add(/x/ as unknown as string)).toThrow();
  expect(() => set.add({} as unknown as string)).toThrow();
  expect(() => set.add([] as unknown as string)).toThrow();
  expect(() => set.add(Symbol("centipede") as unknown as string)).toThrow();
});

test("add() empty string", () => {
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

test("add() length 1 string", () => {
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

test("add() singleton", () => {
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

test("add() multiple strings", () => {
  const words = ["moose", "dolphin", "caribou", "emu", "snake", "zebra", "narwhal"];
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

function addAll(...args: string[]) {
  let strings: Iterable<string> = args;
  for (let iterableType = 0; iterableType < 2; ++iterableType) {
    const set = new TernaryStringSet();
    set.addAll(strings);
    expect(set.size).toBe(args.length);
    args.forEach((s) => {
      expect(set.has(s)).toBe(true);
    });
    strings = new Set(args);
  }
}

test("addAll() with length 0", () => {
  addAll();
});

test("addAll() all with length 1", () => {
  addAll("ape");
});

test("addAll() all with length 2", () => {
  addAll("ape", "cat");
});

test("addAll() all with length 3", () => {
  addAll("ape", "cat", "eel");
});

test("addAll() with duplicate words yields correct size", () => {
  set.addAll([
    "antelope",
    "crab",
    "porcupine",
    "crab",
    "crab",
    "crab",
    "antelope",
    "porcupine",
  ]);
  expect(set.size).toBe(3);
});

test("addAll() from short English list", () => {
  set.addAll(words);
  expect(set.size).toBe(words.length);
  words.forEach((s) => {
    expect(set.has(s)).toBe(true);
  });
});

test("addAll() strings with spaces, punctuation, emoji, etc.", () => {
  addAll(
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
  );
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
  expect(() => (set as any).addAll([null])).toThrow();
  expect(() => (set as any).addAll([0])).toThrow();
  expect(() => (set as any).addAll([{}])).toThrow();
  expect(() => (set as any).addAll(["raven", null])).toThrow();
  expect(() => (set as any).addAll(["finch", 0])).toThrow();
  expect(() => (set as any).addAll(["robin", {}])).toThrow();
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
  expect(() => (set as any).addAll(["lobster"], {})).toThrow();
  expect(() => (set as any).addAll(["badger"], -1)).toThrow();
  expect(() => (set as any).addAll(["asp"], 0.5)).toThrow();
  expect(() => (set as any).addAll(["pig"], NaN)).toThrow();
  expect(() => (set as any).addAll(["hare"], 2)).toThrow();
  expect(() => (set as any).addAll(["ox"], 0, -1)).toThrow();
  expect(() => (set as any).addAll(["wolf"], 0, 0.5)).toThrow();
  expect(() => (set as any).addAll(["spider"], 0, NaN)).toThrow();
  expect(() => (set as any).addAll(["carp"], 0, 2)).toThrow();
  /* eslint-enable @typescript-eslint/no-explicit-any */
});
