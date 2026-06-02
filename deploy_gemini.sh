#! /bin/bash
# Build the Gemini version of the garden and sync it to the Agate content root
# for gem.travisbriggs.com on the Hetzner box.
#
# Agate serves each vhost from /srv/gemini/content/<hostname>/, so the built
# _gemini/ tree is rsynced into the gem.travisbriggs.com content dir and chowned
# to the gemini service user.
#
# Env (with defaults):
#   GEM_HOST  ssh host of the Gemini server   (default: gem.travisbriggs.com)
#   GEM_USER  ssh user                         (default: root)
#   GEM_DEST  remote content dir               (default: /srv/gemini/content/gem.travisbriggs.com)
#   GEM_KEY   ssh identity file                (default: ~/.ssh/id_skynet)
set -e

GEM_HOST="${GEM_HOST:-gem.travisbriggs.com}"
GEM_USER="${GEM_USER:-root}"
GEM_DEST="${GEM_DEST:-/srv/gemini/content/gem.travisbriggs.com}"
GEM_KEY="${GEM_KEY:-$HOME/.ssh/id_skynet}"
SSH="ssh -i ${GEM_KEY} -o StrictHostKeyChecking=accept-new"

rm -rf _gemini
npx @11ty/eleventy --config=.eleventy.gemini.js

# Mirror the built gemtext into the Agate content root (--delete prunes removed pages).
rsync -az --delete -e "${SSH}" _gemini/ "${GEM_USER}@${GEM_HOST}:${GEM_DEST}/"
${SSH} "${GEM_USER}@${GEM_HOST}" "chown -R gemini:gemini '${GEM_DEST}'"

echo "Deployed garden -> ${GEM_USER}@${GEM_HOST}:${GEM_DEST}"
