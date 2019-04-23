import axios from 'axios'
import cheerio from 'cheerio'
import dotenv from 'dotenv'
import * as Figma from 'figma-js'
import fs from 'fs-extra'
import { minify } from 'html-minifier'
import { Dictionary } from 'lodash'
import { flatMap, zipObject } from 'lodash/fp'
import ora from 'ora'
import path from 'path'
import Svgo from 'svgo'
import { figma } from '../package.json'
import {paramCase} from 'change-case'

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
  const outDir = path.resolve(process.cwd(), 'icons')

  const client = Figma.Client({ personalAccessToken: process.env.FIGMA_TOKEN })
  const fileKey = process.env.FIGMA_FILE_KEY || figma.fileKey

  spinner.info(`Figma file key: ${fileKey}`)

  spinner.start('Fetching components')
  const document = await getDocument(client, fileKey)
  const components = getComponents(document)
  if (components.length === 0) throw new Error('No components found')

  spinner.start('Fetching image URLs')
  const imageUrls = await getImageUrls(client, fileKey, components)

  spinner.start('Downloading SVGs')
  const svgs = await getSvgs(imageUrls)
  await fs.emptyDir(outDir)
  writeSvgs(outDir, components, svgs)

  spinner.succeed(
    `Exported ${components.length} icons to ./${path.relative(
      process.cwd(),
      outDir,
    )}`,
  )
}

/** Displays error message and exits. */
function handleError(error: Error) {
  spinner.fail(`[Error] ${error.message}`)
  process.exit(1)
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

/** Writes SVGs to outDir */
function writeSvgs(
  outDir: string,
  components: Figma.Component[],
  svgs: Dictionary<string>,
) {
  components.forEach(component => {
    try {
      const size = getSize(component)
      const contents = getSvgContents(svgs[component.id])
      const dir = path.join(outDir, size.toString())
      fs.ensureDirSync(dir)
      fs.writeFileSync(
        path.join(dir, `${paramCase(component.name)}.svg`),
        toSvg(size, contents),
      )
    } catch (error) {
      spinner.info(`Skipping ${component.name}: ${error.message}`)
    }
  })
}

/**
 * Gets the frame size of a component.
 * Throws an error if the width and height do not match.
 */
function getSize(component: Figma.Component) {
  const { width, height } = component.absoluteBoundingBox

  if (width !== height) {
    throw new Error(`width (${width}) and height (${height}) do not match`)
  }

  return width
}

/** Gets contents between opening and closing <svg> tags. */
function getSvgContents(svg: string) {
  const $ = cheerio.load(svg)
  return minify($('svg').html() || '', { collapseWhitespace: true })
}

/** Creates an SVG string. */
function toSvg(size: number, contents: string) {
  const attrs = {
    xmlns: 'http://www.w3.org/2000/svg',
    width: size,
    height: size,
    viewBox: `0 0 ${size} ${size}`,
    fill: 'currentColor',
  }

  return `<svg ${attrsToString(attrs)}>${contents}</svg>`
}

/** Converts attributes object to string of HTML attributes. */
function attrsToString(attrs: Dictionary<string | number>) {
  return Object.keys(attrs)
    .map(key => `${key}="${attrs[key]}"`)
    .join(' ')
}
