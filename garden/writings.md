---
title: Various Writings
date: 2024-09-17
quality: FA
importance: Top
---

Here is a collection of snippets of writing that I creeated between 2014 and 2017. Most of these were just idle time-wasting while sitting on the Google bus. They originally lived on a separate site, `writings.travisbriggs.com`, but I thought it would be nice to integrate them into the Garden. Just need to make sure I don't accidentally list them in the [[dg-reverse|dreaded reverse chronological order]].

{% for post in collections.writings -%}
{%- if isGemini %}
=> {{ post.url }} {{ post.data.title }}
{%- else -%}
- [{{ post.data.title }}]({{ post.url }})
{% endif -%}
{% endfor -%}