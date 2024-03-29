import { TernaryStringSet } from "../fast-ternary-string-set";
import { wordSet, readBuffer } from "./utils";

let set: TernaryStringSet;

function roundtrip(set: TernaryStringSet): void {
  const buff = set.toBuffer();
  const set2 = TernaryStringSet.fromBuffer(buff);
  expect(set.equals(set2)).toBeTruthy();
  expect(set.stats.toString()).toEqual(set2.stats.toString());
}

beforeEach(() => {
  set = new TernaryStringSet();
});

test("toBuffer() empty tree has header only", () => {
  expect(set.toBuffer().byteLength).toBe(8);
});

test("toBuffer() non-empty tree has node bytes", () => {
  set.add("a");
  // HEADER + 1 node enc. + 1 char + 0 * 3 branches
  expect(set.toBuffer().byteLength).toBe(8 + 2);
  roundtrip(set);
  // HEADER + 1 node enc. + 2 char + 0 * 3 branches
  set.clear();
  set.add("ɑ");
  expect(set.toBuffer().byteLength).toBe(8 + 3);
  roundtrip(set);
  // HEADER + 1 node enc. + 3 char + 0 * 3 branches
  set.clear();
  set.add("𝄞");
  expect(set.toBuffer().byteLength).toBe(8 + 4);
  roundtrip(set);
});

test("toBuffer()/fromBuffer() roundtrip a small set", () => {
  set.addAll(["", "apple", "ankle", "ball", "pi", "piano", "pink", "ukulele"]);
  roundtrip(set);
  set.compact();
  roundtrip(set);
});

test("toBuffer()/fromBuffer() roundtrip a large set", () => {
  set = wordSet(true);
  roundtrip(set);
  set.compact();
  roundtrip(set);
});

test("toBuffer()/fromBuffer() roundtrip sets with wide cp/branch values", () => {
  const s: string[] = [];
  for (let cp = 0; cp < 0x100ff; ++cp) {
    s[s.length] = String.fromCodePoint(cp);
  }
  set = new TernaryStringSet(s);
  roundtrip(set);

  set.clear();
  s.map((t) => `${t}s`);
  set.addAll(s);
  roundtrip(set);

  set.clear();
  s.map((t) => `p${t}`);
  set.addAll(s);
  roundtrip(set);
});

[
  "version1",
  "version2int32",
  "version2int16",
  "version2compact",
  "version3",
  "version3compact",
].forEach((file) => {
  test(`fromBuffer() restore ${file} buffer from file`, () => {
    const restored = TernaryStringSet.fromBuffer(readBuffer(file));
    expect(restored.equals(wordSet(false))).toBeTruthy();
  });
});

test("fromBuffer() restore v3 coverage buffer from file", () => {
  const restored = TernaryStringSet.fromBuffer(readBuffer("version3coverage"));
  expect(restored.size).toBe(0x100ff);
});

test("fromBuffer() null or invalid buffer throws", () => {
  expect(() =>
    TernaryStringSet.fromBuffer(null as unknown as ArrayBuffer),
  ).toThrow();
  expect(() =>
    TernaryStringSet.fromBuffer(1 as unknown as ArrayBuffer),
  ).toThrow();
  expect(() => TernaryStringSet.fromBuffer(new Uint8Array(16))).toThrow();
});
