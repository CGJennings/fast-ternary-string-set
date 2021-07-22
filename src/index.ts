/** Node index indicating that no node is present. */
const NUL = ~(1 << 31);
/** First node index that would run off of the end of the array. */
const NODE_CEILING = NUL - 3;
/** End-of-word flag: set on node values when that node also marks the end of a word. */
const EOW = 1 << 21;
/** Mask to extract the code point from a node value, ignoring flags. */
const CP_MASK = EOW - 1;
/** Smallest code point that requires a surrogate pair. */
const CP_MIN_SURROGATE = 0x10000;
/** Version number for the data buffer format. */
const BUFFER_VERSION = 1;
/** Magic number used by buffer data format. */
const BUFFER_MAGIC = 84;
/** Buffer format header size (4 bytes magic/properties + 4 bytes node count). */
const BUFFER_HEAD_SIZE = 8;

/**
 * A sorted string set that implements a superset of the standard JS `Set` interface.
 * Supports approximate matching and allows serialization to/from a binary format.
 *
 * The string set can store any valid Unicode string, including the empty
 * string, strings that include characters from the supplementary (or "astral")
 * planes, and so on. Strings with code points beyond last Unicode code point,
 * U+10FFFF, are *not* supported.
 *
 * Strings are stored using a *ternary search tree*, which has excellent performance
 * characteristics when properly constructed. However, it is important to avoid adding
 * strings in sorted order for best performance.
 */
export class TernaryStringSet implements Set<string>, Iterable<string> {
  /**
   * Tree data, an integer array laid out as follows:
   *
   * 1. `tree[n]`: code point of the character stored in this node, plus bit flags
   * 2. `tree[n+1]`: array index of the "less than" branch's child node
   * 3. `tree[n+2]`: array index of the "equal to" branch's child node
   * 4. `tree[n+3]`: array index of the "greater than" branch's child node
   *
   * Most modern JS engines optimize arrays that contain only 32-bit integers, meaning that
   * this structure is likely to be more efficient than an equivalent tree based on
   * linked objects.
   */
  #tree: number[];
  /** Tracks whether empty string is in the set as a special case. */
  #hasEmpty: boolean;

  /** Creates a new, empty tree set. */
  constructor() {
    this.clear();
  }

  /** Removes all strings in this set. */
  clear(): void {
    this.#tree = [];
    this.#hasEmpty = false;
  }

  /**
   * Adds a string to this set. The string can be empty, but cannot be null.
   * Adding a string that is already in this set has no effect.
   * If inserting multiple strings in sorted (lexicographic) order, prefer
   * `addAll` over this method.
   *
   * @param s The non-null string to add.
   * @returns This set, allowing chained calls.
   * @throws TypeError If the argument is not a string.
   */
  add(s: string): this {
    if (typeof s !== "string") {
      if (!((s as unknown) instanceof String)) {
        throw new TypeError("not a string: " + s);
      }
      s = String(s);
    }
    if (s.length === 0) {
      this.#hasEmpty = true;
    } else {
      this.addImpl(0, s, 0, s.codePointAt(0));
    }
    return this;
  }

  private addImpl(node: number, s: string, i: number, cp: number): number {
    const tree = this.#tree;

    if (node >= tree.length) {
      node = tree.length;
      if (node >= NODE_CEILING) {
        throw new RangeError("cannot add more strings");
      }
      tree.push(cp, NUL, NUL, NUL);
    }

    const treeCp = tree[node] & CP_MASK;
    if (cp < treeCp) {
      tree[node + 1] = this.addImpl(tree[node + 1], s, i, cp);
    } else if (cp > treeCp) {
      tree[node + 3] = this.addImpl(tree[node + 3], s, i, cp);
    } else {
      i += cp >= CP_MIN_SURROGATE ? 2 : 1;
      if (i >= s.length) {
        tree[node] |= EOW;
      } else {
        tree[node + 2] = this.addImpl(tree[node + 2], s, i, s.codePointAt(i));
      }
    }

    return node;
  }

  /**
   * Adds an entire array, or subarray, of strings to this set.
   *
   * If the array is sorted in ascending order and no other strings have been
   * added to this set, the underlying tree is guaranteed to be balanced, ensuring
   * good search performance. If the array is in random order, the tree is *likely*
   * to be nearly balanced.
   *
   * @param strings The non-null array of strings to add.
   * @param start The index of the first element to add (inclusive, default is 0).
   * @param end The index of the last element to add (exclusive, default is `strings.length`)
   */
  addAll(strings: string[], start = 0, end?: number): void {
    if (strings == null) throw new ReferenceError("null strings");
    if (end === undefined) end = strings.length;

    if (--end < start) return;

    // if the tree is empty and the list is sorted, this insertion
    // order ensures a balanced tree (inserting words in sorted order
    // is a degenerate case)
    const mid = Math.floor(start + (end - start) / 2);
    this.add(strings[mid]);
    this.addAll(strings, start, mid);
    this.addAll(strings, mid + 1, end + 1);
  }

  /**
   * Returns whether this set contains the specified string. If passed a non-string value,
   * returns false.
   *
   * @param s The non-null string to test for.
   * @returns True if the string is present.
   */
  /* eslint-disable @typescript-eslint/no-explicit-any */
  has(s: any): boolean {
    if (typeof s !== "string") {
      if (!(s instanceof String)) {
        return false;
      }
      s = String(s);
    }
    if (s.length === 0) return this.#hasEmpty;

    return this.hasImpl(0, s, 0, s.codePointAt(0));
  }

  private hasImpl(node: number, s: string, i: number, cp: number): boolean {
    const tree = this.#tree;

    if (node >= tree.length) return false;

    const treeCp = tree[node] & CP_MASK;
    if (cp < treeCp) {
      return this.hasImpl(tree[node + 1], s, i, cp);
    } else if (cp > treeCp) {
      return this.hasImpl(tree[node + 3], s, i, cp);
    } else {
      i += cp >= CP_MIN_SURROGATE ? 2 : 1;
      if (i >= s.length) {
        return (tree[node] & EOW) === EOW;
      } else {
        return this.hasImpl(tree[node + 2], s, i, s.codePointAt(i));
      }
    }
  }

  /**
   * Removes the specified string from this set, if it is present.
   * If it is not present, this has no effect.
   *
   * @param s The non-null string to delete.
   * @returns True if the string was in this set; false otherwise.
   */
  /* eslint-disable @typescript-eslint/no-explicit-any */
  delete(s: any): boolean {
    if (typeof s !== "string") {
      if (!(s instanceof String)) {
        return false;
      }
      s = String(s);
    }
    if (s.length === 0) {
      const had = this.#hasEmpty;
      this.#hasEmpty = false;
      return had;
    }

    return this.deleteImpl(0, s, 0, s.codePointAt(0));
  }

  private deleteImpl(node: number, s: string, i: number, cp: number): boolean {
    const tree = this.#tree;

    if (node >= tree.length) return false;

    const treeCp = tree[node] & CP_MASK;
    if (cp < treeCp) {
      return this.deleteImpl(tree[node + 1], s, i, cp);
    } else if (cp > treeCp) {
      return this.deleteImpl(tree[node + 3], s, i, cp);
    } else {
      i += cp >= CP_MIN_SURROGATE ? 2 : 1;
      if (i >= s.length) {
        const had = (tree[node] & EOW) === EOW;
        tree[node] = tree[node] & CP_MASK;
        return had;
      } else {
        return this.deleteImpl(tree[node + 2], s, i, s.codePointAt(i));
      }
    }
  }

  /**
   * Returns all strings in this set that can be composed from combinations of the characters
   * in the specified string. Unlike an anagram, not all pattern characters need to appear for a match
   * to count. For example, the pattern `"coat"` can match `"cat"` even though the *o* is not used.
   * However, characters cannot appear *more often* than they appear in the pattern string. The same
   * pattern `"coat"` cannot match `"tot"` since it includes only a single *t*.
   *
   * If this set contains the empty string, it is always included in results from this
   * method.
   *
   * @param charPattern The non-null pattern string.
   * @returns A (possibly empty) array of strings from the set that can be composed from the
   *     pattern characters.
   */
  getArrangementsOf(charPattern: string): string[] {
    if (charPattern == null) throw new ReferenceError("null charPattern");
    charPattern = String(charPattern);

    // availChars[codePoint] = how many times codePoint is in pattern
    const availChars: number[] = [];
    for (let i = 0; i < charPattern.length; ) {
      const cp = charPattern.codePointAt(i++);
      if (cp >= CP_MIN_SURROGATE) ++i;
      availChars[cp] = availChars[cp] ? availChars[cp] + 1 : 1;
    }

    const words: string[] = [];
    if (this.#hasEmpty) words[0] = "";
    this.getArrangementsOfImpl(0, availChars, [], words);
    return words;
  }

  private getArrangementsOfImpl(
    node: number,
    availChars: number[],
    prefix: number[],
    words: string[],
  ) {
    const tree = this.#tree;
    if (node >= tree.length) return false;

    this.getArrangementsOfImpl(tree[node + 1], availChars, prefix, words);

    const cp = tree[node] & CP_MASK;
    if (availChars[cp] > 0) {
      --availChars[cp];
      prefix.push(cp);
      if (tree[node] & EOW) {
        words.push(String.fromCharCode(...prefix));
      }
      this.getArrangementsOfImpl(tree[node + 2], availChars, prefix, words);
      prefix.pop();
      ++availChars[cp];
    }

    this.getArrangementsOfImpl(tree[node + 3], availChars, prefix, words);
  }

  /**
   * Returns all strings that match the pattern. The pattern may include zero or
   * more "don't care" characters that can match any code point. By default this
   * character is `"."`, but any valid code point can be used. For example, the
   * pattern `"c.t"` would match any of `"cat"`, `"cot"`, or `"cut"`, but not `"cup"`.
   *
   * @param pattern A pattern string matched against the strings in the set.
   * @param dontCareChar The character that can stand in for any character in the pattern.
   *     Only the first code point is used. (Default is `"."`.)
   * @returns A (possibly empty) array of strings that match the pattern string.
   */
  getPartialMatchesOf(pattern: string, dontCareChar = "."): string[] {
    if (pattern == null) throw new ReferenceError("null pattern");
    if (dontCareChar == null) throw new ReferenceError("null dontCareChar");

    pattern = String(pattern);
    dontCareChar = String(dontCareChar);

    if (dontCareChar.length === 0) throw new TypeError("empty dontCareChar");

    if (pattern.length === 0) {
      return this.#hasEmpty ? [""] : [];
    }

    const matches: string[] = [];
    this.getPartialMatchesOfImpl(
      0,
      pattern,
      0,
      dontCareChar.codePointAt(0),
      [],
      matches,
    );
    return matches;
  }

  private getPartialMatchesOfImpl(
    node: number,
    pattern: string,
    i: number,
    dc: number,
    prefix: number[],
    matches: string[],
  ) {
    const tree = this.#tree;
    if (node >= tree.length) return;

    const cp = pattern.codePointAt(i);
    const treeCp = tree[node] & CP_MASK;
    if (cp < treeCp || cp === dc) {
      this.getPartialMatchesOfImpl(
        tree[node + 1],
        pattern,
        i,
        dc,
        prefix,
        matches,
      );
    }
    if (cp === treeCp || cp === dc) {
      const i_ = i + (cp >= CP_MIN_SURROGATE ? 2 : 1);
      prefix.push(treeCp);
      if (i_ >= pattern.length) {
        if (tree[node] & EOW) {
          matches.push(String.fromCodePoint(...prefix));
        }
      } else {
        this.getPartialMatchesOfImpl(
          tree[node + 2],
          pattern,
          i_,
          dc,
          prefix,
          matches,
        );
      }
      prefix.pop();
    }
    if (cp > treeCp || cp === dc) {
      this.getPartialMatchesOfImpl(
        tree[node + 3],
        pattern,
        i,
        dc,
        prefix,
        matches,
      );
    }
  }

  /**
   * Returns an array of all strings in the set that are within the specified Hamming distance
   * of the given pattern string. A string is within Hamming distance *n* of the pattern if at
   * most *n* of its code points are different from those of the pattern. For example:
   *  - `cat` is Hamming distance 0 from itself;
   *  - `cot` is Hamming distance 1 from `cat`;
   *  - `cop` is Hamming distance 2 from `cat`; and
   *  - `top` is Hamming distance 3 from `cat`.
   *
   * @param pattern A pattern string matched against the strings in the set.
   * @param distance The maximum number of code point deviations to allow from the pattern string.
   * @returns A (possibly empty) array of strings from the set that match the pattern.
   */
  getWithinHammingDistanceOf(pattern: string, distance: number): string[] {
    if (pattern == null) throw new ReferenceError("null pattern");

    pattern = String(pattern);
    distance = Math.max(0, Math.floor(Number(distance)));
    if (distance !== distance) throw new TypeError("distance must be a number");

    // only the string itself is within distance 0 or matches empty pattern
    if (distance < 1 || pattern.length === 0) {
      return this.has(pattern) ? [pattern] : [];
    }

    const matches: string[] = [];

    // optimize cases where any string the same length as the pattern will match
    if (distance >= pattern.length) {
      this.visitWords(0, [], (prefix) => {
        if (prefix.length === pattern.length) {
          matches.push(String.fromCodePoint(...prefix));
        }
      });
      return matches;
    }

    this.getWithinHammingDistanceOfImpl(0, pattern, 0, distance, [], matches);
    return matches;
  }

  private getWithinHammingDistanceOfImpl(
    node: number,
    pattern: string,
    i: number,
    dist: number,
    prefix: number[],
    matches: string[],
  ) {
    const tree = this.#tree;
    if (node >= tree.length || dist < 0) return;

    const cp = pattern.codePointAt(i);
    const treeCp = tree[node] & CP_MASK;
    if (cp < treeCp || dist > 0) {
      this.getWithinHammingDistanceOfImpl(
        tree[node + 1],
        pattern,
        i,
        dist,
        prefix,
        matches,
      );
    }

    prefix.push(treeCp);
    if (tree[node] & EOW && pattern.length === prefix.length) {
      if (dist > 0 || cp === treeCp) {
        matches.push(String.fromCodePoint(...prefix));
      }
      // no need to recurse, children of this equals branch are too long
    } else {
      const i_ = i + (cp >= CP_MIN_SURROGATE ? 2 : 1);
      const dist_ = dist - (cp === treeCp ? 0 : 1);
      this.getWithinHammingDistanceOfImpl(
        tree[node + 2],
        pattern,
        i_,
        dist_,
        prefix,
        matches,
      );
    }
    prefix.pop();

    if (cp > treeCp || dist > 0) {
      this.getWithinHammingDistanceOfImpl(
        tree[node + 3],
        pattern,
        i,
        dist,
        prefix,
        matches,
      );
    }
  }

  /**
   * Calls the specified callback function once for each string in this set, passing the string
   * and this set. The string is passed as both value and key, to match the behaviour of `Map.forEach`.
   * If `thisArg` is specified, it is used as `this` when invoking the callback function.
   *
   * @param callbackFn The function to call for each string.
   * @param thisArg Optional value to use as `this` when calling the function.
   */
  forEach(
    callbackFn: (value: string, key: string, set: TernaryStringSet) => void,
    thisArg?: unknown,
  ): void {
    let thiz: unknown;
    if (arguments.length >= 2) thiz = thisArg;

    this.visitWords(0, [], (prefix) => {
      const s = String.fromCodePoint(...prefix);
      callbackFn.call(thiz, s, s, this);
    });
  }

  /**
   * Returns an iterator over the strings in this set.
   * This is included for compatibilty with Sets and Maps; it is equivalent to `values()`.
   *
   * **Note:** Unlike standard `Set`s, this set's values are returned in ascending
   * lexicographic order, *not* the order in which items were added.
   *
   * @returns An non-null iterator over the strings in this set.
   */
  keys(): IterableIterator<string> {
    return this.values();
  }

  /**
   * Returns an iterator over the strings in this set.
   *
   * **Note:** Unlike standard `Set`s, this set's values are returned in ascending
   * lexicographic order, *not* the order in which items were added.
   *
   * @returns An non-null iterator over the strings in this set.
   */
  values(): IterableIterator<string> {
    const tree = this.#tree;
    function* itor(node: number, prefix: number[]): Generator<string> {
      if (node >= tree.length) return;
      yield* itor(tree[node + 1], prefix);
      prefix.push(tree[node] & CP_MASK);
      if (tree[node] & EOW) yield String.fromCodePoint(...prefix);
      yield* itor(tree[node + 2], prefix);
      prefix.pop();
      yield* itor(tree[node + 3], prefix);
    }
    return itor(0, []);
  }

  /**
   * Returns an iterator over the entries in this set, for compatibility with Map objects.
   * The result is the same as that of `values()` except that each string is wrapped in
   * an array and repeated twice.
   *
   * **Note:** Unlike standard `Set`s, this set's values are returned in ascending
   * lexicographic order, *not* the order in which items were added.
   *
   * @returns An iterator over the key-value pairs in this set,
   *     with each value acting as its own key.
   */
  entries(): IterableIterator<[string, string]> {
    const it = this.values();
    return (function* (): IterableIterator<[string, string]> {
      let next = it.next();
      while (!next.done) {
        yield [next.value, next.value];
        next = it.next();
      }
    })();
  }

  /**
   * Returns an iterator over the strings in this set, in ascending lexicographic order.
   * This allows this tree set to be used in `for...of` loops.
   *
   * @returns An non-null iterator over the strings in this set.
   */
  [Symbol.iterator](): IterableIterator<string> {
    return this.values();
  }

  /**
   * Returns the string tag used by `Object.prototype.toString()` for this class.
   */
  get [Symbol.toStringTag](): string {
    return this.constructor.name;
  }

  private visitWords(
    node: number,
    prefix: number[],
    visitFn: (prefix: number[]) => unknown,
  ) {
    const tree = this.#tree;
    if (node >= tree.length) return;
    this.visitWords(tree[node + 1], prefix, visitFn);
    prefix.push(tree[node] & CP_MASK);
    if (tree[node] & EOW) visitFn(prefix);
    this.visitWords(tree[node + 2], prefix, visitFn);
    prefix.pop();
    this.visitWords(tree[node + 3], prefix, visitFn);
  }

  private visitNodes(
    node: number,
    depth: number,
    visitFn: (node: number, depth: number) => unknown,
  ) {
    const tree = this.#tree;
    if (node >= tree.length) return;
    visitFn(node, depth);
    this.visitNodes(tree[node + 1], depth + 1, visitFn);
    this.visitNodes(tree[node + 2], depth + 1, visitFn);
    this.visitNodes(tree[node + 3], depth + 1, visitFn);
  }

  /**
   * Returns the number of unique strings stored in the tree.
   *
   * @returns The non-negative integer number of string elements in the tree.
   */
  get size(): number {
    const tree = this.#tree;
    let n = this.#hasEmpty ? 1 : 0;
    for (let i = 0; i < tree.length; i += 4) {
      if (tree[i] & EOW) ++n;
    }
    return n;
  }

  /**
   * Returns technical statistics about this set's underlying tree structure.
   * Advanced users can use this to estimate the memory used by the set,
   * judge the impact of one or more operations on the tree structure,
   * and make more informed decisions about whether to balance the tree.
   */
  get stats(): TernaryTreeStats {
    let size = this.#hasEmpty ? 1 : 0;
    let depth = 0;
    let surrogates = 0;
    this.visitNodes(0, 1, (n, d) => {
      depth = Math.max(d, depth);
      const cp = this.#tree[n];
      if (cp & EOW) ++size;
      if ((cp & CP_MASK) >= CP_MIN_SURROGATE) ++surrogates;
    });
    return {
      depth,
      nodes: this.#tree.length / 4,
      size,
      surrogates,
    };
  }

  /**
   * Optimizes the layout of the underlying data structure to maximize search speed.
   * This may improve future search performance after adding or deleting a large
   * number of strings.
   *
   * It is not normally necessary to call this method. However, there are scenarios
   * where it may be effective:
   *  - If the set will be used in phases, with strings being added in the first phase
   *    followed by an extensive phase of search operations.
   *  - If the string is about to be converted into a buffer for future use.
   *
   * As stated under `addAll`, if the entire contents of the set are defined by a single
   * call to `addAll` using a sorted set, the resulting tree will already be balanced.
   * If the only strings added to the set came from a single call to `addAll` and
   * those strings were stored in lexicographic order, then the data structure is
   * already in optimal form.
   */
  balance(): void {
    const temp = new TernaryStringSet();
    temp.addAll(Array.from(this));
    this.#tree = temp.#tree;
  }

  /**
   * Returns a byte buffer whose contents can be used to recreate this set.
   * The returned data is independent of the platform on which it is created.
   *
   * @returns A non-null buffer.
   */
  toBuffer(): ArrayBuffer {
    const tree = this.#tree;

    // allocate space for header + node count + tree nodes
    const buffer = new ArrayBuffer(BUFFER_HEAD_SIZE + this.#tree.length * 4);
    const view = new DataView(buffer);
    // first two bytes are magic "TT" for ternary tree
    view.setInt8(0, BUFFER_MAGIC);
    view.setInt8(1, BUFFER_MAGIC);
    // third byte is version number
    view.setInt8(2, BUFFER_VERSION);
    // fourth byte tracks presence of empty string
    view.setInt8(3, this.#hasEmpty ? 1 : 0);

    // fifth though eigth bytes store number of nodes as a check
    view.setInt32(4, tree.length, false);

    // remainder of buffer stores tree content
    for (let i = 0, byte = BUFFER_HEAD_SIZE; i < tree.length; ++i, byte += 4) {
      view.setInt32(byte, tree[i], false);
    }

    return buffer;
  }

  /**
   * Creates a new string set from data in a buffer previously created with `toBuffer`.
   *
   * @param buffer The buffer to recreate the set from.
   * @returns A set recreating the original set stored in the buffer.
   * @throws `ReferenceError` If the specified buffer is null.
   * @throws `TypeError` If the buffer data is invalid or from an unsupported version.
   */
  static fromBuffer(buffer: ArrayBuffer): TernaryStringSet {
    if (buffer == null) {
      throw new ReferenceError("null buffer");
    }

    const view = new DataView(buffer);

    // verify that this appears to be valid tree data
    // and that the version of the format is supported
    if ((view.byteLength & 3) !== 0) {
      throw new TypeError("bad data (length)");
    }
    if (view.getInt8(0) !== BUFFER_MAGIC || view.getInt8(1) !== BUFFER_MAGIC) {
      throw new TypeError("bad data (magic bytes)");
    }
    if (view.getInt8(2) < 1) {
      throw new TypeError("bad data (version byte)");
    }
    if (view.getInt8(2) > BUFFER_VERSION) {
      throw new TypeError(
        `unsupported version: ${view.getInt8(2)} > ${BUFFER_VERSION}`,
      );
    }
    if (view.getInt8(3) !== 0 && view.getInt8(3) !== 1) {
      throw new TypeError("bad data (bad tree properties)");
    }
    const expectedLength = BUFFER_HEAD_SIZE + view.getInt32(4, false) * 4;
    if (view.byteLength < expectedLength) {
      throw new TypeError("bad data (missing bytes)");
    }

    const newTree = new TernaryStringSet();
    newTree.#hasEmpty = (view.getInt8(3) & 1) === 1;
    const tree = newTree.#tree;
    for (let byte = BUFFER_HEAD_SIZE; byte < view.byteLength; byte += 4) {
      tree[tree.length] = view.getInt32(byte, false);
    }
    return newTree;
  }
}

/** Statistical data about the tree structure obtained by reading the `stats` property. */
export interface TernaryTreeStats {
  /** The maximum depth (height) of the tree. */
  depth: number;
  /**
   * The total number of nodes in the tree. On a high-quality JavaScript engine, the
   * entire tree will require approximately `nodes * 16` bytes of memory.
   */
  nodes: number;
  /** The number of strings in the tree; equivalent to reading the `size` property. */
  size: number;
  /** The total number of nodes whose code point spans multiple char codes when stored in a string. */
  surrogates: number;
}
