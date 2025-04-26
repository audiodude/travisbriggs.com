---
title: Ruby (on Rails)
date: 2025-04-25
quality: B
importance: Low
---
Ruby on Rails is probably the first frontend framework I ever used. I think I dabbled in [[Perl]] a bit in a college course, `cgi-bin` style. But even in college, I worked on a project for a digital choral music library, where I created a Ruby on Rails app that had forms (that validated!) and stored data in a SQL database using `ActiveRecord`!

My first job was in [[Java]], but I remained very curious about Rails and even just regular Ruby itself. At one point I even coded an "open source" abstract strategy game called [Tanbo](https://github.com/audiodude/Ruby-Tanbo), with a full GUI implemented with [WxWidgets](https://wxwidgets.org/). It even had a CPU that you could play against which used (checks notes) something called a UCT method ([Upper Confidence bounds applied to Trees](https://en.wikipedia.org/wiki/Monte_Carlo_tree_search)). From reading that Wikipedia article now, it was actually kind of cutting edge at the time.

I like Ruby. I think it's a very concise and expressive language. I also think it's a very powerful language, with it's systems of operator overloading and custom operators and monkey-patching. The problem is, when you have a big enough project, it can be impossible to tell where certain behavior is coming from. A class? A superclass? A monkey patch? Even basic Rails, out-of-the-box, create new Rails app projects can have this problem.

The most recent Ruby on Rails coding I've done is for the ["headless CMS"](https://github.com/audiodude/best-albums-headless) for [[best albums in the universe]]. This is a Rails 7 app solely for me, but I still tried to style it a bit and make the error messages helpful, so that I wouldn't dread using it. I even use Capistrano to both deploy new versions of the admin/headless app itself, and deploy the finished static site.

I haven't really kept up with Ruby on Rails development past that, though I know there's been a lot of churn with regards to webpack/etc and how to best integrate Javascript/Typescript and [Single Page Applications](https://developer.mozilla.org/en-US/docs/Glossary/SPA).