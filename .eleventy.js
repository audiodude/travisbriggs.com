const { DateTime } = require('luxon');
const { eleventyImageTransformPlugin } = require('@11ty/eleventy-img');

const { commonConfig } = require('./.eleventy.common.js');

module.exports = async function (eleventyConfig) {
  eleventyConfig = commonConfig(eleventyConfig);

  const markdownIt = require('markdown-it');
  const markdownItOptions = {
    html: true,
    linkify: true,
  };

  const md = markdownIt(markdownItOptions)
    .use(require('markdown-it-footnote'))
    .use(require('markdown-it-attrs'))
    .use(function (md) {
      // Recognize Mediawiki links ([[text]])
      md.linkify.add('[[', {
        validate: /^\s?([^\[\]\|\n\r]+)(\|[^\[\]\|\n\r]+)?\s?\]\]/,
        normalize: (match) => {
          const parts = match.raw.slice(2, -2).split('|');
          parts[0] = parts[0].replace(/.(md|markdown)\s?$/i, '');
          match.text = (parts[1] || parts[0]).trim();
          match.url = `/garden/${parts[0].trim()}/`;
        },
      });
    });

  eleventyConfig.addFilter('markdownify', (string) => {
    return md.render(string);
  });

  // Extracts the first site-local image path from raw markdown, for og:image.
  // External (http...) images are skipped: og:image must live on our domain
  // so head.html can prepend the baseurl.
  eleventyConfig.addFilter('firstImage', (rawInput) => {
    if (!rawInput) return null;
    const pattern = /!\[[^\]]*\]\(\s*([^)\s]+)(?:\s[^)]*)?\)|<img[^>]*\ssrc=["']([^"']+)["']/gi;
    for (const match of rawInput.matchAll(pattern)) {
      const url = match[1] || match[2];
      if (url && url.startsWith('/')) {
        return url;
      }
    }
    return null;
  });

  eleventyConfig.setLibrary('md', md);

  const pluginRss = (await import('@11ty/eleventy-plugin-rss')).default;
  eleventyConfig.addPlugin(pluginRss);

  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    extensions: 'html',
    formats: ['webp', 'auto'],
    widths: [480, 800, 1600, 'auto'],
    urlPath: '/img/',
    defaultAttributes: {
      loading: 'lazy',
      decoding: 'async',
    },
    sharpOptions: { animated: true },
  });

  eleventyConfig.addGlobalData('isGemini', false);

  eleventyConfig.addCollection('rss', function (collectionApi) {
    return collectionApi.getAll().sort((a, b) => {
      const aDate = DateTime.fromJSDate(
        a.data.updated ? a.data.updated : a.data.page.date,
      );
      const bDate = DateTime.fromJSDate(
        b.data.updated ? b.data.updated : b.data.page.date,
      );
      return aDate.toMillis() - bDate.toMillis();
    });
  });

  eleventyConfig.addPassthroughCopy('_redirects');
  eleventyConfig.addPassthroughCopy('assets');
  eleventyConfig.addPassthroughCopy('keybase.txt');

  return {
    dir: {
      input: './',
      output: '_site',
      layouts: 'layouts',
      includes: 'includes',
      data: '_data',
    },
    passthroughFileCopy: true,
  };
};
