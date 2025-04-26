---
title: The Best Albums in the Universe
date: 2025-04-25
quality: A
importance: Top
---

I think I started this project in 2011 or 2012. It lives on the web at [bestalbumsintheuniverse.com](https://bestalbumsintheuniverse.com) and on [[gemini|Gemini]] at [gem.bestalbumsintheuniverse.com](gemini://gem.bestalbumsintheuniverse.com).

When I was coming up with the name, I knew I wanted to keep track of a curated collection of my favorite albums, mostly for my own reference. But I thought it would be lame to be like my-favorite-albums.com or something like that. Why not go big and call it Best Albums in the Universe?

The best albums list is meant to be a living document, just like this garden. It is intended to grow as I discover, or sometimes more accurately remember, more albums. So far the only criteria I've set for myself is that I don't want to list multiple albums by the same artist, or else there would be many more Beatles, Radiohead and Weezer albums on there.

## History

The site was originally on Tumblr. Hold on, let me check if the original Tumblr site is still up or if I can find it....

...nope, can't find it. I think I might have deleted it at some point. My [personal tumblr](https://travisbriggs.tumblr.com/), which just has a couple of links, refers to the new website.

Anyways, originally it was going to be a collaboration between me and my wife, [[Abby]]. She actually picked the second album and wrote the description, which is why it talks about it being her namesake. That didn't last very long though. In fact, I've had the site for over a decade and there are only 39 albums on there currently. So clearly I have not updated the site very often. If you go to the Gemini version, it actually lists the date at which I posted an album, which is kind of embarassing.

Eventually, I changed it to a [Jekyll](https://jekyllrb.com/) site, around the time that [[software|static site generators]] became all the rage. There was a time when Github let you use Jekyll to deploy a static site for free inside of a Github repository, and if you look in the history of [this repo](https://github.com/audiodude/best-albums) you can see that it was used there (you could -- and likely still can -- point a custom URL to Github's static sites).

When I moved from Tumblr to the Jekyll site, I already had a fair number of albums posted, with a lot of metadata. So I wanted to preserve this data somehow, hopefully programmatically. The scripts I wrote to take care of that are still part of the Jekyll repo linked above.

The interesting thing about that early version was that I wrote all of the album descriptions in [Markdown](https://daringfireball.net/projects/markdown/) files, as you do with Jekyll sites, but there was a lot of "front matter" in the Markdown that was used to annotate each entry, like the `photo_sm` and `photo_lg` links to the thumbnail and full versions of the album art. I would find the album art on Amazon, and upload them to imgur.com where I would "hotlink" to them from my site. In fact, I used a little known feature of imgur, which was that you could take the image url, say `http://i.imgur.com/abcdefg.png` and append a character to the ID like `abcdefgs.png` (s for "small") or `abcdefgl.png` (l for "large").

Also, the markdown files didn't directly translate into the "cover art squares" you see on the website. Instead, I had an `albums.json` file in my root directory that contained a [Liquid](https://shopify.github.io/liquid/) template for generating a full [JSON](https://www.json.org/json-en.html) document of the final albums. Then, when the site loaded, the Javascript on the page would request the `albums.json` file, parse it, and use [Mustache templates](https://mustache.github.io/) to generate the final HTML document. There's also a "grid layout library" called [Masonry](https://masonry.desandro.com/) that is used, plus some custom Javascript to control when to display or collapse albums when they are clicked, and to create permalinks to a version of the site with certain albums already open.

A few years ago, I decided to write a "headless CMS" for the site, so that when I type in a [Wikidata](https://wikidata.org) ID for an album, it does an API lookup on Wikidata and grabs the Artist, Title, Release Year, Spotify ID (the best albums page includes Spotify embeds), and album art. At that point, all I have to do is write the description, click save, and then upload the result to the static site. [This CMS](https://github.com/audiodude/best-albums-headless) is written in [[Ruby on Rails]] and is hosted on the same server that hosts the best albums site itself.

At some point I'll write about my [[gemini|Gemini]] version (which is still listed in the historical record of the [first fifty Gemini hosts](https://geminiprotocol.net/history/servers.gmi)).