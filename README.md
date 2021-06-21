# Light/Dark switcher

This Firefox addon bakes in functionality I suspect will eventually make its way into the browser, but in the mean time it's an extension that quietly waits for your system theme to toggle and reflects the change in your theme at the same time.

## Overview

This project uses two methods to allow the user to select their theme. The first is using the `management` permission which allows us to iterate through each theme installed in the browser.

The second method uses the excellent [color.firefox.com](https://color.firefox.com) and source code from that project to convert a `https://color.firefox.com?theme=...` URL to a theme.

Once selected, this content is stored in the `storage` addon feature.

Under the hood, a background script watches a media query and fires an event when it changes:

```
window.matchMedia('(prefers-color-scheme: dark)').addListener((e) => {
  toggleTo(e.matches ? DARK : LIGHT);
});
```

## Specific notes about code/linting

- Function eval is being used in a 3rd party module, specifically: `json-url` - this is used by the color.firefox project to convert encoded themes into JSON (saving a handful of bytes)
- `innerHTML` is used to generate the list of theme options - this is consistently faster both in render time and writing time to use over DOM scripting, and is controlled by the addon and not user generated.

## To test and develop

- `npm run dev` will generate the root `background.html` file required for testing
- `npm run build` to generate a new build

## License

- [MIT License](https://rem.mit-license.org/)
