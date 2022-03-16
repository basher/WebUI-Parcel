/**
 * Function for copying static files that are not bundled by Parcel (e.g. favicons).
 *
 * @return {void}
 */

/* eslint-disable */
const fs = require('fs-extra');
const path = require('path');

const theme = process.argv[2]; // Only passing 1 arg in Node cmd = theme name
const directoryPathInput = path.join(__dirname, `../../static/${theme}`);
const directoryPathOutput = path.join(__dirname, '../../dist/theme-build');

if (process.env.NODE_ENV === 'PROD ') {
    fs.copy(directoryPathInput, directoryPathOutput, (err) => {
        if (err) {
            return console.log(err);
        }
        console.log('Successfully copied static assets!');
    });
}
