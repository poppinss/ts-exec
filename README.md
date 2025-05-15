# @poppinss/ts-exec

TypeScript JIT compiler built for correctness and supports legacy/experimental decorators.

<br />

[![gh-workflow-image]][gh-workflow-url] [![npm-image]][npm-url] ![][typescript-image] [![license-image]][license-url]

> [!IMPORTANT]  
> The `@poppinss/ts-exec` package requires `Node.js >= 24` and works with only ES modules.

## Usage

Install the package from the npm packages registry.

```sh
npm i -D @poppinss/ts-exec
```

Once installed you can use it via the `--import` flag to execute the TypeScript source code.

```sh
node --import=@poppinss/ts-exec some-script.ts
```

## Why another package?

## Contributing

One of the primary goals of Poppinss is to have a vibrant community of users and contributors who believes in the principles of the framework.

We encourage you to read the [contribution guide](https://github.com/poppinss/.github/blob/main/docs/CONTRIBUTING.md) before contributing to the framework.

## Code of Conduct

In order to ensure that the poppinss community is welcoming to all, please review and abide by the [Code of Conduct](https://github.com/poppinss/.github/blob/main/docs/CODE_OF_CONDUCT.md).

## License

<pkg-name> is open-sourced software licensed under the [MIT license](LICENSE.md).

[gh-workflow-image]: https://img.shields.io/github/actions/workflow/status/poppinss/ts-exec/checks.yml?style=for-the-badge
[gh-workflow-url]: https://github.com/poppinss/ts-exec/actions/workflows/checks.yml 'Github action'
[typescript-image]: https://img.shields.io/badge/Typescript-294E80.svg?style=for-the-badge&logo=typescript
[typescript-url]: "typescript"
[npm-image]: https://img.shields.io/npm/v/@poppinss/ts-exec.svg?style=for-the-badge&logo=npm
[npm-url]: https://npmjs.org/package/@poppinss/ts-exec 'npm'
[license-image]: https://img.shields.io/npm/l/@poppinss/ts-exec?color=blueviolet&style=for-the-badge
[license-url]: LICENSE.md 'license'
