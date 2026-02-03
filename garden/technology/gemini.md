---
title: Gemini
date: 2022-12-07
updated: 2023-08-26
quality: B
importance: High
---

[Gemini](https://gemini.circumlunar.space/) is a new protocol for the internet. It is a protocol, not an app, or even a browser, or server, or software. These things exist in the Gemini ecosystem, of course, but they're not what it fundamentally is.

Gemini aims to be more robust than Gopher but more lightweight than the web, and doesn't seek to replace either. You need a special [Gemini client](https://github.com/kr1sp1n/awesome-gemini#clients) to connect to "Gemini capsules" in "Gemspace" (such as [gemini://gemini.circumlunar.space/](gemini://gemini.circumlunar.space/)).


Robin Sloan [encourages us](https://www.robinsloan.com/lab/new-avenues/#meta) to make a thing with which we can talk about the thing. I notice this a lot on Mastodon of course, much of it is about itself. I actually think that Gemini is much worse in this regard, in that everyone wants to build a Gemini server, or client or some automation integration thing, but no one wants to write in the medium or consume content there. Tons of content in gemspace (URLS starting with `gemini://`, like [gemini://gem.bestalbumsintheuniverse.com](gemini://gem.bestalbumsintheuniverse.com)) is about Gemini, but it's also often mirrored in websites as well. So people are hosting gemblogs and gemsites, but they are just shadows of the content that's on the web. That's sad.

I originally considered making this garden a gemini-only publication. I thought about the [very next paragraph](https://www.robinsloan.com/lab/new-avenues/#exemplars) in that same recent newsletter post by Robin: "You can edit by hand!". Yes I can, but it's tedious and error prone. I could make a garden in Gemini, and it seems like a good medium for it with it's distraction free, basic gemtext (`.gmi`) format. But I've found that the creative pursuits I'm most likely to take up are always those with the least friction. Years ago, I stopped unplugging my mic and guitar cables from my audio interface when I'm done with them. In fact the microphone itself sits on my desk, plugged in 24/7. If I'm writing a song, I can simply pick it up and start singing into it. That's the level of ease/automation that I need in a creative workflow like a digital garden to make it work for me, and prompt me to keep it evergreen.

That's not to say that I won't be, just like everyone else, posting my content on Gemini *as well*. In fact, as of late August 2023, I have a [Gemini capsule](gemini://gem.garden.travisbriggs.com/) for this Digital Garden finally!

Part of converting this digital garden to Gemini involved writing my own Javascript library for converting Markdown (which this garden is [written in](https://github.com/audiodude/garden.travisbriggs.com)) to gemtext. I wrote the [[gemdown]] library during August 2023 for this purpose. It is my first ever open-source library that was created solely by me for consumption by others! I'm pretty proud.

And who says you can't have more than one garden. I have to confess that some of this is vanity. I want people to be able to find and read my garden posts, as much as it [[dg-solo|"shouldn't be about that"]]. So I'm posting web first.

I did convert my [[best albums in the universe]] site to Gemini (as part of the static site generation process) and publish it at [gemini://gem.bestalbumsintheuniverse.com](gemini://gem.bestalbumsintheuniverse.com).

Gemini is very promising. It's limitations are, as usual, it's greatest strengths. I have responded to Robin with Gemini as a new avenue for 2023.

Some interesting Gemini related links:

* [Lagrange Gemini Browser (highly recommended!)](https://gmi.skyjake.fi/lagrange/)
* [Twins Gemini server (also highly recommended!)](https://code.rocketnine.space/tslocum/twins)
* [First 50 known Gemini servers (hint: Best Albums in the Universe is one of them!)](https://gemini.circumlunar.space/servers/)
* [Awesome Gemini on Github](https://github.com/kr1sp1n/awesome-gemini)