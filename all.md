---
eleventyExcludeFromCollections: true,
---
<ul>
{%- for post in collections.all reversed -%}
{% if post.url != "/all/" %}
  <li><a href="{{post.url}}">{{ post.data.title }}</a></li>
{% endif %}
{%- endfor -%}
</ul>
