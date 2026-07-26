/* Homepage widgets: random-song player (songs.travisbriggs.com) and latest
   Mastodon toot (@audiodude@sfba.social). Both endpoints are CORS-open.
   Each widget degrades to a static link if its fetch fails. */
(function () {
  /* ---------- Random song player ---------- */
  var playerBox = document.getElementById("random-song");
  if (playerBox) {
    fetch("https://songs.travisbriggs.com/songs.json")
      .then(function (r) {
        if (!r.ok) throw new Error("songs.json " + r.status);
        return r.json();
      })
      .then(function (songs) {
        if (!songs.length) throw new Error("no songs");
        var btn = document.getElementById("random-song-btn");
        var now = document.getElementById("random-song-now");
        var audio = document.getElementById("random-song-audio");

        function fmtDuration(ms) {
          var s = Math.round(ms / 1000);
          return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2);
        }

        function pick() {
          var song = songs[Math.floor(Math.random() * songs.length)];
          now.innerHTML =
            '<img src="' +
            song.cover +
            '" alt="" width="44" height="44">' +
            '<span><span class="np-title">' +
            song.title +
            "</span><br>" +
            '<span class="np-meta">' +
            fmtDuration(song.duration) +
            " &middot; " +
            '<a href="' +
            song.url +
            '">song page</a>' +
            "</span></span>";
          now.hidden = false;
          audio.src = song.src;
          audio.hidden = false;
          audio.play().catch(function () {
            /* user can press play manually */
          });
          btn.textContent = "▶ Play another";
        }

        btn.addEventListener("click", pick);
      })
      .catch(function () {
        playerBox.innerHTML =
          '<div class="section-label">A random song of mine</div>' +
          '<a href="https://songs.travisbriggs.com">Listen at songs.travisbriggs.com</a>';
      });
  }

  /* ---------- Latest toot ---------- */
  var tootEl = document.getElementById("latest-toot");
  if (tootEl) {
    fetch(
      "https://sfba.social/api/v1/accounts/111123478093089904/statuses" +
        "?limit=1&exclude_replies=true&exclude_reblogs=true",
    )
      .then(function (r) {
        if (!r.ok) throw new Error("statuses " + r.status);
        return r.json();
      })
      .then(function (statuses) {
        var status = statuses[0];
        if (!status) throw new Error("no statuses");
        var tmp = document.createElement("div");
        tmp.innerHTML = status.content;
        var text = (tmp.textContent || "").trim();
        if (text.length > 160) text = text.slice(0, 160).trimEnd() + "…";

        tootEl.innerHTML = "";
        var quote = document.createTextNode("“" + text + "” ");
        var link = document.createElement("a");
        link.href = status.url;
        link.className = "toot-date";
        link.textContent = new Date(status.created_at).toLocaleDateString(
          "en-US",
          {
            month: "short",
            day: "numeric",
            year: "numeric",
          },
        );
        tootEl.appendChild(quote);
        tootEl.appendChild(link);
      })
      .catch(function () {
        /* Leave the static fallback link in place. */
      });
  }
})();
