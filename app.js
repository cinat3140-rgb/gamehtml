(function () {
  "use strict";

  var state = { catalog: null, categoryId: null, error: null };

  var APP_VERSION = "1.0.0";

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function fmtBytes(n) {
    if (!n || n <= 0) return "-";
    var units = ["B", "KB", "MB", "GB", "TB"];
    var i = 0;
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
    return n.toFixed(n >= 100 ? 0 : 1) + " " + units[i];
  }

  function fmtDate(iso) {
    if (!iso) return "-";
    var d = new Date(iso);
    if (isNaN(d)) return "-";
    return d.toLocaleDateString("tr-TR", { year: "numeric", month: "short", day: "numeric" });
  }

  function img(url, cls, alt) {
    if (!url) return '<div class="placeholder">🎮</div>';
    return '<img class="' + (cls || "") + '" src="' + esc(url) + '" alt="' + esc(alt || "") + '" loading="lazy" />';
  }

  /* ---------- Catalog data ---------- */

  function fetchCatalog() {
    return fetch("catalog.json", { headers: { Accept: "application/json" } })
      .then(function (r) {
        if (!r.ok) throw new Error("Katalog alınamadı (HTTP " + r.status + ")");
        return r.json();
      })
      .then(function (data) {
        state.catalog = data;
        fillCategoryFilter(data.categories || []);
        return data;
      });
  }

  function fillCategoryFilter(categories) {
    var sel = $("#catFilter");
    if (!sel) return;
    var opts = '<option value="">Tüm Kategoriler</option>';
    (categories || []).forEach(function (c) { opts += '<option value="' + esc(c.id) + '">' + esc(c.name) + "</option>"; });
    sel.innerHTML = opts;
  }

  function currentCategoryId() {
    return (state.catalog && state.catalog.categories || []).length ? state.categoryId : null;
  }

  function filteredGames() {
    var games = (state.catalog && state.catalog.games) || [];
    if (state.categoryId) games = games.filter(function (g) { return g.categoryId === state.categoryId; });
    return games;
  }

  /* ---------- App update banner ---------- */

  function renderUpdateBanner(latest) {
    var el = $("#updateBanner");
    if (!el) return;
    if (!latest || !latest.version) { el.hidden = true; el.innerHTML = ""; return; }
    var notes = latest.notes ? "<span>" + esc(latest.notes) + "</span>" : "";
    var btn = latest.downloadUrl
      ? '<a class="btn btn-primary btn-sm" href="' + esc(latest.downloadUrl) + '" target="_blank" rel="noopener">Güncelle</a>'
      : '<span class="dim" style="font-size:.82rem">Launcherda yeni sürüm bildirilecek.</span>';
    el.innerHTML =
      '<div class="update-banner-inner">' +
        '<span style="font-size:1.1rem">🆕</span>' +
        '<div class="update-text"><strong>GameHTML v' + esc(latest.version) + " yayınlandı.</strong>" + notes + "</div>" +
        '<div class="update-actions">' + btn + "</div>" +
      "</div>";
    el.hidden = false;
  }

  function fetchAppUpdate() {
    fetch("app-update.json", { headers: { Accept: "application/json" } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (d && d.updateAvailable) renderUpdateBanner(d.latest);
      })
      .catch(function () {});
  }

  /* ---------- Actions ---------- */

  function primaryAction(g) {
    var file = Array.isArray(g.latestFiles) && g.latestFiles.length ? g.latestFiles[0] : null;
    var isExternal = file ? file.source === "external" : !!(g.externalUrl && !g.downloadUrl);
    var url = isExternal
      ? ((file && file.downloadUrl) || g.externalUrl)
      : ((file && file.downloadUrl) || g.downloadUrl);
    return { isExternal: isExternal, url: url || "" };
  }

  function actionButtons(g, sizeClass) {
    var a = primaryAction(g);
    var cls = sizeClass || "";
    var detail = '<a class="btn btn-ghost ' + cls + '" href="#/oyun/' + g.id + '">İncele</a>';
    if (!a.url) return detail;
    if (a.isExternal) {
      return '<a class="btn btn-primary ' + cls + '" href="' + esc(a.url) + '" target="_blank" rel="noopener nofollow">🌐 Sayfada Aç</a>' + detail;
    }
    return '<a class="btn btn-primary ' + cls + '" href="' + esc(a.url) + '" download>⬇ İndir</a>' + detail;
  }

  /* ---------- Rendering ---------- */

  function categoryName(id) {
    var cats = (state.catalog && state.catalog.categories) || [];
    for (var i = 0; i < cats.length; i++) if (cats[i].id === id) return cats[i].name;
    return null;
  }

  function card(g) {
    var cat = categoryName(g.categoryId);
    var file = Array.isArray(g.latestFiles) && g.latestFiles.length ? g.latestFiles[0] : null;
    var meta = [];
    if (cat) meta.push(cat);
    if (g.genre) meta.push(g.genre);
    var size = file ? fmtBytes(file.fileSize) : "-";
    return (
      '<a class="gcard" href="#/oyun/' + g.id + '">' +
        '<div class="gcard-cover">' + img(g.coverUrl, "", g.title) +
          (cat ? '<span class="gcard-cat">' + esc(cat) + "</span>" : "") +
        "</div>" +
        '<div class="gcard-body">' +
          '<div class="gcard-title">' + esc(g.title) + "</div>" +
          '<div class="gcard-meta">' + (meta.join(" • ") || "—") + "</div>" +
          '<div class="gcard-meta">' + size + (g.version ? " • v" + esc(g.version) : "") + (g.updatedAt ? " • " + fmtDate(g.updatedAt) : "") + "</div>" +
          '<div class="gcard-actions">' + actionButtons(g, "btn-sm") + "</div>" +
        "</div>" +
      "</a>"
    );
  }

  function renderCatalog() {
    var grid = $("#catalogGrid");
    var count = $("#catalogCount");
    var games = filteredGames();
    count.textContent = (state.catalog ? state.catalog.games.length : 0) + " oyun listeleniyor";
    if (!games.length) {
      grid.innerHTML = '<div class="empty">Bu kategoride oyun bulunamadı.</div>';
      return;
    }
    grid.innerHTML = games.map(card).join("");
  }

  function renderGame(id) {
    var el = $("#gameDetail");
    var g = state.catalog && state.catalog.games.find(function (x) { return x.id === id; });
    if (!g) {
      el.innerHTML = '<div class="empty">Oyun bulunamadı. <a href="#/katalog" style="color:var(--accent)">Kataloğa dön</a></div>';
      return;
    }
    var a = primaryAction(g);
    var file = Array.isArray(g.latestFiles) && g.latestFiles.length ? g.latestFiles[0] : null;
    var cat = categoryName(g.categoryId);
    var tags = [g.genre, g.version ? "v" + g.version : null, g.platform].filter(Boolean);
    if (cat) tags.unshift(cat);
    var actionHtml = "";
    if (!a.url) {
      actionHtml = '<span class="dim" style="font-size:.9rem;text-align:center">Yakında</span>';
    } else if (a.isExternal) {
      actionHtml = '<a class="btn btn-primary btn-lg" href="' + esc(a.url) + '" target="_blank" rel="noopener nofollow">🌐 Sayfada Aç</a>' +
        '<span class="dim" style="font-size:.82rem;text-align:center">Oyun tarayıcıda açılır; dosyayı oradan indirip uygulamadan kurabilirsin.</span>';
    } else {
      actionHtml = '<a class="btn btn-primary btn-lg" href="' + esc(a.url) + '" download>⬇ İndir</a>' +
        '<span class="dim" style="font-size:.82rem;text-align:center">Dosyayı indir; uygulamada "Oyun Ekle" bölümünden kur.</span>';
    }
    var screens = Array.isArray(g.screenshots) && g.screenshots.length
      ? '<div class="screens"><div class="screens-title">Ekran Görüntüleri</div><div class="screens-grid">' +
        g.screenshots.map(function (s) { return img(s, "", g.title); }).join("") + "</div></div>"
      : "";

    el.innerHTML =
      '<div class="detail-banner">' + img(g.bannerUrl || g.coverUrl, "banner", g.title) +
        '<div class="detail-head">' +
          img(g.coverUrl, "detail-cover", g.title) +
          '<div class="detail-titleblock">' +
            '<h1>' + esc(g.title) + "</h1>" +
            '<div class="detail-tags">' + tags.map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") + "</div>" +
          "</div>" +
        "</div>" +
      "</div>" +
      '<div class="detail-body">' +
        "<div>" +
          '<p class="detail-desc">' + esc(g.description || "Açıklama eklenmemiş.") + "</p>" +
          screens +
        "</div>" +
        '<aside class="detail-panel">' +
          '<div class="detail-actions">' + actionHtml + "</div>" +
          '<div style="margin-top:18px">' +
            '<div class="info-row"><span class="k">Dosya</span><span class="v">' + esc((file && file.fileName) || "-") + "</span></div>" +
            '<div class="info-row"><span class="k">Boyut</span><span class="v">' + fmtBytes(file && file.fileSize) + "</span></div>" +
            '<div class="info-row"><span class="k">Kaynak</span><span class="v">' + esc(a.isExternal ? "Harici link" : "Sunucu") + "</span></div>" +
            '<div class="info-row"><span class="k">Kategori</span><span class="v">' + esc(cat || "—") + "</span></div>" +
            '<div class="info-row"><span class="k">Güncelleme</span><span class="v">' + fmtDate(g.updatedAt) + "</span></div>" +
          "</div>" +
          (g.requirements
            ? '<div class="require"><h4>Sistem Gereksinimleri</h4><p>' + esc(g.requirements) + "</p></div>"
            : "") +
        "</aside>" +
      "</div>";
  }

  /* ---------- Router ---------- */

  function parseHash() {
    var h = location.hash.replace(/^#\/?/, "");
    if (!h) return { view: "home" };
    var parts = h.split("/");
    if (parts[0] === "oyun") return { view: "game", id: Number(parts[1]) };
    return { view: parts[0] };
  }

  var VIEWS = ["home", "katalog", "game", "indir", "kurulum", "sss"];

  function route() {
    var r = parseHash();
    if (VIEWS.indexOf(r.view) === -1) { location.hash = "#/"; return; }
    var activeView = r.view === "game" ? "katalog" : r.view;
    $$("[data-view]").forEach(function (el) {
      el.hidden = el.getAttribute("data-view") !== activeView;
    });
    if (r.view === "katalog" || r.view === "game") {
      if (state.catalog) {
        render(r);
      } else if (!state.loading) {
        state.loading = true;
        fetchCatalog()
          .then(function () { render(r); })
          .catch(function (err) {
            state.error = err.message;
            $("#catalogGrid").innerHTML = '<div class="empty">Katalog yüklenemedi: ' + esc(err.message) + '.<br/>Sunucunun çalıştığından emin ol.</div>';
            $("#catalogCount").textContent = "";
          })
          .finally(function () { state.loading = false; });
      }
    } else {
      window.scrollTo(0, 0);
    }
  }

  function render(r) {
    if (r.view === "game") renderGame(r.id);
    else renderCatalog();
    window.scrollTo(0, 0);
  }

  /* ---------- Download sizes (HEAD) ---------- */

  var SIZE_IDS = { "downloads/GameHTML-1.0.0-installers.zip": "zipSize,zipCardSize", "downloads/GameHTML_1.0.0_x64-setup.exe": "exeSize", "downloads/GameHTML_1.0.0_x64_en-US.msi": "msiSize", "downloads/GameHTML-portable.exe": "portableSize" };

  function fetchSizes() {
    Object.keys(SIZE_IDS).forEach(function (url) {
      fetch(url, { method: "HEAD" }).then(function (r) {
        var len = r.headers.get("content-length");
        if (!len) return;
        var txt = fmtBytes(Number(len));
        SIZE_IDS[url].split(",").forEach(function (id) {
          var el = document.getElementById(id);
          if (el) el.textContent = txt;
        });
      }).catch(function () {});
    });
  }

  /* ---------- Public ---------- */

  window.app = {
    applyFilter: function (v) {
      state.categoryId = v ? Number(v) : null;
      renderCatalog();
    }
  };

  window.addEventListener("hashchange", route);
  document.addEventListener("DOMContentLoaded", function () {
    fetchSizes();
    fetchAppUpdate();
    route();
  });
  if (document.readyState !== "loading") route();

  /* Simple lightbox for screenshots */
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (t && t.tagName === "IMG" && t.classList.contains("screens-grid") === false) return;
    if (t && t.parentElement && t.parentElement.classList.contains("screens-grid")) {
      var src = t.src;
      var ov = document.createElement("div");
      ov.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;z-index:100;cursor:zoom-out;";
      var im = new Image();
      im.style.cssText = "max-width:90vw;max-height:90vh;border-radius:10px;";
      im.src = src;
      ov.appendChild(im);
      ov.addEventListener("click", function () { ov.remove(); });
      document.body.appendChild(ov);
    }
  });
})();
