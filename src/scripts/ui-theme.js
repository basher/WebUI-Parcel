/**
 * Function for Sass compilation.
 * Allows us to pass a "theme" argument that replaces the "{{ theme }}" token in "index.scss" with correct client Sass theme override.
 * If an invalid or null theme is passed, default "whitelabel" will be used.
 *
 * @param {string} %npm_package_config_theme% - UI theme name.
 *
 * @return {void}
 */

/* eslint-disable */
const fs = require('fs');
const colors = require('colors/safe');
const themes = require('./theme-config');

let theme = process.argv[2]; // Only passing 1 arg in Node cmd = theme name
const sassFile = `./src/scss/index.scss`;
const sassFileTemplate = `./src/scss/_index.scss.template`;
const jsThemeFile = `./src/ts/ui-current-theme.ts`;
const jsThemeFileTemplate = `./src/ts/ui-current-theme.ts.template`;
let result;

const writeThemeSass = data =>
  new Promise((resolve, reject) => {
    fs.writeFile(sassFile, data, { flag: 'w', encoding: 'utf8' }, err => {
      if (err) {
        reject(err);
      } else {
        resolve(console.log(`"${sassFile}" updated with correct theme`));
      }
    });
  });

const writeThemeJS = data =>
  new Promise((resolve, reject) => {
    fs.writeFile(jsThemeFile, data, { flag: 'w', encoding: 'utf8' }, err => {
      if (err) {
        reject(err);
      } else {
        resolve(console.log(`"${jsThemeFile}" updated with correct theme`));
      }
    });
  });

const updateFromSassTemplate = (data, whichTheme) =>
  new Promise((resolve, reject) => {
    fs.copyFile(sassFileTemplate, sassFile, err => {
      if (err) {
        reject(err);
      } else {
        resolve(
          console.log(`"${sassFile}" successfully updated from template`)
        );

        if (whichTheme === undefined) {
          console.log(
            colors.red.bold(
              `Invalid or null theme - using default "whitelabel" theme...`
            )
          );
          theme = 'whitelabel';
        }

        // Update Sass @imports in 'index.scss' with correct theme filepath
        result = data.replace(/{{ theme }}/g, theme);
        writeThemeSass(result);
      }
    });
  });

const updateFromJSTemplate = (data, whichTheme) =>
  new Promise((resolve, reject) => {
    fs.copyFile(jsThemeFileTemplate, jsThemeFile, err => {
      if (err) {
        reject(err);
      } else {
        resolve(
          console.log(`"${jsThemeFile}" successfully updated from template`)
        );

        if (whichTheme === undefined) {
          theme = 'whitelabel';
        }

        // Update 'ui-current-theme.ts' with correct theme filepath
        result = data.replace(/{{ theme }}/g, theme);
        writeThemeJS(result);
      }
    });
  });

// Read Sass template.
const readThemeSass = () =>
  new Promise((resolve, reject) => {
    fs.readFile(sassFileTemplate, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(updateFromSassTemplate(data, themes[theme]));
      }
    });
  });

// Read JS template.
const readThemeJS = () =>
  new Promise((resolve, reject) => {
    fs.readFile(jsThemeFileTemplate, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(updateFromJSTemplate(data, themes[theme]));
      }
    });
  });

readThemeSass();
readThemeJS();
