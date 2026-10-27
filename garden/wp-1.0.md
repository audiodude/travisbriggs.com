---
title: WP 1.0 Project
date: 2022-12-01T00:00:00.000Z
quality: B
importance: Mid
---
WP 1.0 is a project on Wikipedia that I have been working on since 2018. It is based on the original _v2_ of the bot that was written in Perl. I re-wrote it in [[Python]].

It makes this glorious table:

![](/assets/img/garden/image-2.png)

As well as individual tables for all of the [WikiProjects](https://en.wikipedia.org/wiki/Wikipedia:WikiProject) that it tracks. It also creates update logs for all of the projects, letting editors know how articles have had their assessments changed.

The project was written from scratch, but my philosophy for re-writes is always: avoid adding new features at the same time. Basically, I want to avoid the [Second-system effect](https://en.wikipedia.org/wiki/Second-system_effect). To accomplish that, I traced through the Perl logic, learning a good amount about Perl along the way, and translated all of the functionality to the new Python version. It went live in 2019 and I'm very happy to report that there have been very few hiccups and outages since then.

The tool was built in close collaboration with [[Kiwix]]. I have hosted three separate [Google Summer of Code](https://summerofcode.withgoogle.com/) students (aka interns) that have successfully contriubted a feature or milestone to the project as well.

I'm still adding features and responding to bugs as they come up, though more recently I've been doing so with [[vibe coding]]. I completed a 100% port of the code to Vue 3 and Tailwind, then redesigned the entire UI, all with Claude. These tasks were looming over me (the first two were absolutely required based on the number of CVEs building up in our old Javascript dependencies). I'm not sure I ever would have finished them on my own.
