---
title: Bandcamp
date: 2023-10-29
updated: 2023-11-02
quality: Start
importance: Top
---

While I have used Bandcamp as both a [[danger-third-rail|music publisher]] and music consumer, I don't really have the fanatical attachment to it that I see from some corners of the internet. That's probably okay. I do fundamentally believe that a Bandcamp model of "long tail" artists and music producers, as well as labels and collectives, is the way forward for the _capital M_ Music Industry. Or rather, it seems that said industry will only stratify into 10 artists with a billion views on Spotify/YouTube and a billion artists with 10 views on Bandcamp. [Deezer's new royalty terms](https://www.billboard.com/pro/streaming-reform-debate-artist-centric-royalties-impala-helen-smith-opinion/) are a particularly odious step in that direction: they pay anyone with less than 500 listeners or 1000 streams per month at half the rate. This reverse Robin Hood model is literally stealing from the most vulnerable artists in the ecosystem to give to the richest.

I was a bit uneasy when [Epic Games bought Bandcamp](https://www.pcgamer.com/epic-games-bandcamp-acquisition/) in March 2022. But I calmed down, because I rationalized that they were simply looking to have more User Generated Content in their portfolio.

Now Bandcamp has been flipped again. After just 18 months, Epic sold the business to [Songtradr](https://www.theguardian.com/music/2023/oct/17/bandcamp-lays-off-half-its-staff-after-buyout-by-songtradr). Songtradr is in the business of providing licensing and cleared songs and samples to media creators, from social media all the way up to ad agencies and more. It's pure speculation (but I'm not a journalist, this is just my garden), but I wouldn't be surprised if Songtradr just wants to take all the Bandcamp music and put it in a zipfile and add it to their licensing corpus. They're probably working with their lawyers to figure out a way they can do that under Bandcamps existing TOS right now. Michael Donaldson even [theorizes](https://8sided.blog/a-mess-of-headaches/) that the mess of uncleared samples and covers on Bandcamp already will cause Songtradr a lot of headaches. I can see a world where they try to get artists to attest that their songs are unencumbered or face personal liability.

And of course, Songtradr has turned around and immediately laid of 50% of Bandcamp's staff, in the name of efficiency. [Tom Hawking at The Guardian](https://www.theguardian.com/commentisfree/2023/oct/27/epic-games-bandcamp-acquired-sondtradr) writes about some of the ways this belies the goals and incentives of a company that cares more about cash than culture.

Altogether, it is not really a great time to be an artist on the Bandcamp platform. There are millions who love it, and who trust it, and who even use it for their income (I must confess that ~30% of the revenue I've ever made as a musician has come from Bandcamp). But I think the writing's on the wall as it were. Bandcamp may or may not have a future at all, and it is unlikely that the future it has is going to be as well in alignment with the interests of its artists and fans as it was in the past.

The key point is that it's not a certainty that Bandcamp will become hostile to the users it serves. Rather, the imperative is to cultivate backups and alternatives **now**, before the day comes when everyone wakes up to having to sign some contract or pay some gross fee and there's nowhere else to go.

So what are we to do?

Andrew Roach writes about [The Uncertain Future of Bandcamp](https://ajroach42.com/the-uncertain-future-of-bandcamp/), and with his normal enthusiasm and forward thinking, he proposes grabbing a bunch of his friends and writing a complete turnkey alternative from the ground up. I'm exhausted just thinking about it, but it sounds awesome. He explicitly states that he's not interested in competing with or replacing any other alternative solutions that may pop up, or may already be in progress, which I think is really smart and graceful.

---

## Technical Solutions

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

I've started the project, the Github repo is [here](https://github.com/audiodude/rainfall).

So far I've mostly just set up a basic web app in [Python/Flask](https://flask.palletsprojects.com/en/3.0.x/), [SQLAlchemy](https://www.sqlalchemy.org/) and [Vue 3](https://vuejs.org/) for the frontend. The only functionality it currently features is logging in with a Google account (because I _really_ didn't want to deal with user registration and especially password management/reset emails/etc). I have tests for the backend in [Pytest](https://docs.pytest.org/en/7.4.x/).

I've also read through the [Faircamp manual](https://simonrepp.com/faircamp/manual/) a few times and have a basic idea for my integration. Sadly, because of the dependency on Faircamp and the necessity for accessing the filesystem, there's no easy way I could host this on [Fly.io](https://fly.io/) or a similar platform. I will have to spin up a [Digital Ocean](https://www.digitalocean.com/) droplet or [AWS](https://aws.amazon.com) and manually install and deploy there. Though now that I think of it, I guess that means I can use an [SQLite](https://www.sqlite.org/index.html) database!

---

Any comments are welcome to my email ([audiodude@gmail.com](mailto:audiodude@gmail.com)) or on [Mastodon](https://sfba.social/@audiodude).
