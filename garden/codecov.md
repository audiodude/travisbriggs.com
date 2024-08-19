---
title: Codecov
date: 2024-07-06
updated: 2024-08-19
quality: A
importance: Low
---

In software development, there is the concept of "code coverage". When your automated tests run, a coverage tool **instruments** the code, wrapping it with instructions that determine, for each line of your source code, whether the line was executed during the test or not. [Many](https://atlassian.com/continuous-delivery/software-testing/code-coverage) [have](https://testing.googleblog.com/2020/08/code-coverage-best-practices.html) [written](https://capgemini.github.io/testing/What-Is-Code-Coverage-and-Why-It-Should-Not-Lead-Development/) about the pros and cons of low and high code coverage. It turns out it's one of those areas where a "middle ground" is critically important.

There are hundreds of tools across every programming language that detect and report code coverage. [Codecov](https://codecov.com/) is not one of them. Instead, it provides a GUI (Graphical User Interface) for inspecting, analyzing, and reporting on code coverage reports. Once your tests run, you upload the coverage report to Codecov, and their automated system provides a web app where you can visually see where you are covered or lacking coverage as you explore your source code tree.

Even more useful for most projects, the process of uploading and inspecting code coverage reports can itself be completely automated using [GitHub Actions](https://docs.github.com/en/actions). What this means is that before you merge a PR (Pull Request), Codecov can say the equivalent of "Hey, don't merge this, you didn't test the new code you added!". Implementing and responding to this feedback is part of good ["code hygeine"](https://medium.com/@revanrgh/clean-code-should-we-prioritize-hygiene-in-coding-cff197542b11).

This year, Codecov released v4 of it's GitHub integration. I believe the purpose was to unify its CLI (Command Line Interface) tool and the GitHub code, so they weren't running different codebases. The most severe change was that it was no longer possible for Codecov to use the "environment" of the GitHub repo to determine the proper project or credentials: you now had to explicitly set a _token_ for it to work. For thousands of developers, their automated pipelines stopped working, and it was often difficult to tell what was wrong and how to fix it. Well, it wasn't particularly difficult per se, but required a lot of annoying steps and hard to find documentation.

All of this is to just document for future posterity the head-bang-on-desk moment I had when trying to upgrade to v4 in my own [[wp-1.0|WP1]] repo today. The Codecov automation kept reporting that I was missing the token. I, on the other hand, was thouroughly convinced that I had the token, but Codecov just wouldn't agree with me. I had read the [documentation](https://docs.codecov.com/docs/adding-the-codecov-token) over and over, and double checked that I had done all of the steps but it still wasn't working.

The problem was that I assumed the hard part was the first part, adding the `CODECOV_TOKEN` to the GitHub repo settings. I was convinced that that's where the problem was. In actuality, what I had missed was that the syntax for calling v4 was slightly, but every so similarly lookingly (?), different from v3.

<img src="https://pxscdn.com/public/m/_v2/588554065884192073/3781ba7d4-1bb9dc/8GbMvEfDtTR5/nXvjO8y0yPXBrI3XCEyQqs6cGn2chUypPiUX26T5.png" alt="Code review showing GitHub actions code with one line changed" style="max-width: 50rem"/>

I kept seeing the line where you set `env:` but reading it as "I already have `secrets.CODECOV_TOKEN` in there!". Facepalm.

In all honesty though, the entire Codecov v3 to v4 upgrade has kind of been a nightmare, across multiple months and multiple repos. Thank god I'm not paying them any money!

Update: I'm still getting these freaking errors! Every now and then my CI will flake out like this:

<img src="https://pixelfed.social/storage/m/_v2/588554065884192073/0e43b1202-69768b/D9HJx5Y4yN0l/1y9kQRG1WPT2fQ4TPczdXPECDMHOKAuMgXN3IZ4S.png" alt="Github actions with Codecov Error: Codecov token not found. Please provide Codecov token with -t flag." style="max-width: 50rem"/>
