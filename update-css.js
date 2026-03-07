const fs = require('fs');
const indexCssPath = 'web/src/index.css';
const newCssPath = 'web/src/profile_styles.css';

const indexCss = fs.readFileSync(indexCssPath, 'utf8');
const lines = indexCss.split('\n');

const newCss = fs.readFileSync(newCssPath, 'utf8');

// Replace lines 1724 (index 1723) to 2873 (index 2872)
const before = lines.slice(0, 1723).join('\n');
const after = lines.slice(2873).join('\n'); // Line 2874 is index 2873

const combined = before + '\n' + newCss + '\n' + after;

fs.writeFileSync(indexCssPath, combined, 'utf8');
console.log('Replaced profile CSS block successfully.');
