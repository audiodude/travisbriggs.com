---
title: Plans for the digital garden
date: 2022-12-12
updated: 2022-12-16
quality: B
importance: Mid
---
Here I'd like to discuss some of my plans, hopes, aspirations and whatnot for this digital garden. I've documented some of the more [technical issues](https://github.com/audiodude/garden.travisbriggs.com/issues) on the garden's [Github repo](https://github.com/audiodude/garden.travisbriggs.com). But I guess what I want to do here is talk more about what I plan to write about, how I plan to organize things.

I'm trying to do all this in accordance with my interpretation of the [[digital-gardening-principles|Digital gardening principles]].

Yes, I know I should have comments ([#13!](https://github.com/audiodude/garden.travisbriggs.com/issues/13)). Actually what I'm more excited about is figuring out [a way](https://github.com/audiodude/garden.travisbriggs.com/issues/3) to make internal and external links styled differently. I'm sure there's a dead simple way to do it, where I just figure out if the link starts with `http://` or not, or is in wiki-markup type links (which is how the Eleventy Garden makes backlinks).

I did recently start a [[til|TIL (Today I Learned)]] section of the garden, and I'm interested in keeping that up to date. But it's maybe just another random assortment of reverse-chronological links (boo!). Also, one of the first things I did when I started the garden was to import all of my recent [[blog|blog posts]] from write.as. Oh no, more reverse-chronological links!

I'm thinking that the real goal should be to somehow "absorb" the content in those blog posts into more organic topic pages. Some of them, like [[blog/what-programming-language-should-i-learn|"What programming language should I learn?"]] lend themselves nicely to that. But others, where I'm just [[blog/latest-and-not-so-greatest|randomly complaining about music production]] or something, I'm not sure how to work them in. Maybe that's the fun!

The real problem with "Today I Learned" is that I'm not sure I learn something every day. Or at least not something worth writing about. I don't think I need to force myself to "crank out" content to keep my garden full. I think the spirit of the thing is that it grows organically, like a real garden.

I definitely already have a bunch of "Stub" and "Start" quality articles that I could expand upon. Not sure what exactly to do there other than simply write a Wikipedia article on the topic (like [[DistroKid]]). I read in Andy Matuschak's "Evergreen Notes" that [Evergreen notes should be concept-oriented](https://notes.andymatuschak.org/About_these_notes?stackedNotes=z4SDCZQeRo4xFEQ8H4qrSqd68ucpgE6LU155C&stackedNotes=z6bci25mVUBNFdVWSrQNKr6u7AZ1jFzfTVbMF) which I think I'm not exactly following, because I've developed lots of garden "nodes" that are nouns.

Also Andy says that [Evergreen notes should be densely linked](https://notes.andymatuschak.org/About_these_notes?stackedNotes=z4SDCZQeRo4xFEQ8H4qrSqd68ucpgE6LU155C&stackedNotes=z6bci25mVUBNFdVWSrQNKr6u7AZ1jFzfTVbMF&stackedNotes=z2HUE4ABbQjUNjrNemvkTCsLa1LPDRuwh1tXC) which I knew intuitively, but I hadn't really been following. I think I need to actively seek out and link together my nodes (and no, I'm not going to belabor the analogy and start calling them "plants" or "seeds").

I've actually just implemented Atom feeds, and by editing this page, it should get bumped to the top! Whee! I also immediately noticed the pages that didn't have creation or updated dates, because they bubbled to the top. This was because when Netlify checked out the git repo of this site in order to build and deploy it, all the files on disk happen to be created "now", so anything that didn't have a date specified to override that bubbled to the top.