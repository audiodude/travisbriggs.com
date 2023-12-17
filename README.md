# Digital Garden of Travis Briggs

This is the static site generator that creates the digital gardens at:

https://travisbriggs.com

[gemini://gem.travisbriggs.com](gemini://gem.travisbriggs.com)

## Background

A Digital Garden is like a blog, as it's a place to share personal thoughts, projects and other things on the web (or on Gemini). However it differs in that it is setup more as a graph of nodes that are connected and evergreen instead of a dreaded reverse chronological ordering of "posts". For more information on Digital Gardens, see the [post that inspired me by Maggie Appleton](https://maggieappleton.com/garden-history).

This static site generator is built off the awesome template [Eleventy Garden](https://github.com/binyamin/eleventy-garden) by [Binyamin Aron Green](https://www.buymeacoffee.com/binyamin). That in turn uses the awesome [Eleventy static site generator](https://www.11ty.dev/), which is more or less a clone of [Jekyll](https://jekyllrb.com/) in Javascript that winds up being more flexibile and more easily extensible.

## Developing

```bash
npm install
npm start
```

## Deploying

### www
First, build the site. **Warning:** this will create a Mastodon post for every new garden node, assuming you have a `MASTODON_API_KEY` entry in a top-level `.env` file.

```bash
npm build
```

Next deploy to Netlify (`--prod` to skip the preview step):

```bash
netlify deploy --prod -d _site
```

Finally, commit the code and push to Github (left to the reader). It's **important that this step is last**, because the comments.sqlite3 (where the Mastodon ids for node comments live) database is commited as part of the repo, and will be out of date if the repo is pushed before deploying.

### Gemini
The Gemini capsule is hosted from a server on [Digital Ocean](https://www.digitalocean.com/) using the excellent [Twins](https://code.rocket9labs.com/tslocum/twins) server and certificates from [Let's Encrypt](https://letsencrypt.org/). To deploy the Gemini site, run:

```bash
GEM_USER=username GEM_HOST=some.site.garden.example.com npm run deploy-gemini
```

This will run Eleventy in Gemini mode, create a tarball, upload it to the remote host, and extract it to the necessary directory.

## Recreating the comments database

If you're in this section, I'm sad for you. You probably want to first [delete all existing comments](https://gist.github.com/audiodude/cb8234b4957892a65af6608f0ac3c359). Then run:

```bash
node create_comments_db.js
```

Finally, follow the build and deploy steps above.
