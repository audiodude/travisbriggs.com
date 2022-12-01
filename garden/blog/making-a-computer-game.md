---
title: Making a computer game
tags: blog
date: 2020-07-20
quality: GA
---

I've always wanted to program a computer game. I can program pretty well, so it can't be all that hard right? I know that many people pursue gamedev the way I pursue music production: in fits and starts, as a hobby, never particularly successfully. Since I already have a pursuit like that, why would I want to add gamedev to the list? Am I a masochist?

I've actually used pygame successfully on a few occasions. One of them was just learning game dev, I made a game where you caught a dot with a paddle. I called it Butterfly Catcher and it's [still available on Github](https://github.com/audiodude/Butterfly-Catcher). The other "game" I made with pygame was actually a game loop for a full sized skee-ball like drinking game called Whiskeyball.

For a long time, I had the idea of an "API-only" game. I registered the domain scriptslash.com and had the bare bones of registration and a bit of a tutorial up there. The idea is that the game engine is just implemented as a bunch of API endpoints, and you make HTTP requests to interact with it. So you end up having a script that does the hacking and slashing.

In fact, now that I think of it, this idea is over 10 years old! The main impetus for it was the thought that if you're writing scripts that interact with REST APIs to play a game, it will look to anyone who walks behind your desk at your programming job like you are working (and not playing a game).

As part of this, I actually implemented the so called "2 legged" OAuth scenario, which is not widely used, but basically lets you sign an individual API request with your API key, so that you don't have to have any login mechanism, or cookies or persistent state. I thought it was pretty clever. I even released a Ruby "API client" which just basically imported the right libraries and signed the request, so you could focus on what parameters you wanted to send.

The problem with Scriptslash was that there was never really a "game" there. I had all the ideas for the technical infrastructure, but no ideas for what the gameplay would be like. I even re-wrote the engine, which was originally in Node.js, in Python Flask, porting my two-legged OAuth implementation. Does this sound familiar? How many people have you heard of that develop intricate game engines but there's never really a game there?

Later, I had an idea for a multiplayer game I was calling "Space Base Race Game". You can read [the document I wrote](https://docs.google.com/document/d/1W5CmYhIo87c7GrLOa_6osw8g9Dze5ZZnvHfdCNP8kZo/edit?usp=sharing) about it if you're interested. It was kind of hopelessly complex for what it was trying to do, and I never really had a firm grasp on what the "graphics" if any would look like. The basic idea behind the game is the [multi-armed bandit](https://en.wikipedia.org/wiki/Multi-armed_bandit). Given a row of slot machines, do you pull the one that seems to pay a dollar 75% of the time, or do you play a new one in search of a larger reward? I think this exploration of reward spaces can lead to fun gameplay, because the user has to choose between exploiting a known resource or exploring.

Of course, why not pair Space Base Race Game with Scriptslash and have it be the game for that engine?

I'm not sure why I never did that, to be honest. Part of me had soured on the whole Scriptslash idea. I realized that for any game, a player is going to be a real live human being somewhere, and that they're going to want to see the output of the game. Yes they might at first be satisfied to read the output in the logs of their "script". But eventually they're going to want to see output in real time, and provide input in real time. This is starting to sound like a real Game Client that needs to be developed, possibly with graphics. And I didn't want to do that.

Most recently, I had the idea for "[Factorio](https://factorio.com/) but as a [MUD](https://en.wikipedia.org/wiki/MUD)", which sounds as brilliant as it sounds horrifying to me (and of course is in the grand tradition of "Twitter for dogs" type startup ideas). I've got 200 hours plus played in Factorio, which is by far the most time I've put into a game in probably the past decade.

The idea hasn't really gone anywhere, though. I downloaded the [Evennia MUD engine](https://github.com/evennia/evennia) which is both written in Python and claims to be widely extensible. But I already sort of gave up, after getting the MUD running, because I realized how much work it would be to rip out all of the existing MUD systems (ie "examine cup") and replace them with Factorio like things. Or maybe I just didn't have the idea fully formed in my head enough. Maybe I should write another Google doc.

At some point in this journey I picked up the excellent [Mazes for Programmers](https://pragprog.com/titles/jbmaze/) which was a lot of fun to work through. This originally gave me ideas for Scriptslash, while that was still a thing. The examples in that book have stayed with me, and they're part of the lingering "background radiation" around actually making a video game. But the question is, will I ever do it? And if not, the larger question is, what's stopping me?

I've also played more than my fair share of "clicker" and "idle" games, more than anyone should probably ever play. So I've got ideas down that road too. I had an idea for a game called "Super Progress Bar Pro", which is basically exactly what it says on the tin.

So my ideal game that I'd like to make is Factorio, but a MUD, but a clicker, but API driven.

Maybe I just need to answer some basic questions and go from there:

- Single player or multiplayer?
- Graphics or text based?
- Story based or mechanics-driven?
- Clicker/idle mechanics or actual gameplay?
