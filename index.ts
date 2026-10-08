/*
 * ts-exec
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { registerHooks } from 'node:module'
import { initialize, load, resolve } from './src/loader.ts'

process.setSourceMapsEnabled(true)
initialize()
registerHooks({ resolve, load })
