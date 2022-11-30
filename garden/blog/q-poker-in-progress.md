---
title: 'Q Poker: in progress'
tags: blog
date: 2020-08-02
---

When I wrote [blog/making-a-computer-game|that post]] about making a computer game, I seem to have left out one of the major projects I've been working on for the past year or so, which is Q Poker.

Q Poker is envisioned as an online poker site, with play money (coins), that hosts games other than Texas Hold'em. The first game I've been implementing is [Razz](<https://en.wikipedia.org/wiki/Razz_(poker)>) (7 card stud lowball) and you can see some of the in progress results in this screenshot:

![Screenshot of online poker game](https://i.imgur.com/DYO6M0ol.png)

So far, the things I've got working are:

- Backend game logic, in Python, where you can start and finish Hands (of Razz).
  -- Includes check/bet/raise/fold logic for all players.
- Logic in Python for a "Table" which is where the hands get played out.
- Asynchronous logic in Python for sending game updates to the client, when things of interest happen. For example, the web client doesn't have to "poll" the game state, it receives `socketio` events when someone performs an action.
- ReactJS frontend app which responds to and displays the Table state changes from the backend.
- Frontend allows users to take actions, communicates with backend.

Things I still need to work on include:

- Proper registration system with emailing, password reset, etc.
- Proper accounting of User bankrolls, aka debits when sitting down at a table and credits when standing up. (This kind of scares the crap out of me but at least it's not real money!)
- Timer for player actions.
- Disconnect handling. User sits out N hands, then gets kicked from the table (for what value of N?)
- Ability to create (private?) tables and invite friends to them
- Landing page

With all that in place, I think I could actually maybe go to an open beta and see if anyone wants to play. Actually what I was really thinking was that I could program some kind of bots that players could play against. I've got bots now, but they just make a random action out of the available options which is really frustrating and not a good experience.

I've studied some of the techniques of the [Pluribus poker bot](https://www.pokernews.com/news/2019/07/pluribus-first-ai-to-beat-humans-in-multiplayer-no-limit-34910.htm) that came out this time last year. I even paid for access to the paper they published. Sadly, like many results in science nowadays, it doesn't seem like the results are fully reproducible just from what's in the paper, but maybe I'm just too dumb to understand it (fully possible!).

I've actually got a basic implementation of counterfactual regret minimization (CFR), the algorithm used by Pluribus, implemented for toy game theory examples like [Kuhn Poker](https://en.wikipedia.org/wiki/Kuhn_poker). I'm having a hard time generalizing it to Razz though.

If I could get it working, I think it might be fun for players to start a table with 1 or 2 friends and 1 or 2 bots. The point is that there is literally NOWHERE to play Razz online (and in general nowhere to play it live either, even before COVID), so there must be at least some pent up demand for something like this.

If things go well with Razz, I'd like to implement other "mixed" games, like Omaha 8, Pineapple/Crazy Pineapple, Big O, and maybe some of the weirder games we've played in the Reno Atlantis mixed game, like Drawmaha.

This isn't something that I've started and shelved. I'm actively working on it. In fact, I just spent the past week implementing Table/Hand persistence for the backend, so that it can load a table when a user takes an action, then persist the changes to the table.
