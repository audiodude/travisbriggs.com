require('dotenv').config();

const { titleCase } = require('title-case');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('comments.sqlite3');

// This regex finds all wikilinks in a string
const wikilinkRegExp = /\[\[\s?([^\[\]\|\n\r]+)(\|[^\[\]\|\n\r]+)?\s?\]\]/g;

function caselessCompare(a, b) {
  return a.normalize().toLowerCase() === b.normalize().toLowerCase();
}

async function getDbData() {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT page_slug, id, host, username FROM comments',
      (err, rows) => {
        if (err) {
          reject(err);
        }
        resolve(rows);
      },
    );
  }).then((rows) => {
    const mapping = {};
    for (const row of rows) {
      mapping[row.page_slug] = row;
    }
    return mapping;
  });
}

async function postNewStatus(data) {
  await new Promise((resolve, reject) => {
    setTimeout(resolve, Math.random() * 2000);
  });

  body = JSON.stringify({
    status: `New garden node! "${data.title}":\n\nhttps://travisbriggs.com${data.page.url}\n\nPublic replies to this status will be posted on the site.`,
    visibility: 'public',
  });
  const resp = await fetch('https://mastodon.online/api/v1/statuses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.MASTODON_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body,
  });
  if (!resp.ok) {
    console.error(await resp.text());
    return;
  }

  return resp.json();
}

module.exports = {
  layout: 'garden.html',
  type: 'garden',
  eleventyComputed: {
    title: (data) => data.title || titleCase(data.page.fileSlug),
    backlinks: (data) => {
      const notes = data.collections.garden;
      const currentFileSlug = data.page.filePathStem.replace('/garden/', '');

      let backlinks = [];

      // Search the other notes for backlinks
      for (const otherNote of notes) {
        const noteContent = otherNote.template.frontMatter.content;

        // Get all links from otherNote
        const outboundLinks = (noteContent.match(wikilinkRegExp) || []).map(
          (link) =>
            // Extract link location
            link
              .slice(2, -2)
              .split('|')[0]
              .replace(/.(md|markdown)\s?$/i, '')
              .trim(),
        );

        // If the other note links here, return related info
        const hasLink = outboundLinks.some((link) =>
          caselessCompare(link, currentFileSlug),
        );
        // If the other note is the index page of a collection the note
        // is in, add it.
        const inCollection =
          data.tags &&
          data.tags.some((tag) => `/garden/${tag}/` === otherNote.url);
        if (hasLink || inCollection) {
          // Construct preview for hovercards
          let preview = noteContent.slice(0, 240);

          backlinks.push({
            url: otherNote.url,
            title: otherNote.data.title,
            preview,
          });
        }
      }

      return backlinks;
    },
    comments: async (data) => {
      if (Object.keys(data).length == 0) {
        // For some reason, Elevnty calls this method twice, first with an empty object for data,
        // and then again with it filled out. Skip the empty case.
        return;
      }
      const mapping = await getDbData();
      if (mapping[data.page.fileSlug]) {
        // Found commment status for this node, return it.
        return mapping[data.page.fileSlug];
      }

      if (process.env.ELEVENTY_RUN_MODE != 'build') {
        return;
      }

      // No comment status, post a new one.
      const api_data = await postNewStatus(data);
      if (!api_data) {
        return;
      } else {
        console.log(
          `Posted new status with id=${api_data.id} for post ${data.page.fileSlug}`,
        );
      }

      return new Promise((resolve, reject) => {
        // Insert the id of the new status into the sqlite3 database.
        db.run(
          'INSERT INTO comments (id, host, username, page_slug) VALUES ($id, $host, $username, $page_slug)',
          {
            $id: api_data.id,
            $host: 'mastodon.online',
            $username: '@digital_garden',
            $page_slug: data.page.fileSlug,
          },
          (err) => {
            if (err) {
              reject(err);
            }
            resolve();
          },
        );
      }).then(() => {
        return {
          id: api_data.id,
          host: 'mastodon.online',
          username: '@digital_garden',
          page_slug: data.page.fileSlug,
        };
      });
    },
  },
};
