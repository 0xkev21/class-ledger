const fs = require('fs');
const path = require('path');

const targetDist = path.join(__dirname, '..', 'node_modules', 'react-native-css-interop', 'dist', 'runtime', 'native', 'render-component.js');
const targetSrc = path.join(__dirname, '..', 'node_modules', 'react-native-css-interop', 'src', 'runtime', 'native', 'render-component.tsx');

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');

  // Guard against throwing getters and deep React element recursion
  const oldStringifyPattern = /function stringify\([\s\S]*?\n\}/;
  const safeStringify = `function stringify(object) {
    const seen = new WeakSet();
    return JSON.stringify(object, function replace(key, value) {
        if (!(value !== null && typeof value === "object")) {
            return value;
        }
        if (value.$$typeof || value._owner) {
            return "[ReactElement]";
        }
        if (seen.has(value)) {
            return "[Circular]";
        }
        seen.add(value);
        const newValue = Array.isArray(value) ? [] : {};
        try {
            for (const propKey of Object.keys(value)) {
                try {
                    newValue[propKey] = replace(propKey, value[propKey]);
                } catch {
                    newValue[propKey] = "[Unreadable]";
                }
            }
        } catch {
            return "[Unserializable]";
        }
        seen.delete(value);
        return newValue;
    }, 2);
}`;

  const oldPrintWarningPattern = /function printUpgradeWarning\([\s\S]*?\n\}/;
  const safePrintWarning = `function printUpgradeWarning(warning, originalProps) {
    let serialized = "";
    try {
        serialized = stringify(originalProps);
    } catch {
        serialized = "[Unable to serialize props]";
    }
    console.warn(\`CssInterop upgrade warning.\\n\\n\${warning}.\\n\\nThis warning was caused by a component with the props:\\n\${serialized}\\n\\nIf adding or removing sibling components caused this warning you should add a unique "key" prop to your components. https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key\\n\`);
}`;

  if (oldPrintWarningPattern.test(content) && oldStringifyPattern.test(content)) {
    content = content.replace(oldPrintWarningPattern, safePrintWarning);
    content = content.replace(oldStringifyPattern, safeStringify);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Successfully patched ${path.relative(process.cwd(), filePath)}`);
  } else {
    console.log(`File already patched or pattern not found: ${path.relative(process.cwd(), filePath)}`);
  }
}

patchFile(targetDist);
patchFile(targetSrc);
