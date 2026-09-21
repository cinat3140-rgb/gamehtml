const fs = require("fs");

const sites = [
  { dir: "C:/Users/PC/GameLauncher-dist", plat: "PC, Torrent & APK" },
  { dir: "C:/Users/PC/pchtml",          plat: "PC" },
  { dir: "C:/Users/PC/torrenthtml",     plat: "Torrent" },
  { dir: "C:/Users/PC/apkhtml",         plat: "APK" },
];

const BRAND = 'Steam<span class="accent">Uncapped</span>';

for (const s of sites) {
  const f = s.dir + "/index.html";
  let h = fs.readFileSync(f, "utf8");
  const name = s.dir.replace(/.*[\\/]/, "");

  // 1) brand-name span icerigini SteamUncapped yap (label'dan bagimsiz, guvenli regex)
  h = h.replace(/(<span class="brand-name">)[\s\S]*?(<\/span>)/, "$1" + BRAND + "$2");

  // 2) platform badge'i brand-name span'inin hemen arkasina ekle (1 sefer)
  if (!h.includes('class="platform-badge"')) {
    h = h.replace(
      '<span class="brand-name">' + BRAND + "</span>",
      '<span class="brand-name">' + BRAND + '</span><span class="platform-badge">' + s.plat + "</span>"
    );
  }

  // 3) site-switch icindeki gorunen marka isimlerini platform etiketiyle tutarli yap
  h = h.replace(/class="site-link[^"]*"[^>]*>\s*PcHTML\s*</g, m => m.replace("PcHTML", "SteamUncapped PC"));
  h = h.replace(/class="site-link[^"]*"[^>]*>\s*TorrentHTML\s*</g, m => m.replace("TorrentHTML", "SteamUncapped Torrent"));
  h = h.replace(/class="site-link[^"]*"[^>]*>\s*ApkHTML\s*</g, m => m.replace("ApkHTML", "SteamUncapped APK"));
  h = h.replace(/class="site-link[^"]*"[^>]*>\s*PcHTML\s*</g, m => m.replace("PcHTML", "SteamUncapped PC"));
  h = h.replace(/class="site-link[^"]*"[^>]*>\s*TorrentHTML\s*</g, m => m.replace("TorrentHTML", "SteamUncapped Torrent"));

  // 4) footer'daki eski HTML-marka adlarini SteamUncapped yap
  h = h.replace(/(?:(?:Pc|PC|Torrent|Apk)\s*HTML|PcHTML|TorrentHTML|ApkHTML)/g, "SteamUncapped");

  fs.writeFileSync(f, h);
  console.log("OK  " + name);
}
