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
<td colspan="2" align="center">

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
// title: scripts/runner.ts
import '@poppinss/ts-exec'

// Now you can import TypeScript files
const module = await import('./my-typescript-file.ts')
```

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
| **Built on SWC**              |   ✅    | ✅  |   ⚠️    |        ✅        |
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
