/*
 * ts-exec
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { spawn } from 'node:child_process'

export function spawnPromisified(...args: Parameters<typeof spawn>) {
  let stderr = ''
  let stdout = ''

  const child = spawn(...args)
  child.stderr?.setEncoding('utf8')
  child.stderr?.on('data', (data) => {
    stderr += data
  })
  child.stdout?.setEncoding('utf8')
  child.stdout?.on('data', (data) => {
    stdout += data
  })

  return new Promise<{
    code: number | null
    signal: string | null
    stderr: string
    stdout: string
  }>((resolve, reject) => {
    child.on('close', (code, signal) => {
      resolve({
        code,
        signal,
        stderr,
        stdout,
      })
    })
    child.on('error', (code: number, signal: string) => {
      reject({
        code,
        signal,
        stderr,
        stdout,
      })
    })
  })
}
