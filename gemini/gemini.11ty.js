function generateGeminiText(markdown) {
  const idx = markdown.indexOf('---');
  return markdown.slice(idx).split(' ');
}

let i = 0;
class GeminiGenerate {
  data() {
    return {
      pagination: {
        data: 'collections.garden',
        size: 1,
        alias: 'currentPage',
      },
      permalink: (data) => `${data.currentPage.permalink}.faq`,
    }
  }

  render(data) {
    console.log(data.currentPage, data.currentPage.permalink);
    return '';
  }
}

module.exports = GeminiGenerate