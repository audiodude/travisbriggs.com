const { DateTime } = require('luxon');

module.exports = function (eleventyConfig) {
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

  eleventyConfig.addFilter('simpleDate', (dateObj) => {
    return DateTime.fromJSDate(dateObj).toLocaleString(DateTime.DATE_MED);
  });

  eleventyConfig.addFilter('outputIfNotEqualTo', (dateObj, othDateObj) => {
    if (
      DateTime.fromJSDate(dateObj).toMillis() ===
      DateTime.fromJSDate(othDateObj).toMillis()
    ) {
      return;
    }
    return `| Updated on ${DateTime.fromJSDate(dateObj).toLocaleString(
      DateTime.DATE_MED
    )}`;
  });

  eleventyConfig.addShortcode('year', () => `${new Date().getFullYear()}`);

  eleventyConfig.setLibrary('md', md);

  eleventyConfig.addCollection('garden', function (collection) {
    return collection.getFilteredByGlob(['garden/**/*.md', 'index.md']);
  });

  eleventyConfig.addPassthroughCopy('assets');
  eleventyConfig.setUseGitIgnore(false);

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
