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

function patchGestureHandlerModuleId(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  const targetPattern = /moduleId \?\?=\s*(?:typeof RNGestureHandlerModule\?\.getModuleId === 'function'\s*\?\s*RNGestureHandlerModule\.getModuleId\(\)\s*:\s*-1|RNGestureHandlerModule\.getModuleId\(\));/;
  const replacement = `moduleId ??=\n    typeof RNGestureHandlerModule?.getModuleId === 'function'\n      ? RNGestureHandlerModule.getModuleId()\n      : 0;`;

  if (targetPattern.test(content)) {
    content = content.replace(targetPattern, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Successfully patched gesture-handler moduleId: ${path.relative(process.cwd(), filePath)}`);
  }
}

function patchGestureHandlerRootViewAndroid(filePath, isTsx) {
  if (!fs.existsSync(filePath)) {
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  if (isTsx) {
    if (!content.includes('hasNativeModuleId')) {
      content = content.replace(
        "import { StyleSheet } from 'react-native';",
        "import { StyleSheet, View } from 'react-native';\nimport RNGestureHandlerModule from '../RNGestureHandlerModule';"
      );
      content = content.replace(
        `<GestureHandlerRootViewNativeComponent
        style={style ?? styles.container}
        {...rest}
        moduleId={getModuleId()}
      />`,
        `{typeof RNGestureHandlerModule?.getModuleId === 'function' ? (
        <GestureHandlerRootViewNativeComponent
          style={style ?? styles.container}
          {...rest}
          moduleId={getModuleId()}
        />
      ) : (
        <View style={style ?? styles.container} {...rest} />
      )}`
      );
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Successfully patched gesture-handler RootView android tsx: ${path.relative(process.cwd(), filePath)}`);
    }
  } else {
    if (!content.includes('hasNativeModuleId')) {
      content = content.replace(
        "import { StyleSheet } from 'react-native';",
        "import { StyleSheet, View } from 'react-native';\nimport RNGestureHandlerModule from '../RNGestureHandlerModule';"
      );
      content = content.replace(
        `children: /*#__PURE__*/_jsx(GestureHandlerRootViewNativeComponent, {
      style: style ?? styles.container,
      ...rest,
      moduleId: getModuleId()
    })`,
        `children: typeof RNGestureHandlerModule?.getModuleId === 'function' ? /*#__PURE__*/_jsx(GestureHandlerRootViewNativeComponent, {
      style: style ?? styles.container,
      ...rest,
      moduleId: getModuleId()
    }) : /*#__PURE__*/_jsx(View, {
      style: style ?? styles.container,
      ...rest
    })`
      );
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Successfully patched gesture-handler RootView android js: ${path.relative(process.cwd(), filePath)}`);
    }
  }
}

const ghSrc = path.join(__dirname, '..', 'node_modules', 'react-native-gesture-handler', 'src', 'moduleId.ts');
const ghDist = path.join(__dirname, '..', 'node_modules', 'react-native-gesture-handler', 'lib', 'module', 'moduleId.js');
patchGestureHandlerModuleId(ghSrc);
patchGestureHandlerModuleId(ghDist);

const ghRvSrc = path.join(__dirname, '..', 'node_modules', 'react-native-gesture-handler', 'src', 'components', 'GestureHandlerRootView.android.tsx');
const ghRvDist = path.join(__dirname, '..', 'node_modules', 'react-native-gesture-handler', 'lib', 'module', 'components', 'GestureHandlerRootView.android.js');
patchGestureHandlerRootViewAndroid(ghRvSrc, true);
patchGestureHandlerRootViewAndroid(ghRvDist, false);

function patchNativeInteropFunctionStyle(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const collectFnMatch = /function collectInlineRules\([\s\S]*?\n\}/.exec(content);
  if (!collectFnMatch) {
    console.warn(`collectInlineRules not found in ${path.relative(process.cwd(), filePath)}`);
    return;
  }

  const originalFn = collectFnMatch[0];
  if (originalFn.includes('typeof target !== "function"') || originalFn.includes("typeof target !== 'function'")) {
    console.log(`Already patched collectInlineRules in ${path.relative(process.cwd(), filePath)}`);
    return;
  }

  if (!originalFn.includes('else if (target) {')) {
    console.warn(`Expected branch not found in collectInlineRules of ${path.relative(process.cwd(), filePath)}`);
    return;
  }

  const updatedFn = originalFn.replace(
    'else if (target) {',
    'else if (target && typeof target !== "function") {'
  );
  const nextContent =
    content.slice(0, collectFnMatch.index) +
    updatedFn +
    content.slice(collectFnMatch.index + originalFn.length);
  fs.writeFileSync(filePath, nextContent, 'utf8');
  console.log(`Successfully patched collectInlineRules in ${path.relative(process.cwd(), filePath)}`);
}

const cssInteropNativeDist = path.join(__dirname, '..', 'node_modules', 'react-native-css-interop', 'dist', 'runtime', 'native', 'native-interop.js');
const cssInteropNativeSrc = path.join(__dirname, '..', 'node_modules', 'react-native-css-interop', 'src', 'runtime', 'native', 'native-interop.ts');
patchNativeInteropFunctionStyle(cssInteropNativeDist);
patchNativeInteropFunctionStyle(cssInteropNativeSrc);


