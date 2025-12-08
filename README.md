<div align="center">

# 🚀 @poppinss/ts-exec

A JIT compiler for running TypeScript and JavaScript code in Node.js without compilation, built on top of SWC with full ESM support for Node.js 24 and above.

[![gh-workflow-image]][gh-workflow-url] [![npm-image]][npm-url] ![][typescript-image] [![license-image]][license-url]

</div>

<br />

---

## 🎯 Overview

`ts-exec` is a TypeScript execution engine that lets you run `.ts` and `.tsx` files directly in Node.js without a build step. **Unlike other popular solutions, ts-exec prioritizes compatibility with Node.js module resolution, ensuring that code running with ts-exec will work identically after compilation to JavaScript**.

<br />

## 💡 Why ts-exec exists

Existing solutions like `ts-node` and `tsx` have served the community well, but they come with significant tradeoffs that can lead to production issues.

`ts-node` is no longer actively maintained and has become bloated over time. While `tsx` offers a modern alternative, it makes a critical compromise: it allows extension-less imports and directory imports during development. This creates a dangerous disconnect. Your code runs perfectly in development but breaks in production when compiled to JavaScript, because Node.js strictly requires explicit file extensions and cannot resolve directory imports.

`ts-exec` takes a different approach. It provides the complete TypeScript feature set (including enums, legacy decorators, and JSX syntax) while strictly following Node.js file resolution rules. This means every import that works with ts-exec will work after compilation, eliminating an entire class of production deployment failures.

<br />

## ✨ Features

<table>
<tr>
<td>

🎨 **Full TypeScript support**  
Enums, legacy decorators, namespace imports, and JSX syntax

</td>
<td>

🛡️ **Production-safe imports**  
Enforces Node.js module resolution

</td>
</tr>
<tr>
<td>

📦 **Built for ESM**  
First-class support for ECMAScript modules

</td>
<td>

⚡ **Modern foundation**  
Built on SWC for fast compilation

</td>
</tr>
<tr>
<td>

🪶 **Lightweight**  
Less than 200 lines, inspired by [Amaro](https://github.com/nodejs/amaro)

</td>
<td>

⚙️ **Zero configuration**  
No custom config files needed, parses tsconfig.json automatically

</td>
</tr>
<tr>
<td>

✅ **Development confidence**  
Code that runs with ts-exec will run after compilation

</td>
</tr>
</table>

<br />

## 📦 Installation

```bash
npm i -D @poppinss/ts-exec
```

<br />

## 🚦 Usage

### Basic execution

Run any TypeScript file directly.

```bash
node --import=@poppinss/ts-exec ./src/index.ts
```

### Programmatic usage

Use ts-exec within your Node.js application.

```ts
import '@poppinss/ts-exec'

// Now you can import TypeScript files
const module = await import('./my-typescript-file.ts')
```

<br />

## 📝 Imports with `.ts` file extension

TypeScript originally made a deliberate decision to keep import paths unchanged during compilation. When you write an import in TypeScript, it stays exactly the same in the compiled JavaScript output. This design choice means you must reference the file extension that will exist after compilation, not the current TypeScript extension.

For example, when importing a TypeScript file, you write the import with a `.js` extension because that's what will exist after compilation.

```ts
export class UserService {
  // implementation
}
```

```ts
// Reference with .js even though the file is user_service.ts
import { UserService } from '../services/user_service.js'
```

After compilation, both files become `.js` files, and the import path works seamlessly with Node.js without any modifications.

Recently, the TypeScript team introduced the `rewriteRelativeImportExtensions` compiler option, which allows you to use `.ts` extensions in your imports. When this option is enabled, TypeScript will rewrite `.ts` extensions to `.js` during compilation.

If you prefer to use `.ts` extensions in your imports, enable this option in your `tsconfig.json`.

```json
{
  "compilerOptions": {
    "rewriteRelativeImportExtensions": true
  }
}
```

With this configuration, you can write imports using `.ts` extensions.

```ts
// Now you can use .ts extension
import { UserService } from '../services/user_service.ts'
```

TypeScript will automatically rewrite this to `.js` during compilation, and `ts-exec` will handle it correctly during development.

<br />

### Subpath import aliases

Subpath import aliases are defined in your `package.json` file, which remains unchanged during the TypeScript compilation process. Since `package.json` is used directly by Node.js at runtime and is never rewritten by the TypeScript compiler, the paths you define in your aliases must reference the compiled output extensions.

This means your subpath aliases should always use `.js` extensions, even when the source files are `.ts`. The `package.json` file will be the same in both development (with ts-exec) and production (with compiled JavaScript), so the paths need to work for the compiled output.

```json
{
  "name": "my-app",
  "imports": {
    "#controllers/*": "./build/controllers/*.js",
    "#services/*": "./build/services/*.js",
    "#models/*": "./build/models/*.js"
  }
}
```

With these aliases defined, you can use them in your TypeScript source files.

```ts
import { UsersController } from '#controllers/users_controller'
import { UserService } from '#services/user_service'
import { User } from '#models/user'
```

This approach works seamlessly with both `ts-exec` during development and Node.js after compilation. The aliases resolve correctly in both environments because `package.json` remains unchanged and Node.js uses it directly for module resolution.

If you have `rewriteRelativeImportExtensions` enabled in your TypeScript configuration, it will not affect subpath import aliases. The rewriting only applies to relative imports (those starting with `./` or `../`), not to bare specifiers or subpath imports.

<br />

## 🤔 Why not tsx?

If you're currently using `tsx`, you might wonder why to switch. The answer depends on your priorities.

`tsx` is excellent and fast, but it allows patterns that will fail in production. Consider this common scenario:

<table>
<tr>
<th>❌ Works with tsx (breaks after compilation)</th>
<th>✅ Works with ts-exec (works after compilation)</th>
</tr>
<tr>
<td>

```ts
// Extension-less import
import { User } from './models/user'

// Directory import
import config from './config'

// After compilation:
// Error: Cannot find module
```

</td>
<td>

```ts
// Explicit extension
import { User } from './models/user.ts'

// Explicit file
import config from './config/index.ts'

// After compilation:
// Works identically ✨
```

</td>
</tr>
</table>

Additionally, `tsx` doesn't support legacy decorators, which many projects still rely on. `ts-exec` provides full decorator support, making it compatible with frameworks and libraries that haven't migrated to the new decorator specification.

<br />

## 📊 Comparison

| Feature                       | ts-exec | tsx | ts-node | Node.js (native) |
| ----------------------------- | :-----: | :-: | :-----: | :--------------: |
| **Active maintenance**        |   ✅    | ✅  |   ❌    |        ✅        |
| **Built on SWC**              |   ✅    | ❌  |   ⚠️    |        ✅        |
| **Legacy decorators**         |   ✅    | ❌  |   ✅    |        ❌        |
| **Node.js-compliant imports** |   ✅    | ❌  |   ✅    |        ✅        |
| **ESM-first**                 |   ✅    | ✅  |   ⚠️    |        ✅        |
| **Full TypeScript features**  |   ✅    | ⚠️  |   ✅    |        ❌        |
| **Respects tsconfig.json**    |   ✅    | ✅  |   ✅    |        ❌        |
| **Lightweight**               |   ✅    | ✅  |   ❌    |        ✅        |

<br />

---

<div align="center">

## 🤝 Contributing

One of the primary goals of Poppinss is to have a vibrant community of users and contributors who believes in the principles of the framework.

We encourage you to read the [contribution guide](https://github.com/poppinss/.github/blob/main/docs/CONTRIBUTING.md) before contributing to the framework.

<br />

## 📜 Code of Conduct

In order to ensure that the poppinss community is welcoming to all, please review and abide by the [Code of Conduct](https://github.com/poppinss/.github/blob/main/docs/CODE_OF_CONDUCT.md).

<br />

## 📄 License

@poppinss/ts-exec is open-sourced software licensed under the [MIT license](LICENSE.md).

</div>

[gh-workflow-image]: https://img.shields.io/github/actions/workflow/status/poppinss/ts-exec/checks.yml?style=for-the-badge
[gh-workflow-url]: https://github.com/poppinss/ts-exec/actions/workflows/checks.yml 'Github action'
[typescript-image]: https://img.shields.io/badge/Typescript-294E80.svg?style=for-the-badge&logo=typescript
[typescript-url]: "typescript"
[npm-image]: https://img.shields.io/npm/v/@poppinss/ts-exec.svg?style=for-the-badge&logo=npm
[npm-url]: https://npmjs.org/package/@poppinss/ts-exec 'npm'
[license-image]: https://img.shields.io/npm/l/@poppinss/ts-exec?color=blueviolet&style=for-the-badge
[license-url]: LICENSE.md 'license'
