---
title: AI Music Making
date: 2026-09-10T00:00:00.000Z
quality: B
importance: Mid
---
## Suno

In the preface of my site [Null Rail](https://null.dangerthirdrail.com), in which I document and show off my usages of [Suno](https://suno.com/) to create songs, I say:

> Can AI make art? Should AI make art? I'm pretty sure the answer to both questions is actually no, but goddamn if that won't stop me from trying.

I've been using Suno a lot since March/April of this year, and it's been fun. I don't have any illusions that I will somehow one shot a song that enters the top 100 and makes me thousands, nay millions of dollars. In fact, I'm explicitly shedding authorship with these creations, as mentioned on the site. But it's fun to see what's out there, what's possible, what the cutting edge is.

## Astra and Ableton

What I did today though, was a whole other thing entirely. I installed the Codex desktop app on my Mac, and after asking it if it could control Ableton and granting a zillion permissions, had this chat:

https://gist.github.com/audiodude/683e4c9fc0ed6f86be6d08c45ad7b98c

Which resulted in this song/loop: https://songs.travisbriggs.com/data-cloud-jazz/ (it named it that).

Some snippets from the transcript:

Me:
> Create a MIDI clip for a piano with a reasonable Jazz chord progression in Ableton

Astra:
> Created an eight-bar looping MIDI clip in scene 1 on Grand Piano, at 100 BPM.
> Cmaj9 → A7♭9 → Dm9 → G13 → Em9 → A7♭9 → Dm9 → G13
> Includes bass notes, syncopated chords, and varied velocities. The clip is selected and ready to launch.

_...minutes later..._

Me:
> make the bass pattern: dotted qtr, eight, quarter, rest

Astra:
> I’ll repeat that rhythm each bar: dotted quarter, eighth, quarter, then a quarter rest, using each bar’s bass note.

Me:
> make the downbeat note have more velocity than the other two

Astra:
> Done—every downbeat is velocity 105, with the other two notes at 75.

_...near the end, after coming up with an arrangement and it suggesting sidechain compression..._

Me:
> I can't hear the pads at all, I think your compressor is misconfigured

Astra:
> Found it: Massive itself was switched off. I re-enabled it, and the pad signal is back. The compressor is showing gentle gain reduction of about 2 dB.

And then came maybe the biggest win, which was a workflow one:

Me:
> Okay save it in my new_sketches_projects directory, then export a wav, and add it to my songs.travisbriggs.com website (repo is at code/starred/songs.travisbriggs.com). You'll find instructions in the repo.

And it did it: https://songs.travisbriggs.com/data-cloud-jazz/
