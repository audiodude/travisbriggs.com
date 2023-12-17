---
title: Enabling comments
date: 2023-11-18
updated: 2023-12-16
quality: A
importance: Mid
---

Here's my research so far on comments, and my radical idea for enabling them.

I've read about:

- [DISQUS](https://disqus.com/)
- [IntenseDebate](https://www.intensedebate.com/)
- [Muut (Formerly moot)](https://muut.com/)
- [Facebook embeds](https://facebook.com/)
- [Isso](https://posativ.org/isso/)
- [Commento](https://github.com/adtac/commento)
- [Utterances](https://utteranc.es/)
- _this list taken from [Nikloa's handbook](https://getnikola.com/handbook.html#comments)_

Though I haven't fully evaluated all of them, I was leaning towards Commento. The problem is that I would have to run another server somewhere, and I'm totally over the "fun and excitement" of spinning up, and especially maintaining, cloud servers.

Then I saw someone's blog post that had a "Comments from Mastodon" section. This led me to the [original post](https://carlschwan.eu/2020/12/29/adding-comments-to-your-static-blog-with-mastodon/) by Carl Schwan about how he did this with Hugo. The basic approach is dead simple, and very Web 2.0:

1. Create a post on Mastodon that represents your blog post/garden node.
1. Add the ID of the post (and the site's host) to the front matter of the node.
1. Add Javascript to the node, or one of it's templates

When the page loads, the URL is baked in. Then some Vanilla Javascript runs that downloads JSON of the post's replies from the host server API (from the endpoint `https://<host>/api/v1/statuses/<id>/context`). The Javascript takes the JSON from the API and builds comment boxes for each comment.

## Proof of Concept

It worked, but it was a lot of work. I would have had to manually remember to enable comments for every garden node that I want to be commentable (which is basically every one), and enabling comments would have meant creating a Mastodon post and manually copying the ID of the Mastodon post into the Markdown for the node, then re-deploying the site.

I looked at [eleventy-plugin-activity-pub](https://github.com/LewisDaleUK/eleventy-plugin-activity-pub/tree/main). However, it has a slightly different focus, which is to turn your static site itself into a "Fediverse instance" by creating files at well known endpoints that other Fediverse servers know how to consume. So, if this site is at `travisbriggs.com`, I could have an account called `@garden@travisbriggs.com` and it would contain all of the posts. It uses a common Fediverse hack that the /.well-known/webfinger URL serves a static file that lists only one actor, no matter what user is queried for. It was pointed out to me in the course of this research that this is most likely used in conjunction with an `alias` stanza to point someone at the "real" Fediverse account of the responsible party.

Basically, this led to a bunch of research into the [[activity-pub|ActivityPub protocol]].

## Comments, finally!

In the end, I got it to work for all nodes of the garden, automatically, whenever I publish the site. Keep reading for a technical explanation of how that works.

It starts with an [sqlite](https://www.sqlite.org/) database that is checked into the git repository for the garden. This database has the following schema:

```
CREATE TABLE comments (id TEXT, host TEXT, username TEXT, page_slug TEXT)
```

When the [Eleventy](https://www.11ty.dev/) process is running to generate the site, it has a section of "computed data" which can use an arbitrary Javascript function to add fields to the "data" of a page (basically, what's in the frontmatter). This function can even be asynchronous, so we can query the sqlite database or make network requests! In an `eleventyComputed` block, I have one promise that loads all of the database data (because it'll never be more than a few hundred posts, realistically) and "indexes" it by creating a mapping from the page slug to the rest of the data. Then, in the main `eleventyComputed` function, we check if the data already exists (ie, the node already has a Mastodon post representing it). If it does, we just return the data from the database.

If not, we make a post using a secret API token that is kept outside the git repo. We grab the `id` of this post, save it to the database, and return it to the page. The key point is that, from the point of view of the page rendering process, it is completely inconsequential whether this post was created for the first time, or whether it already exists. By the time the page is rendering, there is a Mastodon post id, server hostname, and username attached to it.

And that's it! You can view the [main commit](https://github.com/audiodude/travisbriggs.com/commit/a4a489f79c1c6e81f017740cad4e9fc0ca4ce321) where I added this functionality if you're interested.

### Bugs

Of course, after I posted this, and once someone _finally_ left a comment on this post, I discovered two bugs:

1. It publishes the Mastodon post while I'm in "development mode", still writing the post. Maybe not the worst thing, but a bit annoying.
1. It doesn't properly link to the originating post, which is much more of a problem.

While fixing these bugs I, of course, found another bug:

1. The first time it creates a Mastodon post for a node, the data structure it returns is wrong, so the links on the comments section are broken for that post only.

The fix for the first issue was to check `process.env.ELEVENTY_RUN_MODE != 'build'` and return early if that's the case. However, this and my use of `fetch` means that I can no longer build the site entirely on [Netlify](https://www.netlify.com/) with a build hook from pushing to the [[github|Github]] repo.

The fix for the second issue was to ignore calls to generate the comment metadata if the page data itself is empty. For some reason, Eleventy was calling my computation function twice: once with empty data, and again with the proper data. Couldn't figure out why, so I just ignore the empty case.

The fix for the third bug was to simply return the right data!

Now that these bugs are fixed you can totally actually leave comments, I swear!

## Leave a comment, already!

And finally, please, if you're here, if you have a Mastodon account on any server, for the love of all things sweet and pure, please leave a comment so I know there are other people out there on the internet!
