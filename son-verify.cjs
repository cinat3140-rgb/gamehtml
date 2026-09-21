const fs = require("fs");
const path = require("path");
const sites = [
  { p: "C:/Users/PC/GameLauncher-dist", n: "ANA" },
  { p: "C:/Users/PC/pchtml", n: "PC" },
  { p: "C:/Users/PC/torrenthtml", n: "TORRENT" },
  { p: "C:/Users/PC/apkhtml", n: "APK" },
];
let ok = 0, err = 0;
for (const s of sites) {
  const h = fs.readFileSync(s.p + "/index.html", "utf8");
  const brand = h.match(/<span class="brand-name">Game<span class="accent">Vault<\/span><\/span>/);
  const title = (h.match(/<title>(.*?)<\/title>/) || [null, "?"])[1];
  const badge = h.match(/<span class="platform-badge">(.*?)<\/span>/);
  const footer = h.match(/<footer>([\s\S]*?)<\/footer>/);
  const fClean = footer
    ? footer[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 80)
    : "-";
  const old = /SteamUncapped|PcHTML|TorrentHTML|ApkHTML|Pc HTML|Torrent HTML|Apk HTML/i.test(h);
  const cssV = (h.match(/style\.css\?v=(\d{8})/) || [null, "?"])[1];
  const hasVault = (fs.readFileSync(s.p + "/style.css", "utf8") || "").includes("platform-badge");
  const good = brand && !old && hasVault;
  ok += good ? 1 : 0; err += good ? 0 : 1;
  console.log(
    "[" + s.n.padEnd(7) + "] " +
    (good ? "OK " : "HATA ") +
    (brand ? "brand=GameVault " : "BRAND=YOK! ") +
    "badge=" + (badge ? badge[1] : "-") + " " +
    "cssV=" + cssV + " badgeCSS=" + (hasVault ? "var" : "yok") + " " +
    "eskiRef=" + (old ? "VAR!" : "temiz") + "\n" +
    "        title=' " + title + "' | footer='" + fClean + "'"
  );
}
console.log(ok === 4 ? "\nTAMAM: 4 site GameVault + badge + temiz" : "\nSORUN: ok=" + ok + " err=" + err);
