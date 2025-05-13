/*
 * ts-exec
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Config as SwcConfig } from '@swc/core'
import type { TsConfigJsonResolved } from 'get-tsconfig'
import type { LoadHook, ModuleFormat, ResolveHook } from 'node:module'
import { resolveImports, type PathConditionsMap } from 'resolve-pkg-maps'

import debug from './debug.ts'
import { getConfig } from './get_config.ts'
import { transformSync } from './transform.ts'
import { getPackageJson } from './get_package_json.ts'

let swcConfig: SwcConfig
let tsConfig: TsConfigJsonResolved | null
let subPathImports: PathConditionsMap | null

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
  const pkgJSON = await getPackageJson(searchPath)
  swcConfig = config.swcConfig
  tsConfig = config.tsConfig
  subPathImports = pkgJSON ? pkgJSON.imports : null
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

  /**
   * Handle subpath imports
   */
  if (specifier.startsWith('#') && subPathImports) {
    debug('resolving subpath import %s %O', specifier, subPathImports)
    const resolvedPaths = resolveImports(subPathImports, specifier, context.conditions)
    if (resolvedPaths.length) {
      specifier = resolvedPaths[0]
    }
  }

  debug('resolving file with specifier %s', specifier)
  try {
    return await nextResolve(specifier, context)
  } catch (error) {
    /**
     * Re-try with ".ts", ".mts", ".cts" or ".tsx" extensions when
     * "allowArbitraryExtensions" is false
     */
    if (
      !tsConfig?.compilerOptions?.allowArbitraryExtensions &&
      error.code === 'ERR_MODULE_NOT_FOUND' &&
      isLocalPath(specifier)
    ) {
      const fileExtension = extname(specifier)

      if (fileExtension === '.js') {
        specifier = specifier.replace('.js', '.ts')
      } else if (fileExtension === '.mjs') {
        specifier = specifier.replace('.mjs', '.mts')
      } else if (fileExtension === '.cjs') {
        specifier = specifier.replace('.cjs', '.cts')
      } else if (fileExtension === '.jsx') {
        specifier = specifier.replace('.jsx', '.tsx')
      }

      debug('retrying to resolve file with specifier %s', specifier)
      return nextResolve(specifier, context)
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

      const { code, map } = transformSync(source!.toString(), {
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
