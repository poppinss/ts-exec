/*
 * ts-exec
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { LoadHook, ModuleFormat, ResolveHook } from 'node:module'

import debug from './debug.ts'
import { getConfig } from './get_config.ts'
import { transformSync } from './transform.ts'

let swcConfig: ReturnType<typeof getConfig>['swcConfig']

/**
 * Check if specifier is reference to a local path. Local path
 * includes relative imports or absolute imports starting with
 * "/" or "file" protocol.
 */
function isLocalPath(specifier: string) {
  return (
    specifier.startsWith('./') ||
    specifier.startsWith('../') ||
    specifier.startsWith('/') ||
    specifier.startsWith('file:')
  )
}

/**
 * Rethrow SWC error. Taken from Amaro codebase of Node.js
 */
function wrapAndReThrowSwcError(error: any) {
  const errorHints = `${error.filename}:${error.startLine}\n${error.snippet}\n`
  switch (error.code) {
    case 'UnsupportedSyntax': {
      const unsupportedSyntaxError = new Error(error.message)
      unsupportedSyntaxError.name = 'UnsupportedSyntaxError'
      unsupportedSyntaxError.stack = `${errorHints}${unsupportedSyntaxError.stack}`
      throw unsupportedSyntaxError
    }
    case 'InvalidSyntax': {
      const syntaxError = new SyntaxError(error.message)
      syntaxError.stack = `${errorHints}${syntaxError.stack}`
      throw syntaxError
    }
    default:
      throw new Error(error.message)
  }
}

/**
 * Initialize hook to load different config files
 */
export async function initialize() {
  const searchPath = process.env.TS_EXEC_PWD ?? process.cwd()
  const config = getConfig(searchPath)
  swcConfig = config.swcConfig
}

/**
 * Resolve hook to rewrite ".js" imports to ".ts" file only when
 * "allowArbitraryExtensions" is not enabled. Otherwise, we expect
 * the user to always specify the accurate file extensions and we
 * won't check for file existence on the disk, since that may
 * lead to many false positives.
 *
 * For example, someone registers a loader to import files from Github and
 * our extension rewrite checks for same file on disk, hence it will fail.
 */
export const resolve: ResolveHook = async (specifier, context, nextResolve) => {
  debug('resolving specifier %s', specifier)

  try {
    return await nextResolve(specifier, context)
  } catch (error) {
    /**
     * Re-try with ".ts", ".mts", ".cts" or ".tsx" extensions all the time. Here's the
     * use case:
     *
     * Imagine, I have a dynamic import that TSC will not rewrite (because it uses a variable).
     * Now, I want the ability to write this import in a way that it works during both the
     * development and the production.
     *
     * The only way to make it work is via the ".js" file extension. In that case, we want ts-exec
     * to be able to import ".js" files as well. Forcing ".ts" means I am cornered after the
     * production build.
     */
    if (error.code === 'ERR_MODULE_NOT_FOUND' && error.url && isLocalPath(error.url)) {
      let url = error.url
      const fileExtension = extname(url)

      if (fileExtension === '.js') {
        url = url.replace('.js', '.ts')
      } else if (fileExtension === '.mjs') {
        url = url.replace('.mjs', '.mts')
      } else if (fileExtension === '.cjs') {
        url = url.replace('.cjs', '.cts')
      } else if (fileExtension === '.jsx') {
        url = url.replace('.jsx', '.tsx')
      }

      debug('retrying to resolve file with specifier %s', url)
      return nextResolve(url, context)
    }

    throw error
  }
}

/**
 * Load hook to compile TypeScript and JSX files on the fly
 */
export const load: LoadHook = async function load(url, context, nextLoad) {
  const { format } = context
  debug('load file %s, %O', url, context)

  if (
    (format && (format === 'module-typescript' || format === 'commonjs-typescript')) ||
    url.endsWith('.tsx') ||
    url.endsWith('.jsx')
  ) {
    try {
      const { source } = await nextLoad(url, {
        ...context,
        format: 'module',
      })

      const { code, map } = await transformSync(source!.toString(), {
        format: (format as 'module-typescript' | 'commonjs-typescript') ?? 'module-tsx',
        filename: fileURLToPath(url),
        ...swcConfig,
      })

      let output = code
      if (map) {
        const base64SourceMap = Buffer.from(map).toString('base64')
        output = `${code}\n\n//# sourceMappingURL=data:application/json;base64,${base64SourceMap}`
      }

      return {
        format: format ? (format.replace('-typescript', '') as ModuleFormat) : 'module',
        source: `${output}\n\n//# sourceURL=${url}`,
      }
    } catch (error) {
      if (error.code !== undefined) {
        wrapAndReThrowSwcError(error)
      }

      throw error
    }
  }

  return nextLoad(url, context)
}
