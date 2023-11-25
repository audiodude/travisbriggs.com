---
title: Enabling comments
date: 2022-12-16
quality: B
importance: Mid
host: mastodon.online
username: '@digital_garden'
id: 111468256219043450
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

## It works, but...

It works, but it's a lot of work. I have to manually remember to enable comments for every garden node that I want to be commentable (which is basically every one), and enabling comments means creating a Mastodon post and manually copying the ID of the Mastodon post into the Markdown for the node.

I'm looking at [eleventy-plugin-activity-pub](https://github.com/LewisDaleUK/eleventy-plugin-activity-pub/tree/main). It has a slightly different focus, which is to turn your static site itself into a "Fediverse instance" by creating files at well known endpoints that other Fediverse servers know how to consume. So, if this site is at `travisbriggs.com`, I could have an account called `@garden@travisbriggs.com` and it would contain all of the posts.

So really the interesting problem is how to use both of these features at the same time. That is, my garden hosts it's own Fediverse instance, which publishes all of its posts, and also replies to each post become a reply in the web page itself. Haven't quite figured that one out yet. I actually [[activity-pub|went down this road]] a bit and it didn't turn out very fruitful.

But for now, comments are enabled on this post, so go nuts!
