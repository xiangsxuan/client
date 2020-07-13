/**
 * Install an `afterEach` mocha test hook that checks for tests ending with
 * pending animation frames or timeouts.
 */
export function setupPendingTimeoutCheck({ warn = false } = {}) {
  const pendingRAFCallbacks = new Set();
  const pendingSetTimeoutCallbacks = new Set();

  const originalRAF = window.requestAnimationFrame;
  window.requestAnimationFrame = callback => {
    const id = originalRAF(() => {
      pendingRAFCallbacks.delete(id);
      callback();
    });
    pendingRAFCallbacks.add(id);
    return id;
  };

  const originalCancelRAF = window.cancelAnimationFrame;
  window.cancelAnimationFrame = id => {
    pendingRAFCallbacks.delete(id);
    originalCancelRAF(id);
  };

  const originalSetTimeout = window.setTimeout;
  window.setTimeout = (callback, delay) => {
    const id = originalSetTimeout(() => {
      pendingSetTimeoutCallbacks.delete(id);
      callback();
    }, delay);
    pendingSetTimeoutCallbacks.add(id);
    return id;
  };

  const originalClearTimeout = window.clearTimeout;
  window.clearTimeout = id => {
    pendingSetTimeoutCallbacks.delete(id);
    originalClearTimeout(id);
  };

  let warningCount = 0;
  const reportWarning = (testTitle, timeoutFunction) => {
    if (warn) {
      ++warningCount;
      console.warn(
        `Test finished with pending ${timeoutFunction} callbacks: ${testTitle} (warning #${warningCount})`
      );
    }
  };

  afterEach(function () {
    if (pendingRAFCallbacks.size > 0) {
      reportWarning(this.currentTest.title, 'requestAnimationFrame');
      for (let id of pendingRAFCallbacks) {
        cancelAnimationFrame(id);
      }
    }

    if (pendingSetTimeoutCallbacks.size > 0) {
      reportWarning(this.currentTest.title, 'setTimeout');
      for (let id of pendingSetTimeoutCallbacks) {
        clearTimeout(id);
      }
    }
  });
}
