# chkFrontMatter()

## frontMatter

```js
;[
  {
    summary: 'Installing Firefox Developer Edition on Ubuntu is quick & easy.',
    date: '2019-10-14T00:00:00.000Z',
    tags: ['firefox', 'browser', 'installing-software', 'ubuntu'],
    draft: false,
    title: 'Installing FireFox Developer Edition on Ubuntu',
    slug: 'installing-firefox-developer-edition-ubuntu',
  },
  {
    title: 'Sample .md file',
    date: '2016-03-08T00:00:00.000Z',
    tags: ['markdown', 'code', 'features'],
    draf: false,
    summary: 'Example of a markdown file with code blocks and syntax highlighting',
    slug: 'code-sample',
  },
]
```

## after `chk`

```js
chk {
  hasTitle: true,
  hasDate: true,
  hasTags: true,
  hasSummary: true,
  hasDraft: true,
  slug: 'nested-route/introducing-multi-part-posts-with-nested-routing'
}

```
