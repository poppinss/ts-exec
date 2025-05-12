/*
 * ts-exec
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFile } from 'node:fs/promises'

/**
 * Returns the contents of the package.json file
 */
export async function getPackageJson(searchPath: string | URL) {
  try {
    const pkgFile = await readFile(
      join(typeof searchPath === 'string' ? searchPath : fileURLToPath(searchPath), 'package.json'),
      'utf-8'
    )
    return JSON.parse(pkgFile)
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null
    }
    throw error
  }
}
