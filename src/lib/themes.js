import tinycolor from 'tinycolor2';

import {
  colorsWithoutAlpha,
  fallbackColors,
  CUSTOM_BACKGROUND_DEFAULT_ALIGNMENT,
  advancedColorLabels,
} from '/lib/constants.js';
import defaultTheme from '/lib/default.js';

export const makeTinycolor = (colorIn) => {
  const color = { ...colorIn };
  if ('s' in color) {
    color.s = Math.floor(color.s) / 100.0;
  }
  if ('a' in color) {
    // HACK: normalize alpha value to two decimal places - LOL JS FP WTF
    if (color.a > 1.0) {
      color.a = Math.floor(color.a) / 100.0;
    }
    color.a = Math.ceil(color.a * 100) / 100.0;
  }
  return tinycolor(color);
};

export const colorToCSS = (colorIn) => makeTinycolor(colorIn).toRgbString();

export const normalizeThemeBackground = (background) => background;

// Utility to ensure normal & consistent colors
export const normalizeThemeColor = (name, data, defaultColor) => {
  const inColor = data || defaultColor;
  const color = makeTinycolor(inColor).toRgb();
  if (colorsWithoutAlpha.includes(name) || color.a === 1) {
    delete color.a;
  }
  return color;
};

export const normalizeThemeColors = (colors = {}) => {
  const out = {};
  const { colors: defaultColors } = defaultTheme;
  const resolveColor = (name) => {
    let color = colors[name];
    if (color) {
      return color;
    }
    name = fallbackColors[name];
    if (Array.isArray(name)) {
      name = name.find((n) => colors[n]);
    }
    return colors[name];
  };
  Object.keys(defaultColors).forEach((name) => {
    const matchedColor = resolveColor(name);
    const color = normalizeThemeColor(name, matchedColor, defaultColors[name]);
    out[name] = color;
  });
  Object.keys(advancedColorLabels).forEach((name) => {
    const matchedColor = resolveColor(name);
    if (matchedColor) {
      out[name] = normalizeThemeColor(name, matchedColor);
    }
  });

  return out;
};

// Utility to ensure normal properties and values in app theme state
export const normalizeTheme = (data = {}) => {
  const images = data.images ? data.images : {};
  const colors = data.colors ? data.colors : {};

  const theme = {
    colors: normalizeThemeColors(colors),
    images: {
      additional_backgrounds: [],
    },
    title: data.title,
  };

  let theme_frame = images.theme_frame || images.headerURL;
  if (theme_frame) {
    const background = normalizeThemeBackground(theme_frame);
    if (background) {
      theme.images.additional_backgrounds = [background];
    }
  }

  if (images.custom_backgrounds) {
    if (!Array.isArray(theme.images.custom_backgrounds)) {
      theme.images.custom_backgrounds = [];
    }
    theme.images.custom_backgrounds = images.custom_backgrounds || [];
  }

  if (images.additional_backgrounds) {
    const background = normalizeThemeBackground(
      images.additional_backgrounds[0]
    );
    if (background) {
      theme.images.additional_backgrounds = [background];
    }
  }

  return theme;
};

export const convertToBrowserTheme = (
  themeData,
  bgImages,
  customBackgrounds
) => {
  const newTheme = {
    images: {},
    properties: {},
    colors: {},
  };

  // Ensure that the theme data is normalized and any deprecated theme
  // property has been replaced with a supported one (and/or removed from
  // the theme object).
  const theme = normalizeTheme(themeData);

  const custom_backgrounds = theme.images.custom_backgrounds || [];
  if (custom_backgrounds.length) {
    const additional_backgrounds = [];
    const additional_backgrounds_alignment = [];
    const additional_backgrounds_tiling = [];

    custom_backgrounds.forEach(({ name, alignment, tiling }) => {
      const background = customBackgrounds[name];
      if (!background || !background.image) {
        return;
      }
      additional_backgrounds.push(background.image);
      additional_backgrounds_alignment.push(
        alignment || CUSTOM_BACKGROUND_DEFAULT_ALIGNMENT
      );
      additional_backgrounds_tiling.push(tiling || 'no-repeat');
    });

    newTheme.images.additional_backgrounds = additional_backgrounds;
    Object.assign(newTheme.properties, {
      additional_backgrounds_alignment,
      additional_backgrounds_tiling,
    });
  } else {
    const background = normalizeThemeBackground(
      theme.images.additional_backgrounds[0]
    );
    if (background) {
      newTheme.images.additional_backgrounds = [bgImages(background)];
      Object.assign(newTheme.properties, {
        additional_backgrounds_alignment: ['top'],
        additional_backgrounds_tiling: ['repeat'],
      });
    }
  }

  Object.keys(theme.colors).forEach((key) => {
    newTheme.colors[key] = colorToCSS(theme.colors[key]);
  });
  if (!theme.colors.tab_loading) {
    // TODO: we will need to actually create this field in
    // theme manifests as part of #93.
    newTheme.colors.tab_loading = colorToCSS(theme.colors.tab_line);
  }

  return newTheme;
};
