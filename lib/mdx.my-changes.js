import { bundleMDX } from 'mdx-bundler'
import fs from 'fs'
import matter from 'gray-matter'
import path from 'path'
import readingTime from 'reading-time'
import { visit } from 'unist-util-visit'
import getAllFilesRecursively from './utils/files'
// Remark packages
import remarkGfm from 'remark-gfm'
import remarkFootnotes from 'remark-footnotes'
import remarkMath from 'remark-math'
import remarkExtractFrontmatter from './remark-extract-frontmatter'
import remarkCodeTitles from './remark-code-title'
import remarkTocHeadings from './remark-toc-headings'
import remarkImgToJsx from './remark-img-to-jsx'
// Rehype packages
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeKatex from 'rehype-katex'
import rehypeCitation from 'rehype-citation'
import rehypePrismPlus from 'rehype-prism-plus'
import rehypePresetMinify from 'rehype-preset-minify'
import * as R from 'ramda'

const root = process.cwd()

export function getFiles(type) {
  // console.log('***** mdx.getFiles')
  const prefixPaths = path.join(root, 'data', type)
  const files = getAllFilesRecursively(prefixPaths)
  // Only want to return blog/path and ignore root, replace is needed to work on Windows
  return files.map((file) => file.slice(prefixPaths.length + 1).replace(/\\/g, '/'))
}

export function formatSlug(slug) {
  return slug.replace(/\.(mdx|md)/, '')
}

export function dateSortDesc(a, b) {
  if (a > b) return -1
  if (a < b) return 1
  return 0
}

export async function getFileBySlug(type, slug) {
  // console.log('***** mdx.gitFileBySlug')
  const mdxPath = path.join(root, 'data', type, `${slug}.mdx`)
  const mdPath = path.join(root, 'data', type, `${slug}.md`)
  const source = fs.existsSync(mdxPath)
    ? fs.readFileSync(mdxPath, 'utf8')
    : fs.readFileSync(mdPath, 'utf8')

  // https://github.com/kentcdodds/mdx-bundler#nextjs-esbuild-enoent
  if (process.platform === 'win32') {
    process.env.ESBUILD_BINARY_PATH = path.join(root, 'node_modules', 'esbuild', 'esbuild.exe')
  } else {
    process.env.ESBUILD_BINARY_PATH = path.join(root, 'node_modules', 'esbuild', 'bin', 'esbuild')
  }

  let toc = []

  const { code, frontmatter } = await bundleMDX({
    source,
    // mdx imports can be automatically source from the components directory
    cwd: path.join(root, 'components'),
    xdmOptions(options, frontmatter) {
      // this is the recommended way to add custom remark/rehype plugins:
      // The syntax might look weird, but it protects you in case we add/remove
      // plugins in the future.
      options.remarkPlugins = [
        ...(options.remarkPlugins ?? []),
        remarkExtractFrontmatter,
        [remarkTocHeadings, { exportRef: toc }],
        remarkGfm,
        remarkCodeTitles,
        [remarkFootnotes, { inlineNotes: true }],
        remarkMath,
        remarkImgToJsx,
      ]
      options.rehypePlugins = [
        ...(options.rehypePlugins ?? []),
        rehypeSlug,
        rehypeAutolinkHeadings,
        rehypeKatex,
        [rehypeCitation, { path: path.join(root, 'data') }],
        [rehypePrismPlus, { ignoreMissing: true }],
        rehypePresetMinify,
      ]
      return options
    },
    esbuildOptions: (options) => {
      options.loader = {
        ...options.loader,
        '.js': 'jsx',
      }
      return options
    },
  })

  return {
    mdxSource: code,
    toc,
    frontMatter: {
      readingTime: readingTime(code),
      slug: slug || null,
      fileName: fs.existsSync(mdxPath) ? `${slug}.mdx` : `${slug}.md`,
      ...frontmatter,
      date: frontmatter.date ? new Date(frontmatter.date).toISOString() : null,
    },
  }
}

function isMdFile(fileName) {
  const ext = path.extname(fileName)
  return R.or(R.equals(ext, '.md'), R.equals(ext, '.mdx'))
}

function chkFrontMatter(frontMatter) {
  const checks = {
    hasTitle: R.has('title', frontMatter),
    hasDate: R.has('date', frontMatter),
    hasTags: R.has('tags', frontMatter),
    hasSummary: R.has('summary', frontMatter),
    hasDraft: R.has('draft', frontMatter),
  }
  const log = console.log
  // log('-----------------')
  // log('checks', checks)
  const messages = R.pickBy((val, key) => val === false, checks)
  // log('messages', messages)
  // log('-----------------')
  return messages
  // console.log('checks', checks)
  // const messages = R.filter(R.F, checks)
  // console.log('messages', messages)

  /*
      checks actually works
      Now need to 
      1. generate an error message
      2. decide on return value and action taken on it (end or ignore file)
          - since missing required tags causes the app to crash it seems this
            is a fatal error
  */
}

export async function getAllFilesFrontMatter(folder) {
  // console.log('***** mdx.getAllFilesFrontMatter')
  const prefixPaths = path.join(root, 'data', folder)

  const files = getAllFilesRecursively(prefixPaths)
  // console.log('files', files)
  const allFrontMatter = []
  const missingFrontMatter = []

  files.forEach((file) => {
    // Replace is needed to work on Windows
    const fileName = file.slice(prefixPaths.length + 1).replace(/\\/g, '/')
    // console.log('fileName', fileName)
    // Remove Unexpected File
    if (!isMdFile(fileName)) {
      return
    }

    const source = fs.readFileSync(file, 'utf8') // source is the entire file
    const { data: frontmatter } = matter(source)
    // console.log('frontmatter', frontmatter)
    R.append(chkFrontMatter(frontmatter), missingFrontMatter)
    // console.log('missingFrontMatter', missingFrontMatter)

    if (frontmatter.draft !== true) {
      allFrontMatter.push({
        ...frontmatter,
        slug: formatSlug(fileName),
        date: frontmatter.date ? new Date(frontmatter.date).toISOString() : null,
      })
    }
  })

  return allFrontMatter.sort((a, b) => dateSortDesc(a.date, b.date))
}
