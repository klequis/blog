import * as R from 'ramda'

// const log = console.log

// const posts = [
//   {
//     summary: 'Installing Firefox Developer Edition on Ubuntu is quick & easy.',
//     date: '2019-10-14T00:00:00.000Z',
//     tags: ['firefox', 'browser', 'installing-software', 'ubuntu'],
//     draft: false,
//     title: 'Installing FireFox Developer Edition on Ubuntu',
//     slug: 'installing-firefox-developer-edition-ubuntu',
//   },
//   {
//     title: 'Sample .md file',
//     date: '2016-03-08T00:00:00.000Z',
//     tags: ['markdown', 'code', 'features'],
//     draf: false,
//     summary: 'Example of a markdown file with code blocks and syntax highlighting',
//     slug: 'code-sample',
//   },
// ]

function frontMatterHas(fm) {
  return R.has(R.__, fm)
}

const matterReqFlds = ['title', 'date', 'tags', 'draft', 'summary']

function frontMatterHasReqFlds(fm) {
  const { slug } = fm
  const missingFields = R.filter(R.compose(R.not, frontMatterHas(fm)), matterReqFlds)
  return missingFields.length > 0 ? { slug, missing: missingFields } : {}
}

function notEmpty(x) {
  return R.compose(R.not, R.isEmpty)(x)
}

function createMsgLn(item) {
  const { slug, missing } = item
  return `Document ${slug} is missing required front matter fields: ${missing.join(', ')} \n`
}

export default function chkFrontMatter(fm) {
  const missing = R.compose(R.filter(notEmpty), R.map(frontMatterHasReqFlds))(fm)
  const a = missing.length === 0 ? [] : R.map(createMsgLn, missing)
  return a
}
