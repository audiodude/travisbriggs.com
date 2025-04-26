---
title: Perl
date: 2025-04-25
quality: Start
importance: Low
---
I learned a little bit of Perl in college, and even coded some simple web apps with it. The most experience I've had with it, though, was when I was rewriting the [[wp-1.0|WP 1.0]] bot/web server. I translated hundreds of lines of Perl into Python, and it was definitely a considerable task.

Perl kind of looks deceptively simple. There are all the usual suspects of `if` statements and `for` loops, and even dictionaries look relatively sane at first glance. And I'm not talking about the [code golf](https://code.golf/) versions of perl where you just have a bunch of `<> = {};` or whatever that somehow iterates over input on standard in and does something with it. I'm talking about Perl that was written by a considerate programmer, with the intention of being reasonably legible and maintainable.

But still, I found too many constructs that were hard to grasp. Too many ways of doing the same thing, which of course leads to the Python precept of that "There should be one-- and preferably only one --obvious way to do it." (from the famous *[The Zen of Python](https://peps.python.org/pep-0020/)*). My understanding has always been that [[Python]] was a direct reaction/answer to Perl.

Really, the number one thing that I found impossible to understand in Perl was the way of referencing external symbols, the "import" system so to speak. I'm not going to look it up right now (maybe I can expand this garden node later), but there seemed to be many ways of doing this, with some code being in modules and some code being directly transcluded with something akin to a C `#include` statement. Unfortunately, the codebase I was working in used some mix of all available options, which again made it really hard to figure out where a function was coming from.