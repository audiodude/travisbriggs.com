# Gemini Capsule Migration: DigitalOcean → Hetzner

**Date:** 2026-06-01
**Goal:** Cut the ~$14/mo DigitalOcean droplet bill by ~2/3 by moving the Gemini
capsule(s) to the smallest viable Hetzner instance, then decommissioning the
droplet.

## Background / current state

The DO droplet `best-albums` (1 vCPU / 2 GB / 50 GB, ~$14/mo, `164.92.127.60`)
was originally the best-albums web app box. That app has since moved to
Cloudflare Pages, leaving the droplet doing only two real jobs:

1. **Gemini capsules** — the `twins` daemon on `:1965`, SNI virtual hosts with
   Let's Encrypt certs (`~tmoney/certs/live/<host>/`), renewed by a certbot
   **HTTP-01 webroot** cron + `pkill -HUP twins`:
   - `gem.bestalbumsintheuniverse.com` → `/var/gem/best-albums/` (392 KB static)
   - `gem.travisbriggs.com` → `~tmoney/garden_gemini/foo` (**broken — `foo`
     does not exist**; effectively serves nothing today)
   - `gem.garden.travisbriggs.com` → `~tmoney/garden_gemini/` (1.2 MB, the real
     garden; legacy alias)
2. **`boxofmonocles.com` vanity redirect** — nginx 302 → `https://travisbriggs.com/`
   (root only; sub-paths 404). Zone is on Cloudflare (`7b217b368e...`).

Stale/harmless: a certbot cron still tries to renew `bestalbumsintheuniverse.com`
via webroot — already failing since that domain moved to CF Pages.

DNS for all `gem.*` hosts is Cloudflare **grey-cloud** (DNS-only) — required,
since Gemini is raw TLS on 1965 and cannot pass through Cloudflare's HTTP proxy.

## Decisions (locked with user)

- **Certs:** Let's Encrypt (not self-signed/TOFU).
- **Hostnames:** only the two — `gem.bestalbumsintheuniverse.com` and
  `gem.travisbriggs.com`. Drop `gem.garden.travisbriggs.com`. `gem.travisbriggs.com`
  serves the **full garden** (fixing the broken `/foo`).
- **Hetzner project:** `0bt-setup` (active hcloud context). Billing approved.

## Target design

- **Box:** Hetzner **CAX11** (ARM, 2 vCPU / 4 GB / 40 GB), location **ash**
  (Ashburn, VA — closest US DC to current droplet, low latency for US audience).
  ~€3.79/mo + ~€0.50 IPv4 ≈ **$4.60/mo (~67% cut)**. Image `ubuntu-24.04`.
  SSH key `tmoney@tmoney-linux` (local `~/.ssh/id_skynet`).
- **Gemini server:** **Agate** v3.3.22 (`aarch64-unknown-linux-gnu`), single
  static Rust binary, run under systemd as a dedicated `gemini` user.
  - Content dir `/srv/gemini/content/<hostname>/`
  - Certs dir `/srv/gemini/certs/<hostname>/{cert.pem,key.pem}` (symlinked to the
    LE live dir; Agate reloads on restart via certbot deploy-hook).
- **Certs:** certbot + **`dns-cloudflare`** plugin (DNS-01). Works on grey-cloud
  records (DNS-01 only creates `_acme-challenge` TXT records — proxy status is
  irrelevant). A **scoped** CF API token (Zone:DNS:Edit + Zone:Read for the two
  zones only) lives on the box — not the global token. Auto-renew via the
  certbot systemd timer, `--deploy-hook` reissues cert symlinks + restarts Agate.
- **Content:**
  - best-albums: `rsync` `/var/gem/best-albums/` → new box (one-time + on demand).
  - garden: existing `deploy_gemini.sh` repointed (`GEM_HOST`, `GEM_USER`, target
    path) to push the eleventy `_gemini/` build to the new box.

## Cutover plan

1. Provision + fully configure the new box; Agate serving both hosts on 1965.
2. **Verify** by connecting to the new box's IP with SNI for each hostname
   (TLS cert CN + gemtext body) — before any DNS change.
3. Lower TTL on the two `gem.*` records; repoint grey-cloud A/AAAA → new IP.
4. Verify both capsules publicly on 1965.
5. **Migrate `boxofmonocles.com` redirect to Cloudflare:** flip `boxofmonocles.com`
   + `www` to a proxied placeholder (`192.0.2.1` / `100::`, orange-cloud) and add a
   Single Redirect rule → `https://travisbriggs.com/` (302). Removes the last
   droplet dependency and improves sub-path behavior (redirect vs 404).
6. **(User, manual)** Destroy the DO droplet in the DO dashboard — the bill does
   not drop until this is done. No DO API token available to Claude.

## Non-goals / notes

- No serverless option exists: Gemini needs a persistent TLS listener on 1965.
- The DO droplet is left **fully untouched** until the user confirms the new box
  serves both capsules.
- `boxofmonocles.com` is already a 302 (no cached-301 concern).
