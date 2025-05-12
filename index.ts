/*
 * ts-exec
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { register } from 'node:module'

register('./src/loader.js', import.meta.url)
