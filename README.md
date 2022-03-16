# Web UI architecture with Parcel bundler

[[_TOC_]]

## QUICK START - How to use the UI assets in this repo for local development

>> NOTE: We use Node environment variables for theming in the Parcel `start/build` commands, but there seems to be an issue in Node 16. We therefore need to use an earlier version (e.g. Node 14) for Parcel, hence the need to install `Node Version Manager` in step 1 to allow multiple versions of Node to be installed concurrently on the same machine. Be aware that the Azure build pipelines currently use Node 12.18.4.
> 1. Install `nvm-windows` via the [nvm-setup.zip download](https://github.com/coreybutler/nvm-windows/releases). Once installed, run the following commands from a terminal with **administrator privileges**.
>```
> nvm install 14
> nvm use 14.19.0
>```
> 2. Clone the [WebUI repo](TBC/_git/WebUI).
> 3. From the repo's root directory, install all the project dependencies:
> ```
> npm install
> ```
> 4. Add an empty `\dist` folder to the root directory.
>> The preceding steps are a **one time only** operation.
> 5. From root directory, launch the `WebUI Parcel server` on port `1234` with the `whitelabel` theme:
> ```
> npm run start:theme --web-ui-parcel:theme=whitelabel
> ```
>> NOTE: The start (and build) commands make use of Node config variables in the `.npmrc` file. On Windows, change all references of `$npm_package_config_theme` in the `package.json` to `%npm_package_config_theme%`.
> 6. Leave this Node process running, but you can close the `localhost:1234` browser tab if it is opened.
> 7. Start Storybook or your local dev (.NET) server, and ensure your rendered HTML contains the theme CSS in the document `<head>` and JavaScript at the end of the `<body>`:
> ```
> <link href="http://localhost:1234/index.css" rel="stylesheet" />
>
> <script defer src="http://localhost:1234/index.js"></script>
> ```
> 8. To load a different theme, kill the Node process from step 5 with `CTRL+C`, and launch Parcel server with a different theme (e.g. theme1):
> ```
> npm run start:theme --web-ui-parcel:theme=theme1
> ```
> 9. Refresh Storybook or your local dev (.NET) browser to render the new theme.

## Parcel UI asset bundling

- We're using Parcel to bundle all the UI assets (CSS, JavaScript, fonts, etc).
- See [Parcel bundler docs](https://parceljs.org/getting_started.html) for more information.

### Installing NPM packages

- Run `npm install` inside this repo's root folder from a command prompt.
- We're using an `npm-shrinkwrap.json` file to lock down all NPM packages. This ensures that any developer or CI pipeline that runs `npm install` will get the same versions of all NPM packages.
- See [NPM shrinwrap docs](https://docs.npmjs.com/cli/shrinkwrap) for more information.

### Default `browserslist` configuration in `package.json`

- This default configuration ensures that `TypeScript`, `babel` and `autoprefixer` will correctly transpile our JavaScript/CSS to work in the browsers specified.
```json
"browserslist": [
    "defaults",
    "not ie 11"
]
```
- See [browserslist best practices](https://github.com/browserslist/browserslist#best-practices) documentation.

### Specifying Parcel `targets`
- By default, in DEV mode, Parcel bundles assets for modern browsers only.
- To enable JavaScript transpilation for older browsers in DEV mode, the Parcel `start` command needs the `--target app`
parameter, and there needs to be a `"targets": { "app": {} }` property in the `package.json`.
### Optimising UI bundle size

- Ensures modern (and legacy) browsers download only what they need in terms of CSS/JavaScript.
- For example, by using [code splitting / dynamic imports](https://v2.parceljs.org/features/code-splitting/) and/or  [differential bundling](https://github.com/parcel-bundler/parcel/issues/3011) and/or [npm targets](https://v2.parceljs.org/configuration/package-json/#targets).

#### Code splitting with dynamic imports

- We're using dynamic imports inside `.\src\ts\index.ts` to create a separate `polyfills.js` bundle for [legacy browsers that need them](https://philipwalton.com/articles/loading-polyfills-only-when-needed/).
- We also dynamically import certain components that are not regarded as "**core platform**" features. This is managed **per theme** inside `..\src\ts\ui-init-theme.ts`.
- This massively reduces the JavaScript bundle size for modern browsers.
- Unfortunately, we are not able to further optimise bundle size with differential bundling, as we cannot dynamically set `theme-specific npm package entry points` to use in conjunction with different `npm targets`.

## UI code formatting & linting

- This repo requires `eslint`, `stylelint` and `prettier`.
- They are all installed, after cloning the repo, by running `npm install`.
- Developers are encouraged to also install the appropriate VSCode extensions for these linters to assist with identifying formatting & linting issues at the code authoring stage.
- We use `git hooks` (via `husky` and `lint-staged`) to ensure no linting errors are committed to the remote codebase.

> NOTES:
> - `eslint` errors will only be shown in VSCode if you open VSCode from the project root folder, not a parent folder.
> - VSCode `stylelint` extension introduced breaking changes in V14. To lint Sass files, you need to add the following into your VSCode `settings.json` file:
> ```
> "css.validate": false,
> "scss.validate": false,
> "stylelint.enable": true,
> "stylelint.validate": [
>     "scss",
>     "postcss"
> ]
> ```

## HTML authoring guidelines

> These have been moved to [Web UI Storybook repo README](TBC/_git/WebUIStorybook).

### Progressive enhancement, and "no JavaScript" behaviour

- The UI should work without JavaScript.
- To test this, comment out all instances of the following in `.\src\ts\index.ts`:
> ```
> gwUIinit();
> ```

### Accessibility and WAI-ARIA

- Start with semantic HTML5, and progressively enhance.
- See [WAI-ARIA authoring practices](https://www.w3.org/TR/wai-aria-practices-1.1/).
- See [inclusive components](https://inclusive-components.design/).

## JavaScript architecture

- We're using `TypeScript`, so all files end in `.ts`.
- Author code using `ES6+` syntax, which is transpiled to ES5 by Babel and TypeScript for older browsers.
- We wrap any JavaScript code that requires DOM manipulation inside a `domready` event in `.\src\ts\index.ts`.

### JavaScript folder structure

```tree
.\src\ts
├───components [FOLDER]
│   ├─── ...
├───utils [FOLDER]
│   ├─── ...
├───index.ts
├───polyfills.ts
├───ui-current-theme.ts
├───ui-current-theme.ts.template
├───ui-init-theme.ts
├───ui-init.ts
```

- `.\src\ts\index.ts` is the entry point for Parcel bundler. All JavaScript and Sass code is imported for bundling inside this file.
- `.\src\ts\ui-init.ts` imports and instantiates all the UI component modules.
- `.\src\ts\polyfills.ts` contains all polyfills/ponyfills for legacy browsers.
- `.\src\ts\components\` folder contains individual component-level code.
- `.\src\ts\utils\` folder contains global utils/helper functions.

#### JavaScript theming

- `.\src\ts\ui-init-theme.ts` dynamically imports and instantiates all theme-specific UI component modules.

## Sass architecture

- Mobile first, with media queries that handle layouts as screen real estate increases.
- Inside our main entry point `.\src\ts\index.ts`, we import a single Sass file `.\src\scss\index.scss`, which itself imports all the required Sass partials.
- The Sass compilation to CSS is performed by Parcel when `npm start...` or `npm build...` commands are run.

### PostCSS, ponyfills and legacy browser support

- Parcel comes with `Autprefixer` as standard, so there's no need to author vendor prefixes, with a few exceptions for `-webkit-` and `-moz-`.
- `postcss-logical` and `postcss-dir-pseudo-class` are included to allow us to use logical CSS properties without having to worry about coding fallbacks, or worrying about `LTR` and `RTL` languages - e.g.

```scss
.element {
    margin-block-start: 1rem;
    margin-inline-start: 1rem;
}
```

- Gets compiled to the following:

```scss
[dir="ltr"] .element {
    margin-top: 1rem;
    margin-left: 1rem;
}
[dir="rtl"] .element {
    margin-top: 1rem;
    margin-right: 1rem;
}
.element {
    margin-block-start: 1rem;
    margin-inline-start: 1rem;
}
```

### CSS namespacing with BEM and `gw-` prefix

- CSS scope and encapsulation is facilitated by a strict adherence to BEM naming convention for class names in the HTML - i.e. `block__element--modifier`.
- Additionally, all classnames will be prefixed with `gw-`.
- For example, a `gw-widget` component might have a `gw-widget__title` element, and a `gw-widget--small` modifier

```html
<article class="gw-widget gw-widget--small">
    <h2 class="gw-widget__title">Title...</h2>
    ...
</article>
```

```scss
.gw-widget {
    &__title {
        // styles...
    }

    &--small {
        // styles...
    }
}
```

### Sass folder structure

```tree
.\src\scss
├───_THEMES [FOLDER]
│   ├───theme1
│   │   └───components [FOLDER]
│   │   └───fonts [FOLDER]
│   │   └───globals [FOLDER]
│   │   └───multi-franchise [FOLDER]
│   │   └───_theme1.scss
│   │   └───_root-css-vars.scss
├───base [FOLDER]
│   ├─── ...
├───components [FOLDER]
│   ├─── ...
├───fonts [FOLDER]
│   ├─── ...
├───globals [FOLDER]
│   ├─── ...
├───multi-franchise [FOLDER]
│   ├─── ...
├───pages [FOLDER]
│   ├─── ...
├───_base.scss
├───_components.scss
├───_fonts.scss
├───_globals.scss
├───_index.scss.template
├───_multi-franchise.scss
├───_pages.scss
├───_print-pages.scss
├───_print.scss
├───index.scss
```

- `.\src\scss\index.scss` is the entry point for all the Sass imports.

### CSS custom properties (aka CSS variables)

- `.\src\scss\_THEMES\[theme]\_root-css-vars.scss` contains high level theme CSS variables - e.g. main theme colors and fonts:

```scss
:root {
  --themeColorBrand: 43, 150, 205;
  --themeFontFamily: FordAntennaRegular;
}
```

- These are then mapped to their equivalent Sass variables inside `.\src\base\` folder - e.g. colors:

```scss
$color-brand: #{'rgb(var(--themeColorBrand))'} !default;
```

- This methodology allows us to customise certain aspects of the themes at `runtime`, either via JavaScript, or adding a `<style>` block to the HTML (via the CMS) - e.g.

```html
<style id="theme">
    :root {
        --themeColorBrand: tomato;
    }
</style>
```

### Base styles

- `.\src\scss\base\` folder contains all the `!default` Sass variables required to scaffold the UI.

> In order for theming to work, every `base` Sass variable declaration must have the `!default` flag.

- To make the variables easier to maintain, they are grouped logically into smaller partials.

### Component styles

- `.\src\scss\components\` folder contains styles specific to each UI component.

### Fonts

- `.\src\scss\fonts\` folder contains all appropriate fonts/typefaces.
- `.\src\scss\_fonts.scss\` contains all the `@font-face` rules.

### Global styles

- `.\src\scss\globals\` folder contains global styles that apply across the entire UI.
- e.g. CSS reset, some useful utility classes, and basic typographical styles.

### Multi-franchise styles

- `.\src\scss\multi-franchise\` folder contains styles specific to each franchise.
- Each multi-franchise page in the CMS has a classname on the `<body>` - e.g. `class="multif-ford"`.

### Page styles

- `.\src\scss\pages\` folder contains styles specific to each page.
- Each page in the CMS has a unique `pageId` which is reflected in the classname on the `<body>` - e.g. homepage has `class="page-1"`.

### CSS theming - Sass override styles

- Inside each `.\src\scss\_THEMES\` folder, any of the Sass variables in `.\src\scss\base\` folder can be overridden inside `_theme1.scss`, `_theme2.scss`, etc.
- Component-level theme overrides can be applied by adding a components folder containing Sass partials - e.g. `.\src\scss\_THEMES\theme1\components\_widget.scss`.
- Similarly, global/sitewide theme overrides can be applied by adding a globals folder containing Sass partials - e.g. `.\src\scss\_THEMES\theme1\globals\_typography.scss`.
- And page-specific theme overrides can be applied by adding a pages folder containing Sass partials - e.g. `.\src\scss\_THEMES\theme1\pages\_page-1-homepage.scss`.
- Finally, font/typeface overrides can be applied by adding a fonts folder containing a single Sass partial - e.g. `.\src\scss\_THEMES\theme1\fonts\_fonts.scss` - which declares all the `@font-face` rules. This theme-specific fonts folder should also contain sub-folder(s) with all the fonts/typefaces.

### Print styles

- `.\src\scss\_print.scss\` contains all the `@media print` rules.
- `.\src\scss\_print-pages.scss\` contains all the `@media print` rules for specific pages.

## Changing UI theme

> Do **NOT** run this Node script:
```
npm run ui-theme [theme-name]
```
> Instead,  **DO** run this Node start command:
```
npm run start:theme --web-ui-parcel:theme=[theme-name]
```
- This starts the Parcel server, and invokes the Node script above, which re-writes `.\src\scss\index.scss`, using `.\src\scss\_index.scss.template` and replacing the `{{ theme }}` token with the appropriate theme name.
- If an invalid or null theme is supplied, the default whitelabel theme will be used.
- Valid themes are stored in `.src\scripts\theme-config.js`.

> See [this NPM CLI comment](https://github.com/npm/npm/issues/9627#issuecomment-152607809) for more details about setting and overriding NPM script config parameters, as used in the start command above.

### Component-level theming

- Every component Sass partial inside `.\src\components\` must have a `@if mixin-exists()` directive at the end.
- Replace `widget` with the actual component name:

```scss
@if mixin-exists(gw-widget) {
    @include gw-widget;
}
```
- And the component's Sass partial theme override needs to have a `@mixin` directive, replacing `widget` with the actual component name.
- For example, `.\src\scss\_THEMES\theme1\components\_widget.scss`:

```scss
@mixin gw-widget {
    .gw-widget {
        // override styles go here...
    }
}
```

### Global/sitewide theming

- As per component theming above, but applied to Sass partials inside `.\src\globals\`.

## Testing UI theme in browser

- Ensure the Parcel server is started with the correct theme, as mentioned earlier.
- Then:
    - Start Storybook if you want to develop/test UI components in isolation - follow the instructions in [Web UI Storybook repo README](TBC/_git/WebUIStorybook).
    - Or refresh your local .NET dev environment.

> - We have disabled Hot Module Reloading (HMR) in Parcel because it doesn't work when accessed from another repo, and causes browser console errors.
> - This means that CSS/JavaScript changes do **NOT** automatically refresh the UI.

## Storybook - UI component library

- We're using [Storybook](https://storybook.js.org/) to build a library of re-usable UI components, which will act as templates for the HTML in the .NET MVC dealer websites.
- All Storybook code has now been moved into the [Web UI Storybook repo](TBC/_git/WebUIStorybook).

## Bundling other static assets without Parcel
- As part of the build command, the `copy-static-assets` script is run to copy static assets (e.g. SVG sprites, favicons) to the build folder.
- These are located in `static/[theme-name]/` folders.

## Building UI assets locally (to test production build)

- Creates minified static assets with map files in `dist/theme-build` folder, with the correct theme applied:
```
npm run build:theme --web-ui-parcel:theme=[theme-name]
```

### Differential bundling for JavaScript
- See [this article](https://web.dev/publish-modern-javascript/) that explains how to ship modern JavaScript (ES6+) that is not transpiled to modern browsers, and transpiled ES5 to older browsers.
- We achieve this by changing our Node entry point in the build step in `package.json` to be `index.html`:
```
parcel build index.html ...
```
- This HTML file contains:
```
<script defer type="module" src="./src/ts/index.ts"></script>
```
- This allows Parcel to build 2 JavaScript bundles, which can then be referenced in our production HTML using 2 `<script>` tags:
```
<script defer type="module" src="[modern-bundle]"></script>
<script defer nomodule src="[legacy-bundle]"></script>
```

### Publishing UI assets for use in PRODUCTION Storybook

- Use the following script to build assets for consumption by Storybook.
```
npm run build:theme-storybook --web-ui-parcel:theme=[theme-name]
```
- Full instructions for deployment can be found in Storybook itself.
