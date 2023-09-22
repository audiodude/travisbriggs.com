const { commonConfig } = require('./.eleventy.common.js');

module.exports = function (eleventyConfig) {
  eleventyConfig = commonConfig(eleventyConfig);

  eleventyConfig.setLibrary('md', {
    permalink: (_, inputPath) => {
      return inputPath.substr(0, inputPath.lastIndexOf('.')) + '.gmi';
    },
    render: async (data) => {
      const gemdown = await import('gemdown');
      return gemdown.md2gemini(data, {
        useWikiLinks: true,
        wikiLinksPrefix: '/garden/',
      });
    },
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

  eleventyConfig.addGlobalData('isGemini', true);

  eleventyConfig.addTransform('unescape-html', function (content) {
    // HTML escapes don't make any sense in Gemini content.
    return content
      .replaceAll('&gt;', '>')
      .replaceAll('&lt;', '<')
      .replaceAll('&quot;', '"')
      .replaceAll('&amp;', '&');
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
