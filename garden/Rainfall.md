---
title: Rainfall, a website generator for musicians
date: 2024-09-21
quality: GA
importance: Top
---
## Early attempts

I have been working on personal song hosting since 2018, when I created [songs.travisbriggs.com](https://songs.travisbriggs.com) ([Github](https://github.com/audiodude/songs.travisbriggs.com)). The point was to replace Soundcloud, which I was paying for but getting very little value from.

Sorry, this garden node is about to get technical...

That site is basically a custom [static site generator](https://www.cloudflare.com/learning/performance/static-site-generator/), written in [Python](https://www.python.org/) and [Flask](https://flask.palletsprojects.com/en/3.0.x/). All song metadata (name, tags, descriptions) is stored in [Markdown](https://daringfireball.net/projects/markdown) files (much like this Garden). It operates as a normal Flask web application, for previewing the site, but when a special command is given, it "crawls" through all of the pages of the site and "renders" them as simple HTML pages, like a website from 1999 (as all static site generators due). The practical upside of all this is that I can host the site on Netlify, where I don't need any Python processes or databases running, and as of this writing Netlify continues to operate a free plan for a pretty generous amount of bandwidth per month, which includes a CDN (in case you get hugged by hacker news or reddit).

After using this setup for a while and being happy with it, I "open sourced" it, cleaning out all the personally identifying and specific information, as [Rainfall](https://github.com/audiodude/rainfall) (a play on Soundcloud I think?). With that, someone could download my template and create their own static music site with their own music on their own Netlify (or anywhere else). Seemed legit.

However, no one used it (surprise!). At that point, I had in my mind a project (still called Rainfall) that would allow users to sign up and upload songs through a web interface, providing metadata. I would then spin up a local Flask server for them (the same as my preview server above) and let them preview their site in an iframe before clicking a publish button, doing an OAuth with Netlify, and making their site live. I got this working for one site, but the technical hurdle I could never overcome was the problem of dynamically attaching a newly created web app to my serving stack without restarting the web server. That remains the unsolved problem for server-side Rainfall.

## Moving Forward

Obviously, everything I've written above about the potential demise of Bandcamp, and Andrew's article and impetus, has emboldened me to look at this again. I found out about the awesome [Faircamp](https://codeberg.org/simonrepp/faircamp) recently, which seems very slick and full featured and customizable, in a way that I think artists themselves will appreciate (rather than just creating clones of my songs.travisbriggs.com site).

The potential difficulty with Faircamp is that it is a Rust binary that runs locally, and requires an installation. More than that, the manual clearly states:

> On BSD, macOS and Windows you are entering uncharted territory, ...

Beyond that, the data for the app (the songs and metadata and images and everything) have to be hand cultivated into a particular directory structure and format for it to work.

What if I could take my ideas (and maybe even my codebase!) that I developed for server-side Rainfall, and use Faircamp as a sort of "backend"? That is, I could:

1. Allow users to sign in, upload their songs, add metadata, add images, etc.
2. Create the directory structure that Faircamp requires.
3. Render HTML with Faircamp
4. Allow users to preview their site, surfacing any Faircamp errors/issues.
5. OAuth with Netlify and publish to the web.

That's it, that's the idea. 1200 words later, that's it.

## Progress (technical)

So far, I've released both versions 1.0 and 1.1 of the project. 1.0 allowed you to upload songs and create the basic website, while version 1.1 added the ability to log in via Mastodon (because lots of people complained about the exclusive Google login).

The Github repo is [here](https://github.com/audiodude/rainfall), and you can see the issues I'm tracking for future releases.

The tech statck is [Python/Flask](https://flask.palletsprojects.com/en/3.0.x/), [SQLAlchemy](https://www.sqlalchemy.org/) and [Vue 3](https://vuejs.org/) for the frontend. It allows logging in with Google or Mastodon accounts (because I _really_ didn't want to deal with user registration and especially password management/reset emails/etc). I have tests for the backend in [Pytest](https://docs.pytest.org/en/7.4.x/).

I originally thought I couldn't deploy this on my preferred platform of [Fly.io](https://fly.io/), because of the need for filesystem access. However I was able to do it with the use of "shared volumes".