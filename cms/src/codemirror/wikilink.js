export function wikilinkCompletion(slugsPromise) {
  let slugs = [];
  slugsPromise.then((data) => {
    slugs = data;
  });

  return (context) => {
    const before = context.matchBefore(/\[\[[^\]\|]*/);
    if (!before) return null;

    const query = before.text.slice(2).toLowerCase();

    const options = slugs
      .filter(
        (s) =>
          s.slug.toLowerCase().includes(query) ||
          s.title.toLowerCase().includes(query)
      )
      .map((s) => ({
        label: s.slug,
        detail: s.title,
        apply: s.slug,
      }));

    return {
      from: before.from + 2,
      options,
      validFor: /^[^\]\|]*/,
    };
  };
}
