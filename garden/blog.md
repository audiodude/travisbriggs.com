---
title: Blog Posts
link: blog/index
date: 2022-11-26
updated: 2023-09-21
---

I guess if this is my "digital garden" then these posts are like potted plants that were already grown that have been moved to the rockier parts of the garden landscape. Or something.

---

Immediately after publishing a blog post in 2017 I came to the conclusion that my blog is basically a liability. It’s well established that no one reads it regularly or even semi-regularly. Almost every post is met with the stark sounds of crickets.

And yet, someone Googling “Travis Briggs blog” could find it pretty quickly. And I doubt that what I’ve written would serve for them to form a positive impression of me. Something about staying silent and being thought a fool.

But on the other hand, I kind of like being the sort of person who is daring enough to put his feelings out there on the Internet. I like that I have a more substantial repository of what’s going on with me than just 140 character snippets, which could easily themselves be just as damning. Part of this is why I eventually paid for a third party service to delete my Twitter posts after 90 days, and why I was very relieved, upon returning to Mastodon, that it had that feature built into new versions.

I hope that a digital garden will provide a more well-rounded view of my digital self, and be less prone to quotation without context.

Also, watch the fuck out because here comes some dreaded [[dg-reverse|reverse chronological order]] posts.

{% for post in collections.blog reversed -%}
- [{{ post.data.title }}]({{post.url}})
{% endfor -%}

---

The above posts were manually copied over from my [write.as blog](https://write.as/audiodude), where they still live for the time being. Previously, I posted blogs on [Medium](https://blog.travisbriggs.com), where I had a legacy feature for having a free custom domain name before they got all "charge-y" for it.
