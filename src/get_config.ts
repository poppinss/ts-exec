/*
 * ts-exec
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import debug from './debug.ts'
import { fileURLToPath } from 'node:url'
import type { Config as SWCConfig } from '@swc/core'
import { getTsconfig, type TsConfigJson, type TsConfigJsonResolved } from 'get-tsconfig'

/**
 * Default config to use when no tsconfig is found
 */
const DEFAULT_CONFIG: SWCConfig = {
  sourceMaps: true,
  module: {
    type: 'es6',
  },
  jsc: {
    target: 'esnext',
    externalHelpers: false,
    parser: {
      syntax: 'typescript',
      tsx: true,
      decorators: true,
      dynamicImport: true,
    },
    transform: {
      decoratorMetadata: true,
      legacyDecorator: true,
      verbatimModuleSyntax: true,
      useDefineForClassFields: true,
      react: {
        runtime: 'automatic',
      },
    },
    experimental: {
      keepImportAttributes: true,
    },
    keepClassNames: true,
  },
}

/**
 * Converts tsConfig to SWC config
 */
function tsConfigToSwcConfig(tsConfig: TsConfigJsonResolved): SWCConfig {
  const tsTarget =
    tsConfig.compilerOptions?.target?.toLowerCase() as Lowercase<TsConfigJson.CompilerOptions.Target>

  return {
    sourceMaps: tsConfig.compilerOptions?.sourceMap ?? true,
    module: {
      /**
       * Since, we will run the SWC transformer via Nodejs loader hooks, the
       * entry point will always be ES6
       */
      type: 'es6',
    },
    jsc: {
      target: tsTarget ? (tsTarget === 'es6' ? 'esnext' : tsTarget) : 'esnext',
      baseUrl: tsConfig.compilerOptions?.baseUrl,
      externalHelpers: false,
      parser: {
        syntax: 'typescript',
        tsx: !!tsConfig.compilerOptions?.jsx,
        decorators: true,
        dynamicImport: true,
      },
      transform: {
        ...(tsConfig.compilerOptions?.emitDecoratorMetadata
          ? {
              decoratorMetadata: true,
            }
          : {}),
        ...(tsConfig.compilerOptions?.experimentalDecorators
          ? {
              legacyDecorator: true,
            }
          : {}),
        ...(tsConfig.compilerOptions?.verbatimModuleSyntax
          ? {
              verbatimModuleSyntax: true,
            }
          : {}),
        ...(tsConfig.compilerOptions?.useDefineForClassFields
          ? {
              useDefineForClassFields: true,
            }
          : {}),
        react: {
          runtime: 'automatic',
          ...(tsConfig.compilerOptions?.jsxImportSource
            ? {
                importSource: tsConfig.compilerOptions?.jsxImportSource,
              }
            : {}),
        },
      },
      experimental: {
        keepImportAttributes: true,
      },
      keepClassNames: true,
    },
  }
}

/**
 * Returns the TSConfig and the SWC config by searching for the "tsconfig.json"
 * file in the provided search path
 */
export function getConfig(searchPath: string | URL): {
  tsConfig:
    | (TsConfigJsonResolved & {
        compilerOptions?: {
          rewriteRelativeImportExtensions?: boolean
        }
      })
    | null
  tsConfigPath: string | null
  swcConfig: SWCConfig
} {
  const tsConfig = getTsconfig(
    typeof searchPath === 'string' ? searchPath : fileURLToPath(searchPath)
  )

  if (!tsConfig) {
    debug('Unable to locate tsconfig file')
    return {
      tsConfig: null,
      tsConfigPath: null,
      swcConfig: {
        ...DEFAULT_CONFIG,
      },
    }
  }

  debug('tsConfig %O', tsConfig.config)
  const swcConfig = tsConfigToSwcConfig(tsConfig.config)
  debug('swcConfig %O', swcConfig)

  return { tsConfig: tsConfig.config, tsConfigPath: tsConfig.path, swcConfig }
}
