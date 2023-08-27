#! /bin/bash
# This script requires ENV variables of GEM_HOST and GEM_USER, which should be
# set to the user@host that serves the Gemini version of the site. Your shell
# should have an /.ssh/config setup so that scp/ssh to that host can procede
# without password prompt.
#
# By default, the remote host is expected to be serving the Gemini site from the
# garden_gemini/ directory in the home directory of the GEM_USER.
set -e

rm -rf _gemini
npx @11ty/eleventy --config=.eleventy.gemini.js
tar -czf garden.tgz _gemini/
scp garden.tgz "$GEM_USER@$GEM_HOST:"
ssh "$GEM_USER@$GEM_HOST" 'tar -xzf garden.tgz && rm -rf garden_gemini && mv _gemini garden_gemini && rm garden.tgz'
