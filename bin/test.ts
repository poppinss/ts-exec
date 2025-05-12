import { expect } from '@japa/expect'
import { assert } from '@japa/assert'
import { snapshot } from '@japa/snapshot'
import { fileSystem } from '@japa/file-system'
import { expectTypeOf } from '@japa/expect-type'
import { configure, processCLIArgs, run } from '@japa/runner'

processCLIArgs(process.argv.splice(2))
configure({
  files: ['tests/**/*.spec.ts'],
  plugins: [
    expect(),
    assert(),
    fileSystem({
      basePath: new URL('../tests/tmp', import.meta.url),
    }),
    expectTypeOf(),
    snapshot(),
  ],
})

run()
