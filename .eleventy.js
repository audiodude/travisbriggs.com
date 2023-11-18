const { DateTime } = require('luxon');
const pluginRss = require('@11ty/eleventy-plugin-rss');
const UpgradeHelper = require('@11ty/eleventy-upgrade-help');

const { commonConfig } = require('./.eleventy.common.js');

module.exports = function (eleventyConfig) {
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

  eleventyConfig.setLibrary('md', md);

  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(UpgradeHelper);

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
