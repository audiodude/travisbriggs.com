---
title: Blog
---
# Blog posts

I guess if this is my "digital garden" then these posts are like potted plants that were already grown that have been moved to the rockier parts of the garden landscape. Or something.

<ul>
{%- for post in collections.blog reversed -%}
  <li><a href="{{post.url}}">{{ post.data.title }}</a></li>
{%- endfor -%}
  <li>...More to be ported over soon!</li>
</ul>