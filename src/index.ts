/** Node index indicating that no node is present. */
const NUL = ~(1 << 31);
/** First node index that would run off of the end of the array. */
const NODE_CEILING = NUL - 3;
/** End-of-string flag: set on node values when that node also marks the end of a string. */
const EOS = 1 << 21;
/** Mask to extract the code point from a node value, ignoring flags. */
const CP_MASK = EOS - 1;
/** Smallest code point that requires a surrogate pair. */
const CP_MIN_SURROGATE = 0x10000;

/**
 * A sorted string set that implements a superset of the standard JS `Set` interface.
 * Supports approximate matching and allows serialization to/from a binary format.
 *
 * The string set can store any valid Unicode string, including the empty
 * string, strings that include characters from the supplementary (or "astral")
 * planes, and so on.
 *
 * Strings are stored using a *ternary search tree*, which has well-balanced performance
 * characteristics when properly constructed (it is important to avoid adding strings
 * in sorted order).
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
   * this structure usually offers better time/space performance than an equivalent tree
   * based on linked objects.
   */
  private _tree: number[];
  /** Tracks whether empty string is in the set as a special case. */
  private _hasEmpty: boolean;
  /** Tracks whether this tree has been compacted; if true this must be undone before mutating the tree. */
  private _compact: boolean;
  /** Tracks set size. */
  private _size: number;

  /**
   * Creates a new set. The set will be empty unless the optional iterable `source` object
   * is specified. If a `source` is provided, all of its elements will be added to the new set.
   * If `source` contains any element that would cause `add()` to throw an error, the constructor
   * will also throw an error for that element.
   *
   * **Note:** Since strings are iterable, passing a string to the constructor will create
   * a new set containing one string for each unique code point in the source string, and not
   * a singleton set containing just the source string as you might expect.
   *
   * @param source An optional iterable object whose strings will be added to the new set.
   * @throws `TypeError` If a specified source is not iterable.
   */
  constructor(source?: Iterable<string>) {
    this.clear();

    if (source != null) {
      if (typeof source[Symbol.iterator] !== "function") {
        throw new TypeError("source object is not iterable");
      }
      if (source instanceof TernaryStringSet) {
        this._tree = source._tree.slice();
        this._hasEmpty = source._hasEmpty;
        this._compact = source._compact;
        this._size = source._size;
      } else {
        this.addAll(source);
      }
    }
  }

  /**
   * Returns the number of unique strings stored in this set.
   *
   * @returns The non-negative integer number of string elements in the set.
   */
  get size(): number {
    return this._size;
  }

  /**
   * Removes all strings from this set.
   *
   * @returns This set, allowing chained calls.
   */
  clear(): TernaryStringSet {
    this._tree = [];
    this._hasEmpty = false;
    this._compact = false;
    this._size = 0;
    return this;
  }

  /**
   * Adds a string to this set. The string can be empty, but cannot be null.
   * Adding an already present string has no effect.
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
        throw new TypeError(`not a string: ${String(s)}`);
      }
      s = String(s);
    }
    if (s.length === 0) {
      if (!this._hasEmpty) {
        this._hasEmpty = true;
        ++this._size;
      }
    } else {
      if (this._compact && !this.has(s)) this._decompact();
      this._addImpl(0, s, 0, s.codePointAt(0));
    }
    return this;
  }

  private _addImpl(node: number, s: string, i: number, cp: number): number {
    const tree = this._tree;

    if (node >= tree.length) {
      node = tree.length;
      if (node >= NODE_CEILING) {
        throw new RangeError("cannot add more strings");
      }
      tree.push(cp, NUL, NUL, NUL);
    }

    const treeCp = tree[node] & CP_MASK;
    if (cp < treeCp) {
      tree[node + 1] = this._addImpl(tree[node + 1], s, i, cp);
    } else if (cp > treeCp) {
      tree[node + 3] = this._addImpl(tree[node + 3], s, i, cp);
    } else {
      i += cp >= CP_MIN_SURROGATE ? 2 : 1;
      if (i >= s.length) {
        if ((tree[node] & EOS) === 0) {
          tree[node] |= EOS;
          ++this._size;
        }
      } else {
        tree[node + 2] = this._addImpl(tree[node + 2], s, i, s.codePointAt(i));
      }
    }

    return node;
  }

  /**
   * Adds an entire collection, or subcollection, of strings to this set. By default,
   * the entire collection is added. If the optional `start` and `end` parameters
   * are provided, the result is the same as converting the iterable to an array and
   * then adding those elements from the index `start` to the index `end` (exclusive).
   *
   * If the collection is sorted in ascending order and no other strings have been
   * added to this set, the underlying tree is guaranteed to be balanced, ensuring
   * good search performance. If the collection is in random order, the tree is *likely*
   * to be nearly balanced.
   *
   * @param strings The non-null collection of strings to add.
   * @param start The index of the first element to add (inclusive, default is 0).
   * @param end The index of the last element to add (exclusive, default is all elements)
   * @returns This set, allowing chained calls.
   * @throws `ReferenceError` If the collection is null.
   * @throws `TypeError` If `strings` is not an iterable or if any element is not a string
   *   or if the start or end are not integer numbers.
   * @throws `RangeError` If the start or end are out of bounds, that is, less than 0
   *   or greater than `Array.from(strings).length`.
   */
  addAll(strings: Iterable<string>, start = 0, end?: number): TernaryStringSet {
    if (strings == null) throw new ReferenceError("null strings");
    if (!Array.isArray(strings)) {
      if (typeof strings[Symbol.iterator] !== "function") {
        throw new TypeError("strings is not iterable");
      }
      strings = Array.from(strings);
    }
    const len = (strings as string[]).length;

    if (typeof start !== "number" || start !== Math.trunc(start)) {
      throw new TypeError("start must be an integer");
    }
    // Note: start = strings.length is allowed so that
    // addAll([], 0, array.length) works as expected
    if (start < 0 || start > len) {
      throw new RangeError("start: " + start);
    }

    if (end === undefined) {
      end = len;
    } else if (typeof end !== "number" || end !== Math.trunc(end)) {
      throw new TypeError("end must be an integer");
    }
    if (end < 0 || end > len) {
      throw new RangeError("end: " + end);
    }

    if (start < end) {
      this._addAllImpl(strings as string[], start, end);
    }
    return this;
  }

  private _addAllImpl(
    strings: readonly string[],
    start: number,
    end: number,
  ): void {
    if (--end < start) return;

    // if the tree is empty and the list is sorted, this insertion
    // order ensures a balanced tree (inserting strings in sorted order
    // is a degenerate case)
    const mid = Math.trunc(start + (end - start) / 2);
    try {
      this.add(strings[mid]);
    } catch (ex) {
      if (ex instanceof TypeError) {
        throw new TypeError(
          `non-string at index ${mid}: ${String(strings[mid])}`,
        );
      }
      throw ex;
    }
    this._addAllImpl(strings, start, mid);
    this._addAllImpl(strings, mid + 1, end + 1);
  }

  /**
   * Returns whether this set contains the specified string.
   * If passed a non-string value, returns false.
   *
   * @param s The non-null string to test for.
   * @returns True if the string is present.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  has(s: any): boolean {
    if (typeof s !== "string") {
      if (!(s instanceof String)) {
        return false;
      }
      s = String(s);
    }
    if (s.length === 0) return this._hasEmpty;

    return this._hasImpl(0, s, 0, s.codePointAt(0));
  }

  private _hasImpl(node: number, s: string, i: number, cp: number): boolean {
    const tree = this._tree;

    if (node >= tree.length) return false;

    const treeCp = tree[node] & CP_MASK;
    if (cp < treeCp) {
      return this._hasImpl(tree[node + 1], s, i, cp);
    } else if (cp > treeCp) {
      return this._hasImpl(tree[node + 3], s, i, cp);
    } else {
      i += cp >= CP_MIN_SURROGATE ? 2 : 1;
      if (i >= s.length) {
        return (tree[node] & EOS) === EOS;
      } else {
        return this._hasImpl(tree[node + 2], s, i, s.codePointAt(i));
      }
    }
  }

  /**
   * Removes the specified string from this set, if it is present.
   * Non-strings are accepted but treated as if they are not present.
   * If it is not present, this has no effect.
   *
   * @param s The non-null string to delete.
   * @returns True if the string was in this set; false otherwise.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete(s: any): boolean {
    if (typeof s !== "string") {
      if (!(s instanceof String)) {
        return false;
      }
      s = String(s);
    }
    if (s.length === 0) {
      const had = this._hasEmpty;
      if (had) {
        this._hasEmpty = false;
        --this._size;
      }
      return had;
    }

    if (this._compact && this.has(s)) this._decompact();
    return this._deleteImpl(0, s, 0, s.codePointAt(0));
  }

  private _deleteImpl(node: number, s: string, i: number, cp: number): boolean {
    const tree = this._tree;

    if (node >= tree.length) return false;

    const treeCp = tree[node] & CP_MASK;
    if (cp < treeCp) {
      return this._deleteImpl(tree[node + 1], s, i, cp);
    } else if (cp > treeCp) {
      return this._deleteImpl(tree[node + 3], s, i, cp);
    } else {
      i += cp >= CP_MIN_SURROGATE ? 2 : 1;
      if (i >= s.length) {
        const had = (tree[node] & EOS) === EOS;
        if (had) {
          tree[node] &= CP_MASK;
          --this._size;
        }
        return had;
      } else {
        return this._deleteImpl(tree[node + 2], s, i, s.codePointAt(i));
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
   * @param charPattern The non-null pattern string. Non-strings are converted to strings.
   * @returns A (possibly empty) array of strings from the set that can be composed from the
   *     pattern characters.
   * @throws `ReferenceError` If the pattern is null.
   */
  getArrangementsOf(charPattern: string): string[] {
    if (charPattern == null) throw new ReferenceError("null charPattern");
    charPattern = String(charPattern);

    // availChars[codePoint] = how many times codePoint appears in pattern
    const availChars: number[] = [];
    for (let i = 0; i < charPattern.length; ) {
      const cp = charPattern.codePointAt(i++);
      if (cp >= CP_MIN_SURROGATE) ++i;
      availChars[cp] = availChars[cp] ? availChars[cp] + 1 : 1;
    }

    const matches: string[] = this._hasEmpty ? [""] : [];
    this._getArrangementsImpl(0, availChars, [], matches);
    return matches;
  }

  private _getArrangementsImpl(
    node: number,
    availChars: number[],
    prefix: number[],
    matches: string[],
  ) {
    const tree = this._tree;
    if (node >= tree.length) return;

    this._getArrangementsImpl(tree[node + 1], availChars, prefix, matches);

    const cp = tree[node] & CP_MASK;
    if (availChars[cp] > 0) {
      --availChars[cp];
      prefix.push(cp);
      if (tree[node] & EOS) {
        matches.push(String.fromCharCode(...prefix));
      }
      this._getArrangementsImpl(tree[node + 2], availChars, prefix, matches);
      prefix.pop();
      ++availChars[cp];
    }

    this._getArrangementsImpl(tree[node + 3], availChars, prefix, matches);
  }

  /**
   * Returns an array of possible completions for the specified prefix string.
   * That is, an array of all strings in the set that start with the prefix.
   * If the prefix itself is in the set, it is included as the first entry.
   *
   * @param prefix The non-null pattern to find completions for.
   * @returns A (possibly empty) array of all strings in the set for which the
   *     pattern is a prefix.
   * @throws `ReferenceError` If the pattern is null.
   */
  getCompletionsOf(prefix: string): string[] {
    if (prefix == null) throw new ReferenceError("null prefix");

    prefix = String(prefix);
    if (prefix.length === 0) {
      return this.toArray();
    }

    const results: string[] = [];
    const pat = toCodePoints(prefix);
    let node = this._hasCodePoints(0, pat, 0);
    if (node < 0) {
      node = -node - 1;
      // prefix not in tree, therefore no children are either
      if (node >= this._tree.length) {
        return results;
      }
      // prefix in tree, but is not itself in the set
    } else {
      // prefix in tree, and also in set
      results.push(prefix);
    }

    // continue from end of prefix by taking equal branch
    this._visitCodePoints(this._tree[node + 2], pat, (s) => {
      results.push(String.fromCodePoint(...s));
    });
    return results;
  }

  /**
   * Returns an array of the strings that are completed by the specified suffix string.
   * That is, an array of all strings in the set that end with the suffix,
   * including the suffix itself if appropriate
   *
   * @param suffix The non-null pattern to find completions for.
   * @returns A (possibly empty) array of all strings in the set for which the
   *     pattern is a suffix.
   * @throws `ReferenceError` If the pattern is null.
   */
  getCompletedBy(suffix: string): string[] {
    if (suffix == null) throw new ReferenceError("null suffix");

    suffix = String(suffix);
    if (suffix.length === 0) {
      return this.toArray();
    }
    const results: string[] = [];
    const pat = toCodePoints(suffix);

    // unlike getCompletionsOf, we have to search the entire tree
    this._visitCodePoints(0, [], (s) => {
      if (s.length >= pat.length) {
        for (let i = 1; i <= pat.length; ++i) {
          if (s[s.length - i] !== pat[pat.length - i]) {
            return;
          }
        }
        results.push(String.fromCodePoint(...s));
      }
    });

    return results;
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
   * @throws `ReferenceError` If the pattern or don't care string is null.
   * @throws `TypeError` If the don't care string is empty.
   */
  getPartialMatchesOf(pattern: string, dontCareChar = "."): string[] {
    if (pattern == null) throw new ReferenceError("null pattern");
    if (dontCareChar == null) throw new ReferenceError("null dontCareChar");

    pattern = String(pattern);
    dontCareChar = String(dontCareChar);

    if (dontCareChar.length === 0) throw new TypeError("empty dontCareChar");

    if (pattern.length === 0) {
      return this._hasEmpty ? [""] : [];
    }

    const dc = dontCareChar.codePointAt(0);
    const matches: string[] = [];
    this._getPartialMatchesImpl(0, pattern, 0, dc, [], matches);
    return matches;
  }

  private _getPartialMatchesImpl(
    node: number,
    pattern: string,
    i: number,
    dc: number,
    prefix: number[],
    matches: string[],
  ) {
    const tree = this._tree;
    if (node >= tree.length) return;

    const cp = pattern.codePointAt(i);
    const treeCp = tree[node] & CP_MASK;
    if (cp < treeCp || cp === dc) {
      this._getPartialMatchesImpl(
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
        if (tree[node] & EOS) {
          matches.push(String.fromCodePoint(...prefix));
        }
      } else {
        this._getPartialMatchesImpl(
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
      this._getPartialMatchesImpl(
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
   *     May be Infinity to allow any number.
   * @returns A (possibly empty) array of strings from the set that match the pattern.
   * @throws `ReferenceError` If the pattern is null.
   * @throws `TypeError` If the distance is not a number.
   * @throws `RangeError` If the distance is negative.
   */
  getWithinHammingDistanceOf(pattern: string, distance: number): string[] {
    if (pattern == null) throw new ReferenceError("null pattern");

    pattern = String(pattern);
    distance = checkDistance(distance);

    // only the string itself is within distance 0 or matches empty pattern
    if (distance < 1 || pattern.length === 0) {
      return this.has(pattern) ? [pattern] : [];
    }

    const matches: string[] = [];

    // optimize case where any string the same length as the pattern will match
    if (distance >= pattern.length) {
      this._visitCodePoints(0, [], (prefix) => {
        if (prefix.length === pattern.length) {
          matches.push(String.fromCodePoint(...prefix));
        }
      });
      return matches;
    }

    this._getWithinHammingImpl(0, pattern, 0, distance, [], matches);
    return matches;
  }

  private _getWithinHammingImpl(
    node: number,
    pat: string,
    i: number,
    dist: number,
    prefix: number[],
    out: string[],
  ) {
    const tree = this._tree;
    if (node >= tree.length || dist < 0) return;

    const cp = pat.codePointAt(i);
    const treeCp = tree[node] & CP_MASK;
    if (cp < treeCp || dist > 0) {
      this._getWithinHammingImpl(tree[node + 1], pat, i, dist, prefix, out);
    }

    prefix.push(treeCp);
    if (tree[node] & EOS && pat.length === prefix.length) {
      if (dist > 0 || cp === treeCp) {
        out.push(String.fromCodePoint(...prefix));
      }
      // no need to recurse, children of this equals branch are too long
    } else {
      const i_ = i + (cp >= CP_MIN_SURROGATE ? 2 : 1);
      const dist_ = dist - (cp === treeCp ? 0 : 1);
      this._getWithinHammingImpl(tree[node + 2], pat, i_, dist_, prefix, out);
    }
    prefix.pop();

    if (cp > treeCp || dist > 0) {
      this._getWithinHammingImpl(tree[node + 3], pat, i, dist, prefix, out);
    }
  }

  /**
   * Returns an array of all strings in the set that are within the specified edit distance
   * of the given pattern string. A string is within edit distance *n* of the pattern if
   * it can be transformed into the pattern with no more than *n* insertions, deletions,
   * or substitutions. For example:
   *  - `cat` is edit distance 0 from itself;
   *  - `at` is edit distance 1 from `cat` (1 deletion);
   *  - `cot` is edit distance 1 from `cat` (1 substitution); and
   *  - `coats` is edit distance 2 from `cat` (2 insertions).
   *
   * @param pattern A pattern string matched against the strings in the set.
   * @param distance The maximum number of edits to apply to the pattern string.
   *   May be Infinity to allow any number of edits.
   * @returns A (possibly empty) array of strings from the set that match the pattern.
   * @throws `ReferenceError` If the pattern is null.
   * @throws `TypeError` If the distance is not a number.
   * @throws `RangeError` If the distance is negative.
   */
  getWithinEditDistanceOf(pattern: string, distance: number): string[] {
    if (pattern == null) throw new ReferenceError("null pattern");

    pattern = String(pattern);
    distance = checkDistance(distance);

    // only the string itself is within distance 0
    if (distance < 1) {
      return this.has(pattern) ? [pattern] : [];
    }

    // once we start inserting and deleting characters, a standard traversal no
    // longer guarantees sorted order, so instead of collecting results in an
    // array, we collect them in a temporary set
    const results = new TernaryStringSet();

    // add "" if we can delete the pattern down to it
    if (this._hasEmpty && pattern.length <= distance) {
      results.add("");
    }

    // we avoid redundant work by computing possible deletions
    // ahead of time (e.g., aaa deletes to aa 3 different ways)
    let patterns = new TernaryStringSet().add(pattern);
    for (let d = distance; d >= 0; --d) {
      const reducedPatterns = new TernaryStringSet();
      if (patterns._hasEmpty) {
        this._getWithinEditImpl(0, [], 0, d, [], results);
      }
      // make patterns for the next iteration by deleting
      // each character in turn from this iteration's patterns
      // abc => ab ac bc => a b c => empty string
      patterns._visitCodePoints(0, [], (cp) => {
        this._getWithinEditImpl(0, cp, 0, d, [], results);
        if (d > 0 && cp.length > 0) {
          if (cp.length === 1) {
            reducedPatterns._hasEmpty = true;
          } else {
            const delete1 = new Array(cp.length - 1);
            for (let i = 0; i < cp.length; ++i) {
              for (let j = 0; j < i; ++j) {
                delete1[j] = cp[j];
              }
              for (let j = i + 1; j < cp.length; ++j) {
                delete1[j - 1] = cp[j];
              }
              reducedPatterns._addCodePoints(0, delete1, 0);
            }
          }
        }
      });
      if (patterns._hasEmpty) {
        this._getWithinEditImpl(0, [], 0, d, [], results);
      }
      patterns = reducedPatterns;
    }

    return results.toArray();
  }

  private _getWithinEditImpl(
    node: number,
    pat: number[],
    i: number,
    dist: number,
    prefix: number[],
    out: TernaryStringSet,
  ) {
    const tree = this._tree;
    if (node >= tree.length || dist < 0) return;

    const treeCp = tree[node] & CP_MASK;
    const eos = tree[node] & EOS;

    if (i < pat.length) {
      const cp = pat[i];
      const i_ = i + 1;
      const dist_ = dist - 1;

      // char is a match: move to next char without using dist
      if (cp === treeCp) {
        prefix.push(cp);
        if (eos && i_ + dist >= pat.length) {
          out._addCodePoints(0, prefix, 0);
        }
        this._getWithinEditImpl(tree[node + 2], pat, i_, dist, prefix, out);
        prefix.pop();
      } else if (dist > 0) {
        // char is not a match: try with edits
        prefix.push(treeCp);
        if (eos && i + dist >= pat.length) {
          out._addCodePoints(0, prefix, 0);
        }
        // insert the tree's code point ahead of the pattern's
        this._getWithinEditImpl(tree[node + 2], pat, i, dist_, prefix, out);
        // substitute the tree's code point for the pattern's
        this._getWithinEditImpl(tree[node + 2], pat, i_, dist_, prefix, out);
        prefix.pop();
      }
      if (cp < treeCp || dist > 0) {
        this._getWithinEditImpl(tree[node + 1], pat, i, dist, prefix, out);
      }
      if (cp > treeCp || dist > 0) {
        this._getWithinEditImpl(tree[node + 3], pat, i, dist, prefix, out);
      }
    } else if (dist > 0) {
      prefix.push(treeCp);
      if (eos) out._addCodePoints(0, prefix, 0);
      this._getWithinEditImpl(tree[node + 2], pat, i, dist - 1, prefix, out);
      prefix.pop();
      this._getWithinEditImpl(tree[node + 1], pat, i, dist, prefix, out);
      this._getWithinEditImpl(tree[node + 3], pat, i, dist, prefix, out);
    }
  }

  /**
   * Calls the specified callback function once for each string in this set, passing the string
   * and this set. The string is passed as both value and key to align with `Map.forEach`.
   * If `thisArg` is specified, it is used as `this` when invoking the callback function.
   *
   * @param callbackFn The function to call for each string.
   * @param thisArg Optional value to use as `this` when calling the function.
   * @throws `TypeError` If the callback function is not a function.
   */
  forEach(
    callbackFn: (value: string, key: string, set: TernaryStringSet) => void,
    thisArg?: unknown,
  ): void {
    if (typeof callbackFn !== "function") {
      throw new TypeError("callbackFn must be a function");
    }
    if (arguments.length >= 2) {
      callbackFn = callbackFn.bind(thisArg);
    }
    if (this._hasEmpty) {
      const s = "";
      callbackFn(s, s, this);
    }
    this._visitCodePoints(0, [], (prefix) => {
      const s = String.fromCodePoint(...prefix);
      callbackFn(s, s, this);
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
    const tree = this._tree;
    function* itor(node: number, prefix: number[]): Generator<string> {
      if (node < 0) {
        node = 0;
        yield "";
      }
      if (node >= tree.length) return;
      yield* itor(tree[node + 1], prefix);
      prefix.push(tree[node] & CP_MASK);
      if (tree[node] & EOS) yield String.fromCodePoint(...prefix);
      yield* itor(tree[node + 2], prefix);
      prefix.pop();
      yield* itor(tree[node + 3], prefix);
    }
    return itor(this._hasEmpty ? -1 : 0, []);
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
   * Returns whether this set contains exactly the same elements as the specified set.
   * If passed an object that is not a `TernaryStringSet`, this method returns false.
   *
   * @param rhs The set (or other object) to compare this set to.
   * @returns True if the specified object is also a `TernaryStringSet` and it contains the same elements.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  equals(rhs: any): boolean {
    if (!(rhs instanceof TernaryStringSet)) return false;
    if (this._size !== rhs._size) return false;
    return this.isSubsetOf(rhs);
  }

  /**
   * Returns whether this set is a subset of the specified set. This set is a subset if every
   * element in this set is also contained in the other set. By this definition,
   * equal sets are also subsets of each other. To test if this set is a *proper* subset
   * of the specified set, use code like this: `lhs.size < rhs.size && lhs.isSubsetOf(rhs)`.
   *
   * @param rhs The set to compare this set to.
   * @returns True if this set is a subset of, or equal to, the specified set.
   * @throws `TypeError` If the specified set is not a `TernaryStringSet`.
   */
  isSubsetOf(rhs: TernaryStringSet): boolean {
    if (this === rhs) return true;
    if (!(rhs instanceof TernaryStringSet)) {
      throw new TypeError("not a TernaryStringSet");
    }
    if (this._size > rhs._size) return false;
    if (this._hasEmpty && !rhs._hasEmpty) return false;

    // What follows is a faster equivalent to the following code:
    // ```
    // for (const s of this) {
    //   if (!rhs.has(s)) return false;
    // }
    // return true;
    // ```

    let subset = true;
    this._visitCodePoints(0, [], (s) => {
      if (rhs._hasCodePoints(0, s, 0) < 0) {
        subset = false;
        return false;
      }
    });
    return subset;
  }

  /**
   * Returns whether this set is a superset of the specified set. This set is a superset if every
   * element in the other set is also contained in this set. By this definition,
   * equal sets are also supersets of each other. To test if this set is a *proper* superset
   * of the specified set, use code like this: `lhs.size > rhs.size && lhs.isSupersetOf(rhs)`.
   *
   * @param rhs The set to compare this set to.
   * @returns True if this set is a superset of, or equal to, the specified set.
   * @throws `TypeError` If the specified set is not a `TernaryStringSet`.
   */
  isSupersetOf(rhs: TernaryStringSet): boolean {
    if (!(rhs instanceof TernaryStringSet)) {
      throw new TypeError("not a TernaryStringSet");
    }
    return rhs.isSubsetOf(this);
  }

  /**
   * Returns a new set that is the union of this set and the elements of the
   * specified iterable. The new set will include any element that is a
   * member of either.
   *
   * @param rhs The iterable whose elements should be united with this set.
   * @returns A new set containing the elements of both this set and the iterable.
   * @throws `TypeError` If the specified target is not iterable or any
   *     element is not a string.
   */
  union(rhs: Iterable<string>): TernaryStringSet {
    if (!(rhs instanceof TernaryStringSet)) {
      if (typeof rhs[Symbol.iterator] !== "function") {
        throw new TypeError("rhs is not iterable");
      }
      const union = this._cloneDecompacted();
      union.addAll(rhs);
      return union;
    }
    if (rhs._size > this._size) {
      return rhs.union(this);
    }
    const union = this._cloneDecompacted();
    if (!union._hasEmpty && rhs._hasEmpty) {
      union._hasEmpty = true;
      ++union._size;
    }
    rhs._visitCodePoints(0, [], (s) => {
      union._addCodePoints(0, s, 0);
    });
    return union;
  }

  /**
   * Returns a new set that is the intersection of this set and the elements
   * of the specified iterable. The new set will include only those elements
   * that are members of both.
   *
   * @param rhs The iterable to intersect with this set.
   * @returns A new set containing only elements in both this set and the iterable.
   * @throws `TypeError` If the specified target is not iterable.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  intersection(rhs: Iterable<any>): TernaryStringSet {
    if (!(rhs instanceof TernaryStringSet)) {
      if (typeof rhs[Symbol.iterator] !== "function") {
        throw new TypeError("rhs is not iterable");
      }
      const intersect: string[] = [];
      for (const s of rhs) {
        if (this.has(s)) {
          intersect.push(s);
        }
      }
      return new TernaryStringSet(intersect);
    }
    if (rhs._size < this._size) {
      return rhs.intersection(this);
    }
    const intersect = this._cloneDecompacted();
    if (intersect._hasEmpty && !rhs._hasEmpty) {
      intersect._hasEmpty = false;
      --intersect._size;
    }
    intersect._hasEmpty &&= rhs._hasEmpty;
    intersect._visitCodePoints(0, [], (s, node) => {
      // delete if not also in rhs
      if (rhs._hasCodePoints(0, s, 0) < 0) {
        intersect._tree[node] &= CP_MASK;
        --intersect._size;
      }
    });
    return intersect;
  }

  /** @deprecated since 2.2.0, to be removed in 3.0.0. Use `difference` instead. */
  subtract(rhs: TernaryStringSet): TernaryStringSet {
    return this.difference(rhs);
  }

  /**
   * Returns a new set that is the difference of this set and the elements
   * of the specified iterable. The new set will contain all elements
   * that are only members of this set and not both.
   *
   * @param rhs The iterable whose elements should be subtracted from this set;
   *   the iterable's elements do not have to be strings.
   * @returns A new set containing only those elements in this set and that are not
   *   in the specified iterable.
   * @throws `TypeError` If the specified target is not iterable.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  difference(rhs: Iterable<any>): TernaryStringSet {
    if (!(rhs instanceof TernaryStringSet)) {
      if (typeof rhs[Symbol.iterator] !== "function") {
        throw new TypeError("rhs is not iterable");
      }
      const diff = this._cloneDecompacted();
      for (const s of rhs) {
        diff.delete(s);
      }
      return diff;
    }
    const diff = this._cloneDecompacted();
    if (rhs._hasEmpty && diff._hasEmpty) {
      diff._hasEmpty = false;
      --diff._size;
    }
    diff._visitCodePoints(0, [], (s, node) => {
      // delete if in rhs
      if (rhs._hasCodePoints(0, s, 0) >= 0) {
        diff._tree[node] &= CP_MASK;
        --diff._size;
      }
    });
    return diff;
  }

  /**
   * Returns a new set that is the symmetric difference of this set and the elements
   * of the specified iterable. The new set will include all of the elements that
   * are in either, but not in *both*.
   *
   * @param rhs The iterable whose elements should be exclusive-or'd with this set.
   * @returns A new set containing those elements either in this set or the iterable,
   *   but not both or neither.
   * @throws `TypeError` If the specified target is not iterable.
   */
  symmetricDifference(rhs: Iterable<string>): TernaryStringSet {
    if (!(rhs instanceof TernaryStringSet)) {
      if (typeof rhs[Symbol.iterator] !== "function") {
        throw new TypeError("rhs is not iterable");
      }
      rhs = new TernaryStringSet(rhs);
    }
    const diff = this._cloneDecompacted();
    diff._hasEmpty = this._hasEmpty !== (rhs as TernaryStringSet)._hasEmpty;
    if (this._hasEmpty !== diff._hasEmpty) {
      if (diff._hasEmpty) {
        ++diff._size;
      } else {
        --diff._size;
      }
    }
    (rhs as TernaryStringSet)._visitCodePoints(0, [], (s) => {
      // if s is also in diff, delete in diff; otherwise add to diff
      const node = diff._hasCodePoints(0, s, 0);
      if (node >= 0) {
        diff._tree[node] &= CP_MASK;
        --diff._size;
      } else {
        diff._addCodePoints(0, s, 0);
      }
    });
    return diff;
  }

  /**
   * Returns an iterator over the strings in this set, in ascending lexicographic order.
   * As a result, this set can be used in `for...of` loops and other contexts that
   * expect iterable objects.
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

  /**
   * Optimizes the layout of the underlying data structure to maximize search speed.
   * This may improve future search performance after adding or deleting a large
   * number of strings.
   *
   * It is not normally necessary to call this method as long as care was taken not
   * to add large numbers of strings in lexicographic order. That said, two scenarios
   * where it may be particularly effective are:
   *  - If the set will be used in phases, with strings being added in one phase
   *    followed by a phase of extensive search operations.
   *  - If the string is about to be converted into a buffer for future use.
   *
   * As detailed under `addAll`, if the entire contents of the set were added by a single
   * call to `addAll` using a sorted array, the tree is already balanced and calling this
   * method will have no benefit.
   *
   * **Note:** This method undoes the effect of `compact()`. If you want to balance and
   * compact the tree, be sure to balance it first.
   */
  balance(): void {
    this._tree = new TernaryStringSet(this.toArray())._tree;
    this._compact = false;
  }

  /**
   * Compacts the set to reduce its memory footprint and improve search performance.
   * For large sets, a compacted set is typically *significantly* smaller
   * than a non-compacted set. The tradeoff is that compact sets cannot be modified.
   * Any method that mutates the set, including
   * `add`, `addAll`, `balance`, and `delete`
   * can therefore cause the set to revert to an non-compacted state.
   *
   * Compaction is an excellent option if the primary purpose of a set matching
   * against a fixed collection of strings, such as a dictionary. Since
   * compaction and decompaction are expensive operations, it is less attractive
   * in use cases where the set will be intermittently modified.
   */
  compact(): void {
    if (this._compact || this._tree.length === 0) return;

    /*

    Theory of operation:
    
    In a ternary tree, all strings with the same prefix share the nodes
    that make up that prefix. The compact operation does much the same thing,
    but for suffixes. It does this by deduplicating identical tree nodes.
    For example, every string that ends in "e" and is not a prefix of any other
    strings looks the same: an "e" node with three NUL child branch pointers.
    But these can be distributed throughout the tree. Consider a tree containing only
    "ape" and "haze": we could save space by having only a single copy of the "e" node
    and pointing to it from both the "p" node and the "z" node.
    
    So: to compact the tree, we iterate over each node and build a map of all unique nodes.
    The first time we come across a node, we add it to the map, mapping the node to
    a number which is the next available slot in the new, compacted, output array we will write.

    Once we have built the map, we iterate over the nodes again. This time we look up each node
    in the previously built map to find the slot it was assigned in the output array. If the
    slot is past the end of the array, then we haven't added it to the output yet. We can
    write the node's value unchanged, but the three pointers to the child branches need to
    be rewritten to point to the new, deduplicated equivalent of the nodes that they point to.
    For each branch, if the pointer is NUL we write it unchanged. Otherwise we look up the node
    that that branch points to in our unique node map to get its new slot number (i.e. array offset)
    and write the translated address.

    After doing this once, we will have deduplicated just the leaf nodes. In the original tree,
    only nodes with no children can be duplicates, because their branches are all NUL.
    But after rewriting the tree, some of the parents of those leaf nodes may now point to
    shared leaf nodes, so they themselves might now have duplicates in other parts of the tree.
    So, we can repeat the rewriting step above to remove these newly generated duplicates as well.
    This may again lead to new duplicates, and so on: the rewriting can continue until the output
    doesn't shrink anymore.
    */

    let source = this._tree;
    for (;;) {
      const compacted = compactionPass(source);
      if (compacted.length === source.length) {
        this._tree = compacted;
        break;
      }
      source = compacted;
    }
    this._compact = true;
  }

  /**
   * Returns whether the set is currently compact.
   *
   * @returns True if the set is compacted, in which case mutating the set could have
   *     significant performance implications.
   */
  get compacted(): boolean {
    return this._compact;
  }

  /**
   * Returns a new array of every element in the set. This is equivalent
   * to `Array.from(this)`, but this method is more efficient.
   *
   * @returns A non-null array of the elements of the set in lexicographic order.
   */
  toArray(): string[] {
    const a = this._hasEmpty ? [""] : [];
    this._visitCodePoints(0, [], (s) => {
      a[a.length] = String.fromCodePoint(...s);
    });
    return a;
  }

  /**
   * Returns a buffer whose contents can be used to recreate this set.
   * The returned data is independent of the platform on which it is created.
   * The buffer content and length will depend on the state of the set's
   * underlying structure. For this reason you may wish to `balance()`
   * and/or `compact()` the set first.
   *
   * @returns A non-null buffer.
   */
  toBuffer(): ArrayBuffer {
    return encode(this._size, this._hasEmpty, this._compact, this._tree);
  }

  /**
   * Creates a new string set from data in a buffer previously created with `toBuffer`.
   *
   * @param buffer The buffer to recreate the set from.
   * @returns A new set that recreates the original set that was stored in the buffer.
   * @throws `ReferenceError` If the specified buffer is null.
   * @throws `TypeError` If the buffer data is detected to be invalid or from an unsupported version.
   */
  static fromBuffer(buffer: ArrayBuffer): TernaryStringSet {
    if (buffer == null) {
      throw new ReferenceError("null buffer");
    }

    const h: DecodedBuffer = decode(buffer);
    const set = new TernaryStringSet();
    set._hasEmpty = h.hasEmpty;
    set._compact = h.compact;
    set._size = h.size;
    set._tree = h.tree;
    return set;
  }

  /**
   * For each string in the subtree rooted at the specified node,
   * the callback function is invoked with an array of the numeric
   * code points for that string. For example, the string `"ABC"`
   * would be passed to the callback as `[65, 66, 67]`. This never
   * visits the empty string, so that must be handled separately
   * if desired.
   *
   * @param node The starting node index (0 for tree root).
   * @param prefix The non-null array that will hold string code points;
   *     any existing elements are retained as a prefix of every string.
   * @param visitFn The non-null function to invoke for each string; returning
   *     `false` will stop and return without visiting more strings.
   */
  private _visitCodePoints(
    node: number,
    prefix: number[],
    visitFn: (prefix: number[], node: number) => void | boolean,
  ) {
    const tree = this._tree;
    if (node >= tree.length) return;
    this._visitCodePoints(tree[node + 1], prefix, visitFn);
    prefix.push(tree[node] & CP_MASK);
    if (tree[node] & EOS) {
      if (visitFn(prefix, node) === false) return;
    }
    this._visitCodePoints(tree[node + 2], prefix, visitFn);
    prefix.pop();
    this._visitCodePoints(tree[node + 3], prefix, visitFn);
  }

  /**
   * Tests whether a string specified as an array of numeric code points is in the set.
   * Returns a numeric result `n` as follows:
   *   - If `n >= 0`, the string was found and it ends at the node indicated by the result.
   *   - If `n < 0`, the string was not found. Compute `s = -n - 1` and then:
   *     - If `s >= tree.length` then not only is the string not present, but it is also
   *       not a prefix of *any* string in the set.
   *     - Otherwise, `s` is the index of the node where the string *would* end *if* it was
   *       in the set.
   *
   * Does not handle testing for the empty string.
   *
   * @param node The subtree from which to begin searching (0 for root).
   * @param s The non-null array of code points to search for.
   * @param i The index of the code point currently being searched for (0 to search from start of string).
   * @returns The node index where the string ends, or a negative value indicating
   *     failure (see above for details).
   */
  private _hasCodePoints(node: number, s: number[], i: number): number {
    const tree = this._tree;
    if (node >= tree.length) return -node - 1;

    const cp = s[i];
    const treeCp = tree[node] & CP_MASK;
    if (cp < treeCp) {
      return this._hasCodePoints(tree[node + 1], s, i);
    } else if (cp > treeCp) {
      return this._hasCodePoints(tree[node + 3], s, i);
    } else {
      if (++i >= s.length) {
        return (tree[node] & EOS) === EOS ? node : -node - 1;
      } else {
        return this._hasCodePoints(tree[node + 2], s, i);
      }
    }
  }

  /**
   * Adds a string described as an array of numeric code points.
   *
   * Does not handle adding empty strings.
   *
   * Does not check if the tree needs to be decompacted.
   *
   * @param node The subtree from which to begin adding (0 for root).
   * @param s The non-null array of code points to add for.
   * @param i The array index of the code point to start from (0 to add entire string).
   */
  private _addCodePoints(node: number, s: number[], i: number): number {
    const tree = this._tree;
    const cp = s[i];

    if (node >= tree.length) {
      node = tree.length;
      if (node >= NODE_CEILING) {
        throw new RangeError("cannot add more strings");
      }
      tree.push(cp, NUL, NUL, NUL);
    }

    const treeCp = tree[node] & CP_MASK;
    if (cp < treeCp) {
      tree[node + 1] = this._addCodePoints(tree[node + 1], s, i);
    } else if (cp > treeCp) {
      tree[node + 3] = this._addCodePoints(tree[node + 3], s, i);
    } else {
      i += cp >= CP_MIN_SURROGATE ? 2 : 1;
      if (i >= s.length) {
        if ((tree[node] & EOS) === 0) {
          tree[node] |= EOS;
          ++this._size;
        }
      } else {
        tree[node + 2] = this._addCodePoints(tree[node + 2], s, i);
      }
    }

    return node;
  }

  /**
   * If the tree is currently compacted, converts it a non-compact form.
   */
  private _decompact() {
    if (this._compact) this.balance();
  }

  /**
   * Returns a copy of this set that is also guaranteed not to be compact.
   */
  private _cloneDecompacted() {
    if (this._compact) {
      return new TernaryStringSet(this.toArray());
    } else {
      return new TernaryStringSet(this);
    }
  }

  /**
   * Returns information about this set's underlying tree structure.
   * This method is intended only for testing and performance analysis.
   */
  get stats(): TernaryTreeStats {
    const tree = this._tree;
    const breadth: number[] = [];
    const nodes = this._tree.length / 4;
    let surrogates = 0;
    let minCodePoint = nodes > 0 ? 0x10ffff : 0;
    let maxCodePoint = 0;

    (function traverse(n: number, d: number) {
      if (n >= tree.length) return;

      breadth[d] = breadth.length <= d ? 1 : breadth[d] + 1;

      const cp = tree[n] & CP_MASK;
      if (cp >= CP_MIN_SURROGATE) ++surrogates;
      if (cp > maxCodePoint) maxCodePoint = cp;
      if (cp < minCodePoint) minCodePoint = cp;

      traverse(tree[n + 1], d + 1);
      traverse(tree[n + 2], d + 1);
      traverse(tree[n + 3], d + 1);
    })(0, 0);

    return {
      size: this._size,
      nodes,
      compact: this._compact,
      depth: breadth.length,
      breadth,
      minCodePoint,
      maxCodePoint,
      surrogates,
      toString() {
        return JSON.stringify(this)
          .replace(/\{|\}/g, "")
          .replace(/"(\w+)":/g, "\n$1: ");
      },
    };
  }
}

/** Tree structure information obtained by reading the `stats` property. */
export interface TernaryTreeStats {
  /** The number of strings in the tree. Equivalent to the `size` property. */
  size: number;
  /**
   * The total number of nodes in the tree. For a high-quality JavaScript engine, the
   * set will consume approximately `nodes * 16` bytes of memory, plus some object overhead.
   */
  nodes: number;
  /** True if the tree structure is compacted. */
  compact: boolean;
  /** The maximum depth (height) of the tree. */
  depth: number;
  /**
   * Width of the tree at each level of tree depth, starting with the root at `breadth[0]`.
   * A deep tree with small depth values will benefit most from being balanced.
   */
  breadth: number[];
  /** The least code point contained in any string in the set. */
  minCodePoint: number;
  /** The greatest code point contained in any string in the set. */
  maxCodePoint: number;
  /** The total number of nodes whose code point spans multiple char codes when stored in a string. */
  surrogates: number;
  /** Returns the stats in string form. */
  toString(): string;
}

/** Validates an edit distance. */
function checkDistance(distance: number) {
  if (typeof distance !== "number" || distance !== distance) {
    throw new TypeError("distance not a number");
  }
  if (distance < 0) {
    throw new RangeError("distance must be non-negative");
  }
  distance = Math.min(Math.trunc(Number(distance)), NUL);
  return distance;
}

/**
 * Converts a string to an array of numeric code points.
 * (This is not equivalent to `[...s]`, which returns strings.)
 *
 * @param s A non-null string.
 * @returns An array of the code points comprising the string.
 */
function toCodePoints(s: string): number[] {
  const cps = [];
  for (let i = 0; i < s.length; ) {
    const cp = s.codePointAt(i++);
    if (cp >= CP_MIN_SURROGATE) ++i;
    cps.push(cp);
  }
  return cps;
}

/** Performs a single compaction pass; see `compact()` method. */
function compactionPass(tree: number[]): number[] {
  // this uses nested sparse arrays to map node values to "slots" (node's index in new array)
  let nextSlot = 0;
  const nodeMap: number[][][][] = [];
  function mapping(i: number): number {
    // nodeMap[value][ltPointer][eqPointer][gtPointer] = slot
    let ltMap = nodeMap[tree[i]];
    if (ltMap == null) {
      nodeMap[tree[i]] = ltMap = [];
    }
    let eqMap = ltMap[tree[i + 1]];
    if (eqMap == null) {
      ltMap[tree[i + 1]] = eqMap = [];
    }
    let gtMap = eqMap[tree[i + 2]];
    if (gtMap == null) {
      eqMap[tree[i + 2]] = gtMap = [];
    }
    let slot = gtMap[tree[i + 3]];
    if (slot == null) {
      gtMap[tree[i + 3]] = slot = nextSlot;
      nextSlot += 4;
    }
    return slot;
  }

  // create map of unique nodes
  for (let i = 0; i < tree.length; i += 4) {
    mapping(i);
  }

  // check if tree will shrink before bothering to rewrite it
  if (nextSlot === tree.length) {
    return tree;
  }

  // rewrite tree
  const out: number[] = [];
  for (let i = 0; i < tree.length; i += 4) {
    const slot = mapping(i);
    // if the unique version of the node hasn't been written yet,
    // append it to the output array
    if (slot >= out.length) {
      if (slot > out.length) throw new Error("assertion");
      // write the node value unchanged
      out[slot] = tree[i];
      // write the pointers for each child branch, but use the new
      // slot for whatever child node is found there
      out[slot + 1] = mapping(tree[i + 1]);
      out[slot + 2] = mapping(tree[i + 2]);
      out[slot + 3] = mapping(tree[i + 3]);
    }
  }

  return out;
}

//
// Serialization
//

/** Version number for the data buffer format. */
const BUFF_VERSION = 3;
/** Magic number used by buffer data format. */
const BUFF_MAGIC = 84;
/** Buffer format header size (4 bytes magic/properties + 4 bytes node count). */
const BUFF_HEAD_SIZE = 8;
/** Buffer format flag bit: set has empty string */
const BF_HAS_EMPTY = 1;
/** Buffer format flag bit: set is compact */
const BF_COMPACT = 2;
/** Buffer format flag bit: v2 file uses 16-bit integers for branch pointers. */
const BF_BRANCH16 = 4;

function encode(
  size: number,
  hasEmpty: boolean,
  compact: boolean,
  tree: number[],
): ArrayBuffer {
  const buff = new ArrayBuffer(BUFF_HEAD_SIZE + 16 * tree.length);
  const view = new DataView(buff);

  // Header
  //   - magic bytes "TT" for ternary tree
  view.setUint8(0, BUFF_MAGIC);
  view.setUint8(1, BUFF_MAGIC);
  //   - version number
  view.setUint8(2, BUFF_VERSION);
  //   - flag bits
  const treeFlags = (hasEmpty ? BF_HAS_EMPTY : 0) | (compact ? BF_COMPACT : 0);
  view.setUint8(3, treeFlags);
  //   - set size
  view.setUint32(4, size);

  // track buffer bytes used and offset of next write
  let blen = BUFF_HEAD_SIZE;

  // encode and write each node sequentially
  for (let n = 0; n < tree.length; n += 4) {
    const encodingOffset = blen++;
    let encoding = 0;

    // write code point
    const cp = tree[n] & CP_MASK;
    const eos = (tree[n] & EOS) !== 0;
    if (tree[n] === 0x65) {
      // letter "e"
      encoding = 3 << 6;
    } else if (cp > 0x7fff) {
      view.setUint32(blen - 1, tree[n]);
      blen += 3;
    } else if (cp > 0x7f) {
      encoding = 1 << 6;
      const int = cp | (eos ? 0x8000 : 0);
      view.setUint16(blen, int);
      blen += 2;
    } else {
      encoding = 2 << 6;
      const int = cp | (eos ? 0x80 : 0);
      view.setUint8(blen++, int);
    }

    // write branch pointers
    let branchShift = 4;
    for (let branch = 1; branch <= 3; ++branch) {
      let pointer = tree[n + branch];
      if (pointer === NUL) {
        encoding |= 3 << branchShift;
      } else {
        pointer /= 4;
        if (pointer > 0xffffff) {
          view.setUint32(blen, pointer);
          blen += 4;
        } else if (pointer > 0xffff) {
          encoding |= 1 << branchShift;
          view.setUint8(blen, pointer >>> 16);
          view.setUint16(blen + 1, pointer & 0xffff);
          blen += 3;
        } else {
          encoding |= 2 << branchShift;
          view.setUint16(blen, pointer);
          blen += 2;
        }
      }
      branchShift -= 2;
    }

    view.setUint8(encodingOffset, encoding);
  }

  // return the buffer, trimmed to actual bytes used
  return blen < buff.byteLength ? buff.slice(0, blen) : buff;
}

function decode(buff: ArrayBuffer): DecodedBuffer {
  const view = new DataView(buff);
  const decoded: DecodedBuffer = decodeHeader(view);
  if (decoded.version < 3) {
    decodeV1V2(decoded, view);
  } else {
    decodeV3(decoded, view);
  }
  return decoded;
}

interface DecodedBuffer {
  version: number;
  hasEmpty: boolean;
  compact: boolean;
  v2b16: boolean;
  size: number;
  tree: number[];
}

function bad(why: string) {
  throw new TypeError("Invalid set data: " + why);
}

function decodeHeader(view: DataView): DecodedBuffer {
  const h: DecodedBuffer = {} as DecodedBuffer;
  if (view.byteLength < BUFF_HEAD_SIZE) bad("too short");
  if (view.getUint8(0) !== BUFF_MAGIC || view.getUint8(1) !== BUFF_MAGIC)
    bad("bad magic");

  h.version = view.getUint8(2);
  if (h.version < 1 || h.version > BUFF_VERSION)
    bad("unsupported version " + h.version);

  const flags = view.getUint8(3);
  h.hasEmpty = (flags & BF_HAS_EMPTY) !== 0;
  h.compact = (flags & BF_COMPACT) !== 0;
  h.v2b16 = (flags & BF_BRANCH16) !== 0;

  if (h.v2b16 && h.version !== 2) bad("b16 without v2");
  if ((flags & ~(BF_HAS_EMPTY | BF_COMPACT | BF_BRANCH16)) !== 0)
    bad("unknown flag");

  h.size = view.getUint32(4);
  h.tree = [];
  return h;
}

function decodeV3(h: DecodedBuffer, view: DataView): void {
  const tree = h.tree;
  for (let b = BUFF_HEAD_SIZE; b < view.byteLength; ) {
    const encoding = view.getUint8(b++);

    // decode code point
    const cpbits = (encoding >>> 6) & 3;
    if (cpbits === 0) {
      tree[tree.length] = view.getUint32(b - 1) & 0xffffff;
      b += 3;
    } else if (cpbits === 1) {
      let cp = view.getUint16(b);
      if (cp & 0x8000) cp = (cp & 0x7fff) | EOS;
      tree[tree.length] = cp;
      b += 2;
    } else if (cpbits === 2) {
      let cp = view.getUint8(b++);
      if (cp & 0x80) cp = (cp & 0x7f) | EOS;
      tree[tree.length] = cp;
    } else {
      tree[tree.length] = 0x65; // letter "e"
    }

    // decode branch pointers
    let branchShift = 4;
    for (let branch = 1; branch <= 3; ++branch) {
      const branchBits = (encoding >>> branchShift) & 3;
      branchShift -= 2;

      if (branchBits === 0) {
        tree[tree.length] = view.getUint32(b) * 4;
        b += 4;
      } else if (branchBits === 1) {
        let int24 = view.getUint8(b) << 16;
        int24 |= view.getUint16(b + 1);
        tree[tree.length] = int24 * 4;
        b += 3;
      } else if (branchBits === 2) {
        tree[tree.length] = view.getUint16(b) * 4;
        b += 2;
      } else {
        tree[tree.length] = NUL;
      }
    }
  }
}

function decodeV1V2(h: DecodedBuffer, view: DataView): void {
  const tree = h.tree;
  const b16 = h.v2b16;
  for (let b = BUFF_HEAD_SIZE; b < view.byteLength; ) {
    tree[tree.length] = view.getUint32(b);
    b += 4;
    if (b16) {
      tree[tree.length] = view.getUint16(b);
      b += 2;
      tree[tree.length] = view.getUint16(b);
      b += 2;
      tree[tree.length] = view.getUint16(b);
      b += 2;
    } else {
      tree[tree.length] = view.getUint32(b);
      b += 4;
      tree[tree.length] = view.getUint32(b);
      b += 4;
      tree[tree.length] = view.getUint32(b);
      b += 4;
    }
  }
  if (h.version === 1) {
    // v1 didn't store size; need to count it
    h.size = h.hasEmpty ? 1 : 0;
    for (let node = 0; node < tree.length; node += 4) {
      if (tree[node] & EOS) ++h.size;
    }
  }
}
