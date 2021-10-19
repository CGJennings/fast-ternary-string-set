# Fast ternary string set

![CI status badge](https://github.com/CGJennings/fast-ternary-string-set/actions/workflows/ci.yml/badge.svg)

A fast, space-efficient, serializable string set based on ternary search trees, with both exact and approximate membership tests.

[API Docs](https://cgjennings.github.io/fast-ternary-string-set/classes/TernaryStringSet.html)

## Features

 - Drop-in replacement for nearly any use of a [JavaScript `Set`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set) of strings.
 - Search and iteration methods return elements in ascending sorted (lexicographic) order.
 - Set relations (equality, subset, superset) and operations (union, intersection, difference, symmetric difference).
 - Several approximate matching methods:
   1. List strings that complete a prefix.
   2. List strings that can be made from a list of letters.
   3. List strings that match a pattern including "don't care" letters (as `.` in a regular expression).
   4. List strings within a certain [Hamming distance](https://en.wikipedia.org/wiki/Hamming_distance) of a pattern.
 - Serialize sets to and from an `ArrayBuffer`.
 - Time and space efficient:
   - Leverages common JS engine optimizations under the hood.
   - Elements share tree nodes and do not retain references to the original strings.
   - Read-only sets can be *compacted* to save even more space.
 - Well-documented TypeScript source, targeting modern JavaScript by default.
 - Backed by extensive test suites.
 - Use as a standalone/ECMAScript module or as a Node.js/CommonJS module.
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

[Complete API docs are available.](https://cgjennings.github.io/fast-ternary-string-set/classes/TernaryStringSet.html) Here are some examples of common tasks to get you started:

Loading the module:

```js
// From node with CommonJS-style modules:
const { TernaryStringSet } = require("fast-ternary-string-set");
// From TypeScript:
import { TernaryStringSet } from "fast-ternary-string-set";
```

Create a new set and add some strings:

```js
const set = new TernaryStringSet();
set.add("dog").add("cat").add("eagle");
// or alternatively
set.addAll(["aardvark", "beaver", "dog", "fish", "hamster"]);
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
// or even another TernaryStringSet
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
// => ["bat", "can", "cap", "cat", "cot", "sat"] (for example)
```

Get all elements that match `"b.t"`:

```js
set.getPartialMatchesOf("b.t");
// => ["bat", "bet", "bit", "bot", "but"] (for example)
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
const toCheck = "In a time long past lived a cat named Captain Peanut."
toCheck.toLowerCase().split(/\W+/).forEach((word) => {
    if (!dict.has(word)) {
        console.log(`misspelled: ${word}`);
    }
});
```

## Usage notes

### Differences from standard JS `Set`

`TernaryStringSet` supports a superset of the standard `Set` interface, but it is not a subclass of `Set`.

JavaScript `Set` objects guarantee that they iterate over elements in the order that they are added.
`TernaryStringSet`s always return results in sorted order.

`TernaryStringSet`s can contain the empty string, but cannot contain non-strings. Not even `null` or `undefined`.

### Tree quality

Adding strings in sorted order produces a worst-case tree structure. This can be avoided by adding strings all at once using the constructor or `addAll()`. Given sorted input, both of these methods will produce an optimal tree structure. If this is not practical, adding strings in random order usually yields a near-optimal tree. Calling `balance()` will rebuild the tree in optimal form, but it can be expensive.

Similarly, after deleting a large number of strings, future search performance may be improved by calling `balance()`.

Since most `TernaryStringSet` methods are recursive, extremely unbalanced trees can provoke "maximum call stack size exceeded" errors.

### Matching by code point

Some Unicode code points span two characters (char codes) in a JavaScript string. For example, the musical symbol 𝄞, code point U+1D11E, can be assigned to a JavaScript string as follows:

```js
const clefG = "\ud834\udd1e";
```

Even though it represents a single symbol, the above string has a length of two. To avoid surprises, `TernaryStringSet` matches by code point, not by char code. For example, since the above string is one code point, it would match `getPartialMatchesOf(".")` and not `getPartialMatchesOf("..")`.

### Compaction

Calling `compact()` can significantly reduce a set's memory footprint. For large sets of typical strings, this can reduce the set's footprint by 50–80%. However, no new strings can be added or deleted without first undoing the compaction. Compaction is relatively expensive, but can be a one-time or even ahead-of-time step for many use cases.

### Serialization

A common use case is to match user input against a fixed set of strings. For example, checking input against a spelling dictionary or suggesting completions for partial input. In such cases it is often desirable to build a set ahead of time, serialize it to a buffer, and then save the buffer data on a server where it can be downloaded as needed. Recreating a set directly from buffer data is much faster than downloading a file containing the strings and inserting them into a new set on the client.

The following steps will make such ahead-of-time sets as small as possible:

1. Create a set and insert the desired strings using `add()` or `addAll()`.
2. Minimize the tree size by calling `balance()` followed by `compact()`.
3. Create the buffer with `toBuffer()` and write the result to a file.
4. Optionally, compress the result and configure the server to serve the compressed version where supported by the browser.

To recreate the set, download or otherwise obtain the buffer data, then use `TernaryTreeSet.fromBuffer(data)`.

## Developing

Building from source requires Node.js. Clone the repository, then install development dependencies:

```bash
npm install
```

The TypeScript source is found under `src`. Compiled output is written to `lib`. To build the project:

```bash
npm run build
```

The included `tsconfig.json` targets ES2015 (ES6). To target old JavaScript engines or browsers you will need to modify this configuration and/or use a tool like Babel.

The project includes an extensive suite of tests under `src/tests`. To run all tests:

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

The methods `toBuffer()` and `fromBuffer()` serialize a set to and from a compact binary form. This section describes the format used.

Serialized data consists of a stream of unsigned integers of 8, 16, 24, or 32 bits.
In the remaining sections, these are indicated by the notation int8, int32, and so on.
Integers wider than 1 byte are stored in
[big-endian order](https://en.wikipedia.org/wiki/Endianness).

### Header

The buffer starts with an 8-byte header consisting of the following:

**`magic` int16**  
This is a magic value, 0x5454, used to help verify that the buffer is valid.
Data that does not start with this value is not a valid tree buffer.

**`version` int8**  
Indicates the version of the format. Valid values are 1, 2, or 3. A value of 0
indicates that this is not a valid tree buffer. Other values indicate newer
versions of the format specification.

**`treeFlags` int8**  
A set of bit flags that denote specific features:

- Bit 0 is set if the set *contains the empty string*, and unset otherwise.
- Bit 1 is set if the tree data is *compact* meaning that common suffixes share nodes.
- Bit 2 is unset in version 3 files. It indicates the use of 16-bit branches in version 2 files.
- Bits 3-7 are reserved and **must** be unset.

**`size` int32**  
Indicates the number of strings in the set, including the empty string if present.

### Tree data

The remaining bytes encode the structure of the tree.
The format closely follows the internal format used by the implementation,
which was already chosen for its compactness.
The internal format consists of an array of integers,
with each node represented by 4 integers in sequence: one for the code point and flags,
and three for pointers (array offsets) to each of the less-than, equal-to, and
greater-than branches, respectively. The node starting at index 0 is the tree root.

The buffer format also follows this basic structure. Each node in the original array is 
written out in the same order that it appears in the internal array.

Nodes are encoded using a variable number of bytes.
The first byte written for each node consists of 4 fields, each of which is 2 bits.
These bit fields describe how each of the 4 node properties will be encoded:

- Bits 6-7 describe how the code point and flags are encoded.
- Bits 4-5 describe how the less-than branch is encoded.
- Bits 3-2 describe how the equal-to branch is encoded.
- Bits 1-0 describe how the greater-than branch is encoded.

Depending on the values of these fields, a node can require between 1 and 16 bytes, including the encoding byte.

#### Code point encoding

Valid code points are up to 21 bits long. In addition, a 22nd bit is used to indicate that
this node also terminates a string in the tree. Depending on the magnitude of the code
point (cp), this data is written in 0-3 bytes:

**Encoding 00 - cp > 32767**
Large code points are written as an int24 value. The lowest 21 bits store the code
point. The 22nd bit is set if the node terminates a string. The highest two bits must be 0.
For practical purposes, this can be treated as an int32 value in which the highest 8 bits
are the node's encoding bit fields.

**Encoding 01 - cp ≤ 32767**  
If the code point is 32767 (0x7fff) or less, then it can be written as an int16 value.
The high bit is set if the node terminates a string.

**Encoding 10 - cp ≤ 127**  
If the code point is 127 (0x7f) or less, then it can be written as an int8 value.
The high bit is set if the node terminates a string.

**Encoding 11 - letter "e"**  
As a special case, if the code point is exactly 0x65 (the letter "e") *and* the node
*does not* terminate a string, no bytes are written for the code point.

#### Branch pointer encoding

A branch pointer is either the special NUL value 0x7fffffff, or a smaller value that is an
offset into the array at which the target node's data starts.

**Encoding 11 - NUL**  
If the branch pointer is NUL, it is indicated by this encoding value: no bytes
are written to store the pointer.

Otherwise, if the pointer is not NUL, its offset is divided by 4 and then it is written
in one of the following ways, depending on its magnitude:

**Encoding 00 - pointer/4 > 0xffff**  
The value of pointer/4 is written as an int32.

**Encoding 01 - pointer/4 > 0xff**  
The value of pointer/4 is written as an int16.

**Encoding 10 - pointer/4 ≤ 0xff**  
The value of pointer/4 is written as an int8.

## Versions 1 and 2

The current version of the file format is 3. Version 1 and 2 files differ in the following ways:

1. In version 1 files, the header `size` field stores the number of nodes rather than the
   set size. (The size can be calculated by iterating over the node data.)
2. The node data is written as a sequence of int32 values. For each node, an
   int32 is written for each of the node value and three branch pointers.
   Pointers are *not* divided by 4.
3. In version 2 files, the *16-bit branches* flag may be set. In this case, *all* branch
   pointers are int16 values instead of int32 values; 0xffff indicates NUL.