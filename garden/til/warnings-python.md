---
title: How to squash warnings in Python by elevating them to errors
tags: til
date: 2022-11-29
---

[[Python]] has a great Exception handling system. It also has a lesser used but still important system of "warnings", which are like Exceptions except they are intended when a "condition (normally) doesn’t warrant raising an exception and terminating the program". They are used probably most familiarly as deprecation warnings, when you're using an import or module or method that has been replaced and shouldn't be used anymore.

For the [[wp-1.0|WP 1.0 project]], I have been increasingly annoyed that one or more of my tests in my test suite are emitting warnings from `pymysql` about MySQL data truncation. Data truncation is when you try to store, say, a 10 character string in a column that can only hold 9 characters. MySQL will generally "lop off" the last character (truncate) and store the remaining nine. When it does this, it issues a warning (depending on how your MySQL/MariaDB server is set up), and pymysql echoes these warnings. Presumably this is helpful if you have a bug, you can go to your logs and see "Well we have 1000 instances of telephone numbers being 'truncated', maybe that's the problem!". It doesn't stop the flow of the program or throw an exception, like stated before, it's just a warning.

Anyways, something in my test was causing one of these truncation warnings. The problem is, the warning just got spit out to the terminal on stderr while all the tests were running, so it was really hard to tell where it was coming from. I had some idea which file it was based on the value that was being truncated, but that was it.

I was vaguely familiar, or at least felt strongly, that there was a way to turn these warnings into proper exceptions, at least temporarily. That way, my program (even my test program) would get interrupted and I would see a stack trace telling me which line of code was being executed when the warning was emitted. Instead of a warning being emitted, in fact, the warning would be raised like a normal exception. Well I wasn't wrong, there's a few ways to do this.

The [warnings module](https://docs.python.org/3/library/warnings.html) talks about the different classifications of warnings and some of the ways to "filter" them. What we're interested in is ["error"](https://docs.python.org/3/using/cmdline.html#cmdoption-W) (turn matching warnings into exceptions). One way of changing the filters is to use a filter string as a command line argument to Python with `python -W error`, for example, which will match all warnings and turn them into errors. This command line argument is [described here](https://docs.python.org/3/using/cmdline.html#cmdoption-W).

Unfortunately, I couldn't pass the python binary the `-W` flag, because I wasn't invoking it directly to run my test scripts. Instead, I was using the `nosetests` wrapper script. So I needed something else.

Luckily, I found [the PYTHONWARNINGS](https://docs.python.org/3/using/cmdline.html#envvar-PYTHONWARNINGS) environment variable. This let me pass the filter string "all the way down" to wherever the python interpreter was being invoked. At first, I tried:

```
PYTHONWARNINGS=error nosetests
```

This was, of course, a disaster, because my program immediately crashed with an exception about some import deprecation in some deep library I didn't even know I was using. So clearly I was going to have to be more specific with my filters. My warning looked like this:

```
/home/tmoney/code/wp1/venv/lib/python3.9/site-packages/pymysql/cursors.py:329:
Warning: (1292, b'Value truncated for `1234` something something...')
```

Eventually, with some trial and error, I landed on the following filter:

```
PYTHONWARNINGS='error:(1292::pymysql.cursors' nosetests
```

This says: filter all warnings that start with `(1292` and are raised from the module `pymysql.cursors` and turn them into errors. The consecutive '::' is in there because I'm using an empty string for the "category" classification. Seems like a somewhat magical incantation, but it worked!

Once my warning was being raised as an exception, I could see the line that was causing it, and I realized the mistake in my SQL syntax that led to it. I fixed it, and no more warning! I'm thinking about repeating this process with other warnings that have been "junking up" my test output, and I probably will.
