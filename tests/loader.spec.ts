/*
 * ts-exec
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'node:path'
import { test } from '@japa/runner'
import { spawnPromisified } from './helpers.ts'

test.group('Loader', (group) => {
  group.each.setup(({ context }) => {
    process.env.TS_EXEC_PWD = context.fs.basePath
    return () => {
      delete process.env.TS_EXEC_PWD
    }
  })

  test('import typescript files using .js extension', async ({ assert, fs }) => {
    await fs.createJson('tsconfig.json', {
      compilerOptions: {
        rewriteRelativeImportExtensions: false,
      },
    })

    await fs.create(
      'index.ts',
      `
      import { User } from './user.js'
      const user = new User()
      user.create(1)
    `
    )

    await fs.create(
      'user.ts',
      `export class User {
        create(id: number) {
          console.log('creating user with id ' + id)
        }
      }
    `
    )

    const result = await spawnPromisified(
      process.execPath,
      ['--no-warnings', '--import', './build/index.js', join(fs.basePath, 'index.ts')],
      {}
    )

    assert.equal(result.stdout.trim(), 'creating user with id 1')
  })

  test('import cjs and mjs files', async ({ assert, fs }) => {
    await fs.createJson('tsconfig.json', {
      compilerOptions: {
        rewriteRelativeImportExtensions: false,
      },
    })

    await fs.create(
      'index.ts',
      `
      import cjsDirname from './get_path.cjs'
      import moduleDirname from './get_path.mjs'

      console.log(cjsDirname.default)
      console.log(moduleDirname)
    `
    )

    await fs.create('get_path.cts', `export default __dirname`)
    await fs.create('get_path.mts', `export default import.meta.dirname`)

    const result = await spawnPromisified(
      process.execPath,
      ['--no-warnings', '--import', './build/index.js', join(fs.basePath, 'index.ts')],
      {}
    )

    assert.equal(result.stdout.trim(), `${fs.basePath}\n${fs.basePath}`)
  })

  test('allow importing files with .ts extension', async ({ assert, fs }) => {
    await fs.createJson('tsconfig.json', {
      compilerOptions: {
        rewriteRelativeImportExtensions: true,
      },
    })

    await fs.create(
      'index.ts',
      `
      import moduleDirname from './get_path.ts'
      console.log(moduleDirname)
    `
    )

    await fs.create('get_path.ts', `export default import.meta.dirname`)

    const result = await spawnPromisified(
      process.execPath,
      ['--no-warnings', '--import', './build/index.js', join(fs.basePath, 'index.ts')],
      {}
    )

    assert.equal(result.stdout.trim(), fs.basePath)
  })

  test('disallow index imports', async ({ assert, fs }) => {
    await fs.create(
      'index.ts',
      `
      import moduleDirname from './get_path'
      console.log(moduleDirname)
    `
    )

    await fs.create('get_path/index.ts', `export default import.meta.dirname`)

    const result = await spawnPromisified(
      process.execPath,
      ['--no-warnings', '--import', './build/index.js', join(fs.basePath, 'index.ts')],
      {}
    )

    assert.include(result.stderr.trim(), 'Error [ERR_UNSUPPORTED_DIR_IMPORT]: Directory import')
    assert.equal(result.stdout.trim(), '')
  })

  test('disallow non-file extension imports', async ({ assert, fs }) => {
    await fs.create(
      'index.ts',
      `
      import moduleDirname from './get_path'
      console.log(moduleDirname)
    `
    )

    await fs.create('get_path.ts', `export default import.meta.dirname`)

    const result = await spawnPromisified(
      process.execPath,
      ['--no-warnings', '--import', './build/index.js', join(fs.basePath, 'index.ts')],
      {}
    )

    assert.include(result.stderr.trim(), 'Error [ERR_MODULE_NOT_FOUND]: Cannot find module')
    assert.equal(result.stdout.trim(), '')
  })

  test('disallow typescript imports unless rewriteRelativeImportExtensions is enabled', async ({
    assert,
    fs,
  }) => {
    await fs.createJson('tsconfig.json', {
      compilerOptions: {
        rewriteRelativeImportExtensions: false,
      },
    })

    await fs.create(
      'index.ts',
      `
      import moduleDirname from './get_path.ts'
      console.log(moduleDirname)
    `
    )

    await fs.create('get_path.ts', `export default import.meta.dirname`)

    const result = await spawnPromisified(
      process.execPath,
      ['--no-warnings', '--import', './build/index.js', join(fs.basePath, 'index.ts')],
      {}
    )

    assert.include(
      result.stderr.trim(),
      'Error: Cannot import "./get_path.ts" using ".ts" extension. Enable "compilerOptions.rewriteRelativeImportExtensions" to import TypeScript files'
    )
  })

  test('resolve .ts file when .js is used in the import', async ({ assert, fs }) => {
    await fs.createJson('tsconfig.json', {
      compilerOptions: {},
    })

    await fs.create(
      'index.ts',
      `
      import moduleDirname from './get_path.js'
      console.log(moduleDirname)
    `
    )

    await fs.create('get_path.ts', `export default import.meta.dirname`)

    const result = await spawnPromisified(
      process.execPath,
      ['--no-warnings', '--import', './build/index.js', join(fs.basePath, 'index.ts')],
      {}
    )

    assert.equal(result.stdout.trim(), `${fs.basePath}`)
  })

  test('resolve subpath exports', async ({ assert, fs }) => {
    await fs.createJson('tsconfig.json', {
      compilerOptions: {
        rewriteRelativeImportExtensions: false,
      },
    })

    await fs.createJson('package.json', {
      imports: {
        '#src/*': './src/*.js',
      },
    })

    await fs.create(
      'index.ts',
      `
      import { User } from '#src/user'
      const user = new User()
      user.create(1)
    `
    )

    await fs.create(
      'src/user.ts',
      `export class User {
        create(id: number) {
          console.log('creating user with id ' + id)
        }
      }
    `
    )

    const result = await spawnPromisified(
      process.execPath,
      ['--no-warnings', '--import', './build/index.js', join(fs.basePath, 'index.ts')],
      {}
    )

    assert.equal(result.stdout.trim(), 'creating user with id 1')
  })

  test('resolve subpath exports with .ts extension', async ({ assert, fs }) => {
    await fs.createJson('tsconfig.json', {
      compilerOptions: {
        rewriteRelativeImportExtensions: false,
      },
    })

    await fs.createJson('package.json', {
      imports: {
        '#src/*': './src/*.ts',
      },
    })

    await fs.create(
      'index.ts',
      `
      import { User } from '#src/user'
      const user = new User()
      user.create(1)
    `
    )

    await fs.create(
      'src/user.ts',
      `export class User {
        create(id: number) {
          console.log('creating user with id ' + id)
        }
      }
    `
    )

    const result = await spawnPromisified(
      process.execPath,
      ['--no-warnings', '--import', './build/index.js', join(fs.basePath, 'index.ts')],
      {}
    )

    assert.equal(result.stdout.trim(), 'creating user with id 1')
  })

  test('keep modules with side-effects when verbatimModuleSyntax is enabled', async ({
    assert,
    fs,
  }) => {
    await fs.createJson('tsconfig.json', {
      compilerOptions: {
        rewriteRelativeImportExtensions: false,
        verbatimModuleSyntax: true,
      },
    })

    await fs.create(
      'index.ts',
      `
      import getPath from './get_path.js'
    `
    )

    await fs.create(
      'get_path.ts',
      `
      console.log(import.meta.dirname)
      export default import.meta.dirname
    `
    )

    const result = await spawnPromisified(
      process.execPath,
      ['--no-warnings', '--import', './build/index.js', join(fs.basePath, 'index.ts')],
      {}
    )

    assert.equal(result.stdout.trim(), fs.basePath)
  })

  test('use import.meta.resolve to resolve paths', async ({ assert, fs }) => {
    await fs.createJson('tsconfig.json', {
      compilerOptions: {
        rewriteRelativeImportExtensions: false,
      },
    })

    await fs.createJson('package.json', {
      imports: {
        '#src/*': './src/*.js',
      },
    })

    await fs.create('index.ts', `console.log(import.meta.resolve('#src/user'))`)

    await fs.create(
      'src/user.ts',
      `export class User {
        create(id: number) {
          console.log('creating user with id ' + id)
        }
      }
    `
    )

    const result = await spawnPromisified(
      process.execPath,
      ['--no-warnings', '--import', './build/index.js', join(fs.basePath, 'index.ts')],
      {}
    )

    assert.equal(result.stdout.trim(), new URL('src/user.ts', fs.baseUrl).toString())
  })

  test('import packages ending in .js', async ({ assert, fs }) => {
    await fs.createJson('tsconfig.json', {
      compilerOptions: {
        rewriteRelativeImportExtensions: false,
      },
    })

    await fs.create(
      'index.ts',
      `
      import ipaddress from 'ipaddr.js'
      console.log(ipaddress.IPv4.isIPv4('127.0.0.1'))
    `
    )

    const result = await spawnPromisified(
      process.execPath,
      ['--no-warnings', '--import', './build/index.js', join(fs.basePath, 'index.ts')],
      {}
    )

    assert.equal(result.stdout.trim(), 'true')
  })

  test('run jsx with custom parser', async ({ assert, fs }) => {
    await fs.createJson('tsconfig.json', {
      compilerOptions: {
        jsx: 'react-jsx',
        jsxImportSource: 'preact',
      },
    })

    await fs.create(
      'index.ts',
      `
      import render from 'preact-render-to-string'
      import { Button } from './components/button.jsx'

      console.log(render(Button({ type: 'submit', text: 'Login' })))
    `
    )

    await fs.create(
      'components/button.tsx',
      `
      interface ChildrenProps {
        type: 'submit' | 'button';
        text: string
      }

      export function Button(props: ChildrenProps) {
        return <button type={props.type}>{props.text}</button>
      }
    `
    )

    const result = await spawnPromisified(
      process.execPath,
      ['--no-warnings', '--import', './build/index.js', join(fs.basePath, 'index.ts')],
      {}
    )

    assert.equal(result.stdout.trim(), '<button type="submit">Login</button>')
  })

  test('do not allow .tsx file import when rewriteRelativeImportExtensions is disabled', async ({
    assert,
    fs,
  }) => {
    await fs.createJson('tsconfig.json', {
      compilerOptions: {
        jsx: 'react-jsx',
        jsxImportSource: 'preact',
      },
    })

    await fs.create(
      'index.ts',
      `
      import render from 'preact-render-to-string'
      import { Button } from './components/button.tsx'

      console.log(render(Button({ type: 'submit', text: 'Login' })))
    `
    )

    await fs.create(
      'components/button.tsx',
      `
      interface ChildrenProps {
        type: 'submit' | 'button';
        text: string
      }

      export function Button(props: ChildrenProps) {
        return <button type={props.type}>{props.text}</button>
      }
    `
    )

    const result = await spawnPromisified(
      process.execPath,
      ['--no-warnings', '--import', './build/index.js', join(fs.basePath, 'index.ts')],
      {}
    )

    assert.include(
      result.stderr.trim(),
      'Cannot import "./components/button.tsx" using ".tsx" extension. Enable "compilerOptions.rewriteRelativeImportExtensions" to import TypeScript files'
    )
  })

  test('allow .tsx file import when rewriteRelativeImportExtensions is enabled', async ({
    assert,
    fs,
  }) => {
    await fs.createJson('tsconfig.json', {
      compilerOptions: {
        jsx: 'react-jsx',
        rewriteRelativeImportExtensions: true,
        jsxImportSource: 'preact',
      },
    })

    await fs.create(
      'index.ts',
      `
      import render from 'preact-render-to-string'
      import { Button } from './components/button.tsx'

      console.log(render(Button({ type: 'submit', text: 'Login' })))
    `
    )

    await fs.create(
      'components/button.tsx',
      `
      interface ChildrenProps {
        type: 'submit' | 'button';
        text: string
      }

      export function Button(props: ChildrenProps) {
        return <button type={props.type}>{props.text}</button>
      }
    `
    )

    const result = await spawnPromisified(
      process.execPath,
      ['--no-warnings', '--import', './build/index.js', join(fs.basePath, 'index.ts')],
      {}
    )

    assert.equal(result.stdout.trim(), '<button type="submit">Login</button>')
  })

  /**
   * If we do not process typescript file in node_modules, then it will
   * be processed by Node.js. Hence the same project will have different
   * TypeScript setup.
   */
  test('process typescript modules from node_modules', async ({ assert, fs }) => {
    await fs.createJson('tsconfig.json', {
      compilerOptions: {
        rewriteRelativeImportExtensions: true,
      },
    })

    await fs.create('node_modules/foo/index.ts', `export default import.meta.dirname`)
    await fs.createJson('node_modules/foo/package.json', {
      name: 'foo',
      main: 'index.ts',
      type: 'module',
    })

    await fs.create(
      'index.ts',
      `
      import moduleDirname from 'foo'
      console.log(moduleDirname)
    `
    )

    const result = await spawnPromisified(
      process.execPath,
      ['--no-warnings', '--import', './build/index.js', join(fs.basePath, 'index.ts')],
      {}
    )

    assert.equal(result.stdout.trim(), join(fs.basePath, 'node_modules', 'foo'))
  })

  test('import typescript files using .js extension and query string', async ({ assert, fs }) => {
    await fs.createJson('tsconfig.json', {
      compilerOptions: {
        rewriteRelativeImportExtensions: false,
      },
    })

    await fs.create(
      'index.ts',
      `
      import { User } from './user.js?hot-hook-version=1'
      const user = new User()
      user.create(1)
    `
    )

    await fs.create(
      'user.ts',
      `export class User {
        create(id: number) {
          console.log('creating user with id ' + id)
        }
      }
    `
    )

    const result = await spawnPromisified(
      process.execPath,
      ['--no-warnings', '--import', './build/index.js', join(fs.basePath, 'index.ts')],
      {}
    )

    assert.equal(result.stdout.trim(), 'creating user with id 1')
  })

  test('import typescript files using .ts extension and query string', async ({ assert, fs }) => {
    await fs.createJson('tsconfig.json', {
      compilerOptions: {
        rewriteRelativeImportExtensions: true,
      },
    })

    await fs.create(
      'index.ts',
      `
      import { User } from './user.ts?hot-hook-version=1'
      const user = new User()
      user.create(1)
    `
    )

    await fs.create(
      'user.ts',
      `export class User {
        create(id: number) {
          console.log('creating user with id ' + id)
        }
      }
    `
    )

    const result = await spawnPromisified(
      process.execPath,
      ['--no-warnings', '--import', './build/index.js', join(fs.basePath, 'index.ts')],
      {}
    )

    assert.equal(result.stdout.trim(), 'creating user with id 1')
  })

  test('disallow typescript imports with query string unless rewriteRelativeImportExtensions is enabled', async ({
    assert,
    fs,
  }) => {
    await fs.createJson('tsconfig.json', {
      compilerOptions: {
        rewriteRelativeImportExtensions: false,
      },
    })

    await fs.create(
      'index.ts',
      `
      import moduleDirname from './get_path.ts?v=1'
      console.log(moduleDirname)
    `
    )

    await fs.create('get_path.ts', `export default import.meta.dirname`)

    const result = await spawnPromisified(
      process.execPath,
      ['--no-warnings', '--import', './build/index.js', join(fs.basePath, 'index.ts')],
      {}
    )

    assert.include(
      result.stderr.trim(),
      'Error: Cannot import "./get_path.ts?v=1" using ".ts" extension. Enable "compilerOptions.rewriteRelativeImportExtensions" to import TypeScript files'
    )
  })
})
