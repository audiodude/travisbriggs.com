---
title: TIL (Today I Learned)
date: 2022-11-29
updated: 2023-09-21
---

I haven't actually done many posts in the TIL format, but I'm happy to give it a go and see what comes of it!

Unfortunately the best way I can think of to present these is in the dreaded [[dg-reverse|reverse chronological order]], which was much maligned in [Maggie's](https://maggieappleton.com/) [post that inspired me](https://maggieappleton.com/garden-history) on digital gardening. Forgive me!

<ul>
{%- for post in collections.til reversed -%}
  <li>On {{post.date | simpleDate}} I Learned...<a href="{{post.url}}">{{post.data.title}}</a></li>
{%- endfor -%}
</ul>
