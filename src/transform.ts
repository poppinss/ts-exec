/*
 * ts-exec
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { type Config as SwcConfig, transform as swcTransform } from '@swc/core'

/**
 * Transforms source code using SWC
 */
export function transformSync(
  source: string,
  options: SwcConfig & {
    filename: string
    format: 'module-typescript' | 'commonjs-typescript' | 'module-tsx'
  }
) {
  const input = `${source ?? ''}`
  const { format, ...rest } = options
  rest.module!.type = format === 'commonjs-typescript' ? 'commonjs' : 'es6'
  return swcTransform(input, rest)
}
