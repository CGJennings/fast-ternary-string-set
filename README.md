# Fast ternary string set

![CI status badge](https://github.com/CGJennings/fast-ternary-string-set/actions/workflows/ci.yml/badge.svg)

A fast, space-efficient, serializable string set based on [*ternary search trees*](#about-ternary-search-trees) (or *lexicographic trees*), with both exact and approximate search.

**Common applications:** autocompletion, text prediction, spelling checking, word games and puzzles

**Jump to:** [Features](#features)&nbsp;/ [Installation](#installation)&nbsp;/ [Examples](#examples)&nbsp;/ [Usage notes](#usage-notes)&nbsp;/ [Serialization format](#serialization-format)&nbsp;/ [API docs](https://cgjennings.github.io/fast-ternary-string-set/classes/TernaryStringSet.html)

## Features

 - Drop-in replacement for [nearly any use](#differences-from-standard-js-set) of a [JavaScript `Set`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set) of strings.
 - Serializes to an `ArrayBuffer`: load sets directly without the overhead of initializing from a list of strings.
 - Search and iteration methods return elements in ascending sorted order (lexicographic by code point).
 - Set relations (equal, subset, superset, disjoint).
 - Set operations (union, intersection, difference, symmetric difference).
 - `Array`-like functional methods (forEach, filter, map, find, reduce, join, some, every).
 - Several approximate matching methods:
   1. List strings that complete a prefix.
   2. List strings that are completed by a suffix.
   3. List strings that can be made from a list of letters.
   4. List strings within a certain [Hamming distance](https://en.wikipedia.org/wiki/Hamming_distance) of a pattern.
   5. List strings within a certain [edit distance](https://en.wikipedia.org/wiki/Levenshtein_distance) of a pattern.
   6. List strings that match a pattern including "don't care" letters (as `.` in a regular expression).
   7. List strings that exactly match a regular expression.
   8. List strings that match an arbitrary test.
 - Time and space efficient:
   - Leverages common JS engine optimizations under the hood.
   - Elements share tree nodes and do not retain references to the original strings.
   - Read-only sets can be [*compacted*](https://cgjennings.github.io/fast-ternary-string-set/classes/TernaryStringSet.html#compact) to save even more space.
 - Well-documented TypeScript source, targeting modern JavaScript by default.
 - Use as a standalone/ECMAScript module or as a Node.js/CommonJS module.
 - Operates on full code points rather than 16-bit characters.
 - Backed by extensive test suites.
 - No other dependencies.

## Installation

To install the latest stable version with `npm`:

```bash
npm install fast-ternary-string-set
```

Or, if using `yarn`:

```bash
yarn add fast-ternary-string-set
```

To use it without Node.js, you can simply copy the main source file (`src/index.ts`) into any TypeScript project, rename to something sensible, and then `import` it into your code as usual.

## Examples

[Complete API docs are available.](https://cgjennings.github.io/fast-ternary-string-set/classes/TernaryStringSet.html) Here are some examples to get you started:

Loading the module:

```js
// From Node.js with CommonJS-style modules:
const { TernaryStringSet } = require("fast-ternary-string-set");
// From TypeScript:
import { TernaryStringSet } from "fast-ternary-string-set";
```

Create a new set and add some strings:

```js
const set = new TernaryStringSet();
set.add("dog").add("cat").add("eagle");
// or alternatively
set.addAll("aardvark", "beaver", "dog", "fish", "hamster");
set.has("cat");
// => true
set.delete("cat");
// => true since "cat" was in the set
set.has("cat");
// => false
set.has(123.456);
// => false (any non-string returns false)
```

Create a new string set from any `Iterable<string>`:

```js
// otherSet could be any Iterable<string>, such as a string array
// or another TernaryStringSet
let otherSet = new Set(["fish", "hippo"]);
let set = new TernaryStringSet(otherSet);
set.has("hippo");
// => true
```

Iterate over all elements in sorted order:

```js
for (const el of set) {
    console.log(el);
}
// or equivalently:
set.forEach((el) => console.log(el));
```

Get all elements that start with `"sha"`:

```js
set.getCompletionsOf("sha");
// => ["shade", "shadow", "shake", "shape", "shapes"] (for example)
```

Get all elements that can be made from the letters of `"taco"`:

```js
set.getArrangementsOf("taco");
// => ["act", "cat", "coat", "taco"] (for example)
```

Get all elements within Hamming distance 1 of `"cat"`:

```js
set.getWithinHammingDistanceOf("cat", 1);
// => ["bat", "can", "cat", "cot", "sat"] (for example)
```

Get all elements within edit distance (Levenshtein distance) 1 of `"cat"`:

```js
set.getWithinEditDistanceOf("cat", 1);
// => ["at", "bat", "can", "cat", "cats", "cot", "sat"] (for example)
```

Get all elements that match `"b.t"`:

```js
set.getPartialMatchesOf("b.t");
// => ["bat", "bet", "bit", "bot", "but"] (for example)
```

Create a new set with the elements reversed:

```js
set.map((el) => [...el].reverse().join("")).toArray();
// => ["olleH", "rotcoD"] (for example)
```

Get the subset of 4-letter strings:

```js
set.filter((el) => el.length === 4).toArray();
// => ["bank", "cave", "door", "four"] (for example)
```

List elements in reverse sorted order:

```js
set.reduce((acc, el) => `${el}, ${acc}`);
// => "cherry, banana, apple" (for example)
```

Test if any element is longer than 9 characters:

```js
set.add("ambidextrous").some((el) => el.length > 9);
// => true
```

Compare sets:

```js
let s1 = new TernaryStringSet(["a", "b", "c"]);
let s2 = new TernaryStringSet(s1);
s1.equals(s2);
// => true
s1.isSubsetOf(s2);
// => true
s2.add("d");
s1.equals(s2);
// => false
s1.isSubsetOf(s2);
// => true
s1.isSupersetOf(s2);
// => false
```

Serialize to or from a buffer:

```js
// write a set to an ArrayBuffer
const buff = set.toBuffer();

// create a new set from a previously saved ArrayBuffer
const set = TernaryStringSet.fromBuffer(buff);
```

Recreate a set from a buffer previously stored on a server:

```js
async function loadTernaryStringSet(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`set download "${url}" failed: ${response.status} ${response.statusText}`);
  }
  const buffer = await resonse.arrayBuffer();
  return TernaryStringSet.fromBuffer(buffer);
}
```

A simple spelling checker:

```js
// make-dict.js
// create dictionary set from a source list
const words = fs.readFileSync("./wordlist.txt", "utf8").split("\n");
const dict = new TernaryStringSet(words).add("");
dict.balance();
dict.compact();
fs.writeFileSync("./dict.bin", dict.toBuffer());

// check-spelling.js
// load the dictionary created by make-dict.js
const dict = TernaryStringSet.fromBuffer(fs.readFileSync("./dict.bin"));
const toCheck = "In a time long past lived a cat namd Captain Peanut."
toCheck.toLowerCase().split(/\W+/).forEach((word) => {
    if (!dict.has(word)) {
        const suggest = dict.getWithinEditDistanceOf(word, 1);
        console.log(`misspelled:  ${word}`);
        console.log(`suggestions: ${suggest.join(", ")}`);
    }
});
// => misspelled:  namd
//    suggestions: name, named
```

## Usage notes

### About ternary search trees

In a *ternary search tree* (TST), each node stores one letter and has three children: the "less-than", "equal-to", and "greater-than" branches.
To search for a string, you proceed letter-by-letter from the start of the target string.
If the node contains the letter you are currently looking for, you follow the "equal-to" branch and move to the next letter in the target string.
Otherwise, you follow the "less-than" or "greater-than" branch depending on whether the target letter comes before or after the node letter in lexicographic order, respectively.
For details, [this article introduces them to solve a practical problem](https://cgjennings.ca/articles/countdown-letters/), or you can refer to the [Wikipedia entry](https://en.wikipedia.org/wiki/Ternary_search_tree).

TSTs can be an excellent option for large string sets, especially if most or all strings are known ahead of time.
TSTs save space, as strings with a common prefix (that is, strings that start the same) share nodes in the tree.
In *this* TST implementation, strings with a common suffix can also share nodes.
Their superpower, however, is their facility for performing approximate and pattern-based matching.
For example, a TST is excellent for solving crossword puzzles.

### Differences from standard JS `Set`

`TernaryStringSet`s behave like standard JS `Set`s, with minor differences:

 - They iterate over their elements in sorted order (ascending lexicographic order by code point); `Sets` iterate over objects in the order they were added.
 - They support a superset of the standard `Set` interface, but are not a subclass of `Set`. Testing them with `instanceof Set` will return `false`.
 - They can contain the empty string, but cannot contain non-strings&mdash;not even `null` or `undefined`.
 - Methods that would return a new `Set`, such as `filter` or `union`, return a new `TernaryStringSet`.
 - Methods expect that `this` to be a `TernaryStringSet`; they should not be `call`ed with arbitrary objects.
 - The `addAll` method accepts either a list of string arguments (like `Set`s), or an `Iterable<string>` with an optional range.

### Tree health

Ternary search trees are not self-balancing&mdash;unlike, say, a red-black tree.
Adding strings in sorted order produces a worst-case tree structure.
This can be avoided by adding strings all at once using the constructor or `addAll`.
Given sorted input, both of these methods will produce an optimal tree structure.
If this is not practical, adding strings in random order will typically yield a tree that's "close enough" to balanced for most applications.
Calling `balance` will rebuild the tree in optimal form, but it can be expensive.

Since most `TernaryStringSet` methods are recursive, extremely unbalanced trees can provoke "maximum call stack size exceeded" errors.

### Code point ordering

Sets are ordered and matched by their Unicode code point. For most strings this has no effect, but some Unicode code points span two characters (char codes) in a JavaScript string.
For example, the musical symbol 𝄞, code point U+1D11E, can be assigned to a JavaScript string as follows:

```js
const clefG = "\ud834\udd1e";
```

Even though it represents a single symbol, the above string has a length of two.
To avoid surprises, `TernaryStringSet` matches by code point, not by char code.
For example, since the above string is one code point, it would match `getPartialMatchesOf(".")` and not `getPartialMatchesOf("..")`.

### Compaction

Calling `compact` can significantly reduce a set's memory footprint.
For large sets of typical strings, this can reduce the set's footprint by more than 50%.
However, no strings can be added or deleted without first undoing the compaction (this is done automatically).
Compaction is relatively expensive, but can be a one-time or ahead-of-time step for many use cases.

### Serialization

A common use case is to match user input against a fixed set of strings.
For example, checking input against a spelling dictionary or suggesting completions for partial input.
In such cases it is often desirable to build a set ahead of time, serialize it to a buffer, and then save the buffer data on a server to downloaded when needed.
Recreating a set directly from buffer data is generally much faster than downloading a file containing the strings and adding them to a new set on the client.

The following steps will make such ahead-of-time sets as small as possible:

1. Create a set and insert the desired strings using `add` or `addAll`.
2. Minimize the tree size by calling `balance` followed by `compact`.
3. Create the buffer with `toBuffer` and write the result to a file.
4. Optionally, compress the result and configure the server to serve the compressed version where supported by the browser.

To recreate the set, download or otherwise obtain the buffer data, then use `TernaryStringSet.fromBuffer(data)`.

## Developing

Building from source requires Node.js.
Clone the repository, then install development dependencies:

```bash
npm install
```

The TypeScript source is found under `src`.
Compiled output is written to `lib`. To build the project:

```bash
npm run build
```

The included `tsconfig.json` targets ES2020.
To target old JavaScript engines or browsers you will need to modify this configuration and/or use a tool like Babel.

The project includes an extensive suite of tests under `src/tests`.
To run all tests:

```bash
npm test
```

HTML documentation can be prepared automatically using TypeDoc:

```bash
npm run doc
```

Before submitting a pull request, format, lint, and run all tests:

```bash
npm run format && npm run lint && npm test
```

## Serialization format

This section describes the binary format used to serialize a `TernaryStringSet`.
Serialized data consists of a stream of unsigned integers of 8, 16, 24, or 32 bits.
In the remaining sections, these are indicated by the notation int8, int32, and so on.
Integers wider than 1 byte are stored in
[big-endian order](https://en.wikipedia.org/wiki/Endianness).
For brevity, the serialized data is described as a "file", but the data could come from any container or stream of bytes.

### Header

The file begins with an 8 byte header consisting of:

**Magic (int16)**  
A magic number identifying the file format.
This must be 0x5454 (`TT`) if the file is valid.

**Version (int8)**  
Indicates the version of the format.
Valid values are currently 1, 2, or 3.
A value of 0 implies that the file is not valid.
Other values would indicate newer versions of the format.

**Tree flags (int8)**  
A set of bit flags that denote specific features:

| Bits | Description |
| ---: | ----------- |
| 0    | Set if the set *contains the empty string*. |
| 1    | Set if the tree nodes are *compact*, meaning that common suffixes share nodes. |
| 2    | Only in version 2 files. Set if 16-bit branches were used. |
| 3–7  | Reserved for future use. |

**Size (int32)**  
The number of strings in the set, including the empty string if present.

### Tree data

The remaining bytes encode the tree structure.
The format closely follows that used internally by `TernaryStringSet`s, which was already chosen for compactness.
This format consists of an array of integers, with each tree node represented by 4 integers in sequence: one for the code point and flags, and three for pointers (array offsets) to each of the less-than, equal-to, and greater-than branches, respectively.
The node starting at index 0 is the tree root.

The file format also follows this basic structure:
Elements of the original array are written out in order, but they may be represented by a variable number of bytes.
Before each node, a single byte is written whose bits describe how each of the node's four elements are encoded:

| Bits | Describe |
| ---: | --------- |
| 6–7  | how the code point and flags are encoded |
| 4–5  | how the less-than branch is encoded |
| 2–3  | how the equal-to branch is encoded |
| 0–1  | how the greater-than branch is encoded |

Depending on the values of these fields, the node will require 1–16 bytes, including this encoding byte.

#### Code point and flags

Valid code points are up to 21 bits long.
In addition, a 22nd bit is used to indicate that the node terminates a string in the tree.
Depending on the magnitude of the code point, this data is written in 0–3 bytes as determined by bits 6–7 of the encoding byte:

| Bits | Code point     | Written as |
| ---: | -------------- | ---------- |
| 00   | ≥ 32768 | int24 |
| 01   | 128–32767 | int16 |
| 10   | ≤ 127 | int8 |
| 11   | 101 (`e`) | 0 bytes |

**Encoding bits 00: code point ≥ 32768**  
Large code points are written as an int24 value.
The lowest 21 bits store the code point.
The 22nd bit is set if the node terminates a string.
The highest two bits must be 0.

> For practical purposes, this can be treated as an int32 value in which the highest 8 bits are the node's encoding byte.

**Encoding bits 01: code point in 128 to 32767**  
Code points in this range are written as an int16 value.
The lowest 15 bits store the code point and the highest bit is set if the node terminates a string.

**Encoding bits 10: code point ≤ 127**  
Small code points are written as a single int8 value.
The lowest 7 bits store the code point and the highest bit is set if the node terminates a string.

**Encoding bits 11: letter "e"**  
As a special case, if the code point is exactly 0x65 (the letter "e") *and* the node *does not* terminate a string, no bytes are written for the code point.

#### Branch pointers

In the `TernaryStringSet`, a branch pointer is either the special NUL value 0x7fffffff, or a smaller value that is an offset into the array at which the target node's data starts.
A NUL pointer is written in 0 bytes.
Otherwise the pointer is divided by 4 and then written as follows:

| Bits | Pointer/4   | Written as |
| ---: | ----------- | ---------- |
| 00   | > 0xffffff  | int32 |
| 01   | > 0xffff    | int24 |
| 10   | ≤ 0xffff    | int16 |
| 11   | NUL pointer | 0 bytes |

#### Example

Suppose the node to be written consists of the sequential elements `[0x41, 0x7fffffff, 0x42, 0x6789]`, meaning:

 - The node's code point is 0x41 (the letter "A"), and since bit 21 is not set, this node does not terminate a string.
 - The node's less-than branch is NUL.
 - The node's equal-to branch points to offset 0x42.
 - The node's greater-than branch points to offset 0x6789.

 The following bytes would be written to the output file:

| Byte | Value | Explanation |
| ---: | ----- | ----------- |
| 0 | 0b10111010 | Encoding field: int8 code point, NUL less-than, int16 equal-to and greater-than |
| 1 | 0x41 | Code point for "A", termination bit not set |
| 2 | 0x00 | Equal-to branch high byte |
| 3 | 0x42 | Equal-to branch low byte |
| 4 | 0x67 | Greater-than branch high byte |
| 5 | 0x89 | Greater-than branch low byte |

## Versions 1 and 2

The current version of the file format is 3. Version 1 and 2 files differ in the following ways:

1. In version 1 files, the header `size` field stores the number of nodes rather than the set size.
(The size can be calculated by iterating over the node data.)
2. The node data is written as a sequence of int32 values.
For each node, an int32 is written for each of the node value and three branch pointers.
Pointers are *not* divided by 4.
3. In version 2 files, the *16-bit branch* tree flag may be set.
In this case, *all* branch pointers are int16 values instead of int32 values; 0xffff indicates NUL.