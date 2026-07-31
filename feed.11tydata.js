// Eleventy 3 renders `templateContent` lazily; feed.njk reads
// `post.templateContent` for every item in the `rss` collection, so it must
// declare that dependency (via `eleventyImport.collections`) or the build can
// try to read a garden page's rendered content before that page has been
// rendered, throwing TemplateContentPrematureUseError ("Tried to use
// templateContent too early"). See
// https://www.11ty.dev/docs/data-cascade/#eleventyimport and
// https://hamatti.org/snacks/fix-templatecontent-too-early-in-eleventy/
//
// A sibling data file (rather than editing feed.njk's own front matter) keeps
// feed.njk itself unchanged, per Task 3's requirement that the Task 1 feed
// test remain the arbiter of that file.
module.exports = {
  eleventyImport: {
    collections: ['rss'],
  },
};
