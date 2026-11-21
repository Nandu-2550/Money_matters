const fs = require('fs');
const path = require('path');

const nativeJsPath = path.join(__dirname, 'node_modules', 'rollup', 'dist', 'native.js');

if (fs.existsSync(nativeJsPath)) {
  let content = fs.readFileSync(nativeJsPath, 'utf8');
  if (!content.includes('@rollup/wasm-node/dist/native.js')) {
    content = content.replace(
      /const nativeModule = requireWithFriendlyError\([\s\S]*?\);/,
      `let nativeModule;
try {
\tnativeModule = requireWithFriendlyError(
\t\texistsSync(path.join(__dirname, localName)) ? localName : \`@rollup/rollup-\${packageBase}\`
\t);
} catch (err) {
\tnativeModule = require('@rollup/wasm-node/dist/native.js');
}`
    );
    fs.writeFileSync(nativeJsPath, content, 'utf8');
    console.log('[MoneyMatters] Rollup wasm fallback successfully patched.');
  }
}
