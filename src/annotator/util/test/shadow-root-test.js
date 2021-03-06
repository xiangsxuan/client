import { createShadowRoot } from '../shadow-root';

describe('annotator/util/shadow-root', () => {
  describe('createShadowRoot', () => {
    it('attaches a shadow root to the container', () => {
      const container = document.createElement('div');

      const shadowRoot = createShadowRoot(container);

      assert.ok(shadowRoot);
      assert.equal(container.shadowRoot, shadowRoot);
    });

    it('does not attach a shadow root if Shadow DOM is unavailable', () => {
      const container = document.createElement('div');
      container.attachShadow = null;

      const shadowRoot = createShadowRoot(container);

      assert.equal(shadowRoot, container);
    });

    it('injects stylesheets into the shadow root', () => {
      const container = document.createElement('div');

      createShadowRoot(container);

      const styleEl = container.shadowRoot.querySelector('style');
      assert.ok(styleEl);
      assert.match(styleEl.textContent, /@import ".*annotator\.css.*"/);
    });
  });
});
