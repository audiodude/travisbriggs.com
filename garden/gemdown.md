---
title: Gemdown
date: 2022-08-26
quality: B
importance: Mid
---

A Javascript library for rendering Markdown files in the Gemini .gmi format.

See it on [Github](https://github.com/audiodude/gemdown) or [NPM](https://www.npmjs.com/package/gemdown).

## Overview

[Gemini](https://gemini.circumlunar.space/) is a recent text-based internet protocol that aims to be more robust than Gopher but more lightweight than the web, and doesn't seek to replace either. You need a special [Gemini client](https://github.com/kr1sp1n/awesome-gemini#clients) to connect to "Gemini capsules" in "Gemspace" (such as `gemini://gemini.circumlunar.space/`).

You can read more about Gemini [[gemini|on this digital garden]].

Gemini capsules are authored using "Gemtext", which you can [read the description of](https://gemini.circumlunar.space/docs/gemtext.gmi). For a list of many Gemini related projects and sites, see [Awesome Gemini](https://github.com/kr1sp1n/awesome-gemini).

According to [Wikipedia](https://en.wikipedia.org/wiki/Markdown), [Markdown](https://daringfireball.net/projects/markdown/) is "a lightweight markup language for creating formatted text using a plain-text editor". Markdown is commonly used in [Static Site Generators](https://www.cloudflare.com/learning/performance/static-site-generator/) to store the source code for pages such as blog posts without making the author write full HTML markup.

Gemdown, then, is a library that takes Markdown input and outputs Gemtext. It is designed to be used in conjunction with a static site generator in order to create a Gemini mirror of an HTTP website (HTTP/Gemini mirrors of the same content is common amongst the Gemini community).

## Relation to other libraries

The above is copied directly from the README.md of gemdown on [Github](https://github.com/audiodude/gemdown). I should admit that the library was heavily inspired by the Python library [md2gemini](https://github.com/makew0rld/md2gemini), which actually got archived around the time that I was developing gemdown. I posted on Mastodon to thank the author for the inspiration, and he replied back, which was nice.

The gemdown library also uses [marked](https://github.com/markedjs/marked) as the main way of parsing Markdown. The marked library is written in [[javascript-typescript|Javascript (actually Typescript I think)]] and is extremely excellent. It is [highly extensible](https://marked.js.org/using_pro) which is what allowed me to create custom rules that output gemtext.

I created gemdown as a ESM module since marked is more easily imported that way.

## What's next?

Given that I'm currently generating a Gemini version of this digital garden, and gemdown has all the features I need to do that, I might consider marking gemdown as "done" for now and releasing version [1.0.0](https://semver.org). Of course, I'm not going to do that today since I already release a version today and I'd like to have more time for the library to "cook".