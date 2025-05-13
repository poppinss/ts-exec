/*
 * ts-exec
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { tmpdir } from 'node:os'
import { test } from '@japa/runner'
import { join } from 'node:path/posix'
import { getConfig } from '../src/get_config.ts'

test.group('Get config', () => {
  test('return default config when unable to find tsconfig.json file', ({ assert }) => {
    assert.snapshot(getConfig(tmpdir())).matchInline(`
      {
        "swcConfig": {
          "jsc": {
            "externalHelpers": false,
            "keepClassNames": true,
            "parser": {
              "decorators": true,
              "dynamicImport": true,
              "syntax": "typescript",
              "tsx": true,
            },
            "target": "esnext",
            "transform": {
              "decoratorMetadata": true,
              "legacyDecorator": true,
              "react": {
                "runtime": "automatic",
              },
              "useDefineForClassFields": true,
              "verbatimModuleSyntax": true,
            },
          },
          "module": {
            "type": "es6",
          },
          "sourceMaps": true,
        },
        "tsConfig": null,
        "tsConfigPath": null,
      }
    `)
  })

  test('create swc config based upon define tsconfig.json file', async ({ assert, fs }) => {
    await fs.createJson('tsconfig.json', {
      compilerOptions: {
        sourceMaps: false,
        verbatimModuleSyntax: true,
      },
    })

    assert.snapshot(getConfig(fs.baseUrl)).matchInline(`
      {
        "swcConfig": {
          "jsc": {
            "baseUrl": undefined,
            "externalHelpers": false,
            "keepClassNames": true,
            "parser": {
              "decorators": true,
              "dynamicImport": true,
              "syntax": "typescript",
              "tsx": false,
            },
            "target": "esnext",
            "transform": {
              "react": {
                "runtime": "automatic",
              },
              "verbatimModuleSyntax": true,
            },
          },
          "module": {
            "type": "es6",
          },
          "sourceMaps": true,
        },
        "tsConfig": {
          "compilerOptions": {
            "isolatedModules": true,
            "preserveConstEnums": true,
            "sourceMaps": false,
            "verbatimModuleSyntax": true,
          },
        },
        "tsConfigPath": "${join(fs.basePath.replace(/\\/g, '/'), 'tsconfig.json')}",
      }
    `)
  })

  test('pick module from the tsconfig.json file', async ({ assert, fs }) => {
    await fs.createJson('tsconfig.json', {
      compilerOptions: {
        sourceMaps: false,
        target: 'ES2020',
        verbatimModuleSyntax: true,
      },
    })

    assert.snapshot(getConfig(fs.baseUrl)).matchInline(`
      {
        "swcConfig": {
          "jsc": {
            "baseUrl": undefined,
            "externalHelpers": false,
            "keepClassNames": true,
            "parser": {
              "decorators": true,
              "dynamicImport": true,
              "syntax": "typescript",
              "tsx": false,
            },
            "target": "es2020",
            "transform": {
              "react": {
                "runtime": "automatic",
              },
              "verbatimModuleSyntax": true,
            },
          },
          "module": {
            "type": "es6",
          },
          "sourceMaps": true,
        },
        "tsConfig": {
          "compilerOptions": {
            "isolatedModules": true,
            "module": "es6",
            "moduleResolution": "classic",
            "preserveConstEnums": true,
            "sourceMaps": false,
            "target": "es2020",
            "verbatimModuleSyntax": true,
          },
        },
        "tsConfigPath": "${join(fs.basePath.replace(/\\/g, '/'), 'tsconfig.json')}",
      }
    `)
  })

  test('read tsconfig.json file from a monorepo', async ({ assert, fs }) => {
    await fs.createJson('tsconfig.json', {
      compilerOptions: {
        sourceMaps: false,
        verbatimModuleSyntax: true,
      },
    })
    await fs.createJson('packages/ui/package.json', {})

    assert.snapshot(getConfig(join(fs.basePath, 'packages/ui'))).matchInline(`
      {
        "swcConfig": {
          "jsc": {
            "baseUrl": undefined,
            "externalHelpers": false,
            "keepClassNames": true,
            "parser": {
              "decorators": true,
              "dynamicImport": true,
              "syntax": "typescript",
              "tsx": false,
            },
            "target": "esnext",
            "transform": {
              "react": {
                "runtime": "automatic",
              },
              "verbatimModuleSyntax": true,
            },
          },
          "module": {
            "type": "es6",
          },
          "sourceMaps": true,
        },
        "tsConfig": {
          "compilerOptions": {
            "isolatedModules": true,
            "preserveConstEnums": true,
            "sourceMaps": false,
            "verbatimModuleSyntax": true,
          },
        },
        "tsConfigPath": "${join(fs.basePath.replace(/\\/g, '/'), 'tsconfig.json')}",
      }
    `)
  })
})
