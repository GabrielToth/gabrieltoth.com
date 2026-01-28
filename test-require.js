
try {
    console.log("Attempting to require next-intl/plugin...");
    const plugin = require('next-intl/plugin');
    console.log("Success! Plugin loaded.");
} catch (e) {
    console.error("Failed to load plugin:");
    console.error(e.code);
    console.error(e.message);
    console.error("Require stack:", e.requireStack);
}

const fs = require('fs');
const path = require('path');
const nextIntlDir = path.resolve('node_modules', 'next-intl');
console.log("Checking next-intl directory at:", nextIntlDir);

if (fs.existsSync(nextIntlDir)) {
    console.log("Directory exists.");
    try {
        console.log("Contents:", fs.readdirSync(nextIntlDir));
         const packageJson = require(path.join(nextIntlDir, 'package.json'));
         console.log("Exports:", JSON.stringify(packageJson.exports, null, 2));
    } catch (err) {
        console.error("Error reading dir:", err);
    }
} else {
    console.log("Directory DOES NOT exist.");
}
