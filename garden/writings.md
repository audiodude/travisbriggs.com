---
title: Various Writings
date: 2024-09-17
quality: FA
importance: Top
---

Here is a collection of snippets of writing that I creeated between 2014 and 2017. Lots of poetry, a couple of what could be intros to a short story ([[writings/barney|"Barney"]], [[writings/lazily-slapping-the-snare-drum|"Lazily Slapping the Snare Drum"]]). Most of these were just idle time-wasting while sitting on the Google bus. They originally lived on a separate site, `writings.travisbriggs.com`, but I thought it would be nice to integrate them into the Garden. Just need to make sure I don't accidentally list them in the [[dg-reverse|dreaded reverse chronological order]].

As I migrated them here, I didn't quite read all of them, but I generally browsed through them. As it turns out, I was a late bloomer and my emo phase came in my early 30s. I seriously sound very depressed in many of these.

{% for post in collections.writings -%}
{%- if isGemini %}
=> {{ post.url }} {{ post.data.title }}
{%- else -%}
- [{{ post.data.title }}]({{ post.url }})
{% endif -%}
{% endfor -%}