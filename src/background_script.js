import { convertToBrowserTheme, normalizeTheme } from './lib/themes.js';
import JsonUrl from 'json-url';

const LIGHT = 0;
const DARK = 1;

const jsonCodec = JsonUrl('lzma');

let currentMode = -1;

try {
  browser.browserSettings.overrideContentColorScheme.set({ value: 'system' });
} catch (e) {
  console.log('failed to get browser settings');
}

/**
 * Reads currentMode and loads from storage which theme to render
 */
async function updateTheme() {
  const urls = await browser.storage.local.get(null);
  const url = urls[currentMode === DARK ? 'dark' : 'light'];

  if (!url.startsWith('https://color.firefox.com/')) {
    // need to force the theme off and then on
    // because color.ff just modifies the theme
    // and makes it seem like it's still loaded
    // so this does a full reset
    await browser.theme.reset();
    await browser.management.setEnabled(url, false);
    await browser.management.setEnabled(url, true);
    return;
  }

  const input = await jsonCodec.decompress(
    new URL(url).searchParams.get('theme')
  );
  const t = normalizeTheme(input);
  const customBackgrounds = {};
  const bgImages = () => {};
  const newTheme = convertToBrowserTheme(t, bgImages, customBackgrounds);
  await browser.management.setEnabled('default-theme@mozilla.org', true);
  browser.theme.update(newTheme).catch((e) => {
    console.log('theme load fail', e.message);
  });
}

/**
 * @param {number} mode
 */
function toggleTo(mode) {
  if (mode === currentMode) {
    return;
  }

  currentMode = mode;

  updateTheme();
}

window.matchMedia('(prefers-color-scheme: dark)').addListener((e) => {
  toggleTo(e.matches ? DARK : LIGHT);
});

toggleTo(
  window.matchMedia('(prefers-color-scheme: dark)').matches ? DARK : LIGHT
);

browser.runtime.onMessage.addListener((request) => {
  if (request.update) {
    updateTheme();
  }
});
