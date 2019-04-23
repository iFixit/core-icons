import fs from 'fs-extra'
import path from 'path'
import ora from 'ora'

// For all given directories (specified using command line arguments),
// this script generates an entrypoint (index.ts) file that exports all the
// React components (.tsx) in the directory.

const spinner = ora()

const directories = process.argv.slice(2)

spinner.info(`Generating entrypoints for ${directories.join(", ")}`)

directories.forEach(dir =>
  fs.readdir(path.resolve(process.cwd(), dir)).then(async files => {
    const outFile = path.join(dir, 'index.ts')

    spinner.start(`Generating ${outFile}`)

    const exports = files
      // Ignore index.ts if it already exists
      .filter(file => path.basename(file) !== 'index.ts')
      .map(file => {
        const name = path.basename(file, '.tsx')
        return `export { default as ${name} } from './${name}';`
      })

    await fs.writeFile(path.resolve(process.cwd(), outFile), exports.join('\n'))
    spinner.succeed(`Generated ${outFile}`)
  }),
)
