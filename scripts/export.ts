import axios from 'axios'
import cheerio from 'cheerio'
import dotenv from 'dotenv'
import * as Figma from 'figma-js'
import fs from 'fs-extra'
import { minify } from 'html-minifier'
import { Dictionary } from 'lodash'
import { flatMap, groupBy, indexBy, mapValues, zipObject } from 'lodash/fp'
import ora from 'ora'
import path from 'path'
import Svgo from 'svgo'
import { figma } from '../package.json'

const OUT_DIR = path.resolve(process.cwd(), 'dist')

// Initialize dotenv.
dotenv.config()

// Initialize ora.
const spinner = ora()

// Initialize svgo.
const svgo = new Svgo({
  plugins: [{ removeAttrs: { attrs: '(fill|stroke.*)' } }],
})

main().catch(handleError)

/** Entry point. */
async function main() {
  const client = Figma.Client({ personalAccessToken: process.env.FIGMA_TOKEN })
  const fileKey = process.env.FIGMA_FILE_KEY || figma.fileKey

  spinner.info(`Figma file key: ${fileKey}`)

  spinner.start('Getting components')
  const document = await getDocument(client, fileKey)
  const components = getComponents(document)
  if (components.length === 0) throw new Error('No components found')
  spinner.succeed(`Found ${components.length} components`)

  spinner.start('Exporting components')
  const imageUrls = await getImageUrls(client, fileKey, components)
  const svgs = await getSvgs(imageUrls)
  spinner.succeed(`Exported ${Object.keys(svgs).length} components`)

  spinner.start('Writing data')
  const data = composeData(components, svgs)
  const outFile = path.join(OUT_DIR, 'data.json')
  fs.ensureDirSync(OUT_DIR)
  fs.writeFileSync(outFile, JSON.stringify(data))
  spinner.succeed(`Wrote data to ${path.relative(process.cwd(), outFile)}`)
}

function getDocument(client: Figma.ClientInterface, fileKey: string) {
  return client.file(fileKey).then(({ data }) => data.document)
}

function getComponents(node: Figma.Node): Figma.Component[] {
  switch (node.type) {
    case 'COMPONENT':
      return [node]

    case 'DOCUMENT':
    case 'CANVAS':
    case 'FRAME':
    case 'GROUP':
      return flatMap(getComponents, node.children)

    default:
      return []
  }
}

function getImageUrls(
  client: Figma.ClientInterface,
  fileKey: string,
  components: Figma.Component[],
) {
  return client
    .fileImages(fileKey, {
      ids: components.map(component => component.id),
      format: 'svg',
      scale: 1,
    })
    .then(({ data }) => data.images)
}

function getSvgs(imageUrls: Dictionary<string>): Promise<Dictionary<string>> {
  return Promise.all(
    Object.values(imageUrls).map(imageUrl =>
      axios(imageUrl)
        .then(({ data }) => data)
        .then(optimizeSvg),
    ),
  ).then(svgs => zipObject(Object.keys(imageUrls), svgs))
}

/** Optimizes an SVG with svgo. */
function optimizeSvg(svg: string) {
  return svgo.optimize(svg).then(({ data }) => data)
}

function composeData(
  components: Figma.Component[],
  svgs: { [id: string]: string },
) {
  return mapValues(
    components =>
      mapValues(
        component => getSvgContents(svgs[component.id]),
        indexBySize(components),
      ),
    groupBy('name', components),
  )
}

/** Turns a list of components into an object indexing components by size */
function indexBySize(components: Figma.Component[]) {
  return indexBy(component => {
    const { width, height } = component.absoluteBoundingBox

    if (width !== height) {
      throw new Error(`${component.name}: width and height do not match`)
    }

    return width
  }, components)
}

/** Gets contents between opening and closing <svg> tags. */
function getSvgContents(svg: string) {
  const $ = cheerio.load(svg)
  return minify($('svg').html() || '', { collapseWhitespace: true })
}

/** Displays error message and exits. */
function handleError(error: Error) {
  spinner.fail(`[Error] ${error.message}`)
  process.exit(1)
}
