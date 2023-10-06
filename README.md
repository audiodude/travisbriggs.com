# Digital Garden of Travis Briggs

This is the static site generator that creates the digital gardens at:

https://garden.travisbriggs.com

[gemini://gem.garden.travisbriggs.com](gemini://gem.garden.travisbriggs.com)

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
The www site is currently set up to automatically deploy via a Github hook, to [Netlify](https://www.netlify.com/).

### Gemini
The Gemini capsule is hosted from a server on [Digital Ocean](https://www.digitalocean.com/) using the excellent [Twins](https://code.rocket9labs.com/tslocum/twins) server and certificates from [Let's Encrypt](https://letsencrypt.org/). To deploy the Gemini site, run:

```bash
GEM_USER=username GEM_HOST=some.site.garden.example.com npm run deploy-gemini
```

This will run Eleventy, create a tarball, upload it to the remote host, and extract it to the necessary directory.
