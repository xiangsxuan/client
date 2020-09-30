import { RangeAnchor, TextPositionAnchor, TextQuoteAnchor } from './types';

/**
 * @typedef {import("./types").AnyRangeType} AnyRangeType
 * @typedef {import('../../types/api').Selector} Selector
 */

/**
 * @param {RangeAnchor|TextPositionAnchor|TextQuoteAnchor} anchor
 * @param {Object} [options]
 *  @param {number} [options.hint]
 */
const querySelector = function (anchor, options = {}) {
  const doQuery = function (resolve, reject) {
    try {
      const range = anchor.toRange(options);
      return resolve(range);
    } catch (error) {
      return reject(error);
    }
  };
  return new Promise(doQuery);
};

/**
 * Anchor a set of selectors.
 *
 * This function converts a set of selectors into a document range.
 * It encapsulates the core anchoring algorithm, using the selectors alone or
 * in combination to establish the best anchor within the document.
 *
 * @param {Node} root - The root element of the anchoring context.
 * @param {Selector[]} selectors - The selectors to try.
 * @param {Object} [options]
 *   @param {number} [options.hint]
 */
export function anchor(root, selectors, options = {}) {
  let position = null;
  let quote = null;
  let range = null;

  // Collect all the selectors
  for (let selector of selectors) {
    switch (selector.type) {
      case 'TextPositionSelector':
        position = selector;
        options.hint = position.start; // TextQuoteAnchor hint
        break;
      case 'TextQuoteSelector':
        quote = selector;
        break;
      case 'RangeSelector':
        range = selector;
        break;
    }
  }

  /**
   * Assert the quote matches the stored quote, if applicable
   * @param {Range} range
   */
  const maybeAssertQuote = range => {
    if (quote?.exact && range.toString() !== quote.exact) {
      throw new Error('quote mismatch');
    } else {
      return range;
    }
  };

  // From a default of failure, we build up catch clauses to try selectors in
  // order, from simple to complex.
  let promise = Promise.reject('unable to anchor');

  if (range) {
    // @ts-ignore
    promise = promise.catch(() => {
      let anchor = RangeAnchor.fromSelector(root, range);
      return querySelector(anchor, options).then(maybeAssertQuote);
    });
  }

  if (position) {
    // @ts-ignore
    promise = promise.catch(() => {
      let anchor = TextPositionAnchor.fromSelector(root, position);
      return querySelector(anchor, options).then(maybeAssertQuote);
    });
  }

  if (quote) {
    // @ts-ignore
    promise = promise.catch(() => {
      let anchor = TextQuoteAnchor.fromSelector(root, quote);
      return querySelector(anchor, options);
    });
  }

  return promise;
}

/**
 * @param {Node} root
 * @param {Range} range
 * @param {Object} [options]
 *   @param {string} [options.ignoreSelector]
 */
export function describe(root, range, options = {}) {
  const types = [RangeAnchor, TextPositionAnchor, TextQuoteAnchor];

  const selectors = (() => {
    const result = [];
    for (let type of types) {
      try {
        const anchor = type.fromRange(root, range);
        result.push(anchor.toSelector(options));
      } catch (error) {
        continue;
      }
    }
    return result;
  })();

  return selectors;
}
