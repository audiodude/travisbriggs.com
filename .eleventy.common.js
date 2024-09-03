const { DateTime } = require('luxon');

module.exports.commonConfig = function (eleventyConfig) {
  eleventyConfig.addFilter('simpleDate', (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toLocaleString(
      DateTime.DATE_MED,
    );
  });

  eleventyConfig.addFilter('outputIfNotEqualTo', (dateObj, othDateObj) => {
    if (
      DateTime.fromJSDate(dateObj).toMillis() ===
      DateTime.fromJSDate(othDateObj).toMillis()
    ) {
      return;
    }
    return `Updated: ${DateTime.fromJSDate(dateObj, {
      zone: 'utc',
    }).toLocaleString(DateTime.DATE_MED)}`;
  });

  eleventyConfig.addFilter('updatedDate', (post) => {
    return post.data.updated ? post.data.updated : post.data.page.date;
  });

  eleventyConfig.addFilter(
    'newestCollectionUpdatedDate',
    (collection, emptyFallbackDate) => {
      if (!collection || !collection.length) {
        return emptyFallbackDate || new Date();
      }

      return new Date(
        Math.max(
          ...collection.map((item) =>
            item.data.updated ? item.data.updated : item.data.page.date,
          ),
        ),
      );
    },
  );

  eleventyConfig.addShortcode('year', () => `${new Date().getFullYear()}`);

  eleventyConfig.addCollection('garden', function (collection) {
    return collection.getFilteredByGlob(['garden/**/*.md', 'index.md']);
  });

  eleventyConfig.setUseGitIgnore(false);

  return eleventyConfig;
};
