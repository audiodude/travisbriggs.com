const { DateTime } = require('luxon');
const pluginRss = require("@11ty/eleventy-plugin-rss");

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
    return `Updated: ${DateTime.fromJSDate(dateObj).toLocaleString(
      DateTime.DATE_MED
    )}`;
  });

  eleventyConfig.addFilter('updatedDate', (post) => {
    return post.data.updated ? post.data.updated : post.data.page.date;
  })

  eleventyConfig.addFilter('newestCollectionUpdatedDate', (collection, emptyFallbackDate) => {
    if (!collection || !collection.length) {
      return emptyFallbackDate || new Date();
    }

    return new Date(Math.max(...collection.map(item => item.data.updated ? item.data.updated : item.data.page.date)));
  });

  eleventyConfig.addShortcode('year', () => `${new Date().getFullYear()}`);

  eleventyConfig.setLibrary('md', md);

  eleventyConfig.addPlugin(pluginRss);

  eleventyConfig.addCollection("rss", function (collectionApi) {
    return collectionApi.getAll().sort((a, b) => {
      const aDate = DateTime.fromJSDate(a.data.updated ? a.data.updated : a.data.page.date);
      const bDate = DateTime.fromJSDate(b.data.updated ? b.data.updated : b.data.page.date);
      return aDate.toMillis() - bDate.toMillis();
    });
  });

  eleventyConfig.addCollection('garden', function (collection) {
    return collection.getFilteredByGlob(['garden/**/*.md', 'index.md']);
  });

  eleventyConfig.setUseGitIgnore(false);

  eleventyConfig.setLibrary('md', {
    permalink: (_, inputPath) => {
      return inputPath.substr(0, inputPath.lastIndexOf('.')) + '.gmi';
    },
    render: async (data) => {
      const gemdown = await import('gemdown');
      return gemdown.md2gemini(data, {useWikiLinks: true, wikiLinksPrefix: '/garden/'});
    }
  });

  eleventyConfig.addGlobalData('eleventyComputed', () => {
    return {
      permalink(data) {
        if (data.permalink) {
          return data.permalink;
        }
        const { inputPath, filePathStem } = data.page;
        if (inputPath.endsWith('.md')) {
          let suffix = '.gmi';
          if (!filePathStem.endsWith('/index')) {
            suffix = '/index' + suffix;
          }
          return `${filePathStem}${suffix}`;
        }
      },
    };
  });

  eleventyConfig.ignores.add('all.md');
  eleventyConfig.ignores.add('feed.njk');
  eleventyConfig.ignores.add('assets/*');
  eleventyConfig.ignores.add('index.html');
  eleventyConfig.addPassthroughCopy('./index.gmi');

  return {
    dir: {
      input: './',
      output: '_gemini',
      layouts: 'layouts_gemini',
      includes: 'includes_gemini',
      data: '_data',
    },
  };
};
