const fs = require("fs");
const d = [
  { p: "C:/Users/PC/GameLauncher-dist", n: "ANA" },
  { p: "C:/Users/PC/pchtml", n: "PC" },
  { p: "C:/Users/PC/torrenthtml", n: "TORRENT" },
  { p: "C:/Users/PC/apkhtml", n: "APK" },
];
let err = 0;
for (const s of d) {
  const h = fs.readFileSync(s.p + "/index.html", "utf8");
  const bb = (h.match(/<span class="brand-name">[\s\S]*?<\/span>/) || [""])[0]
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const badge = (h.match(/<span class="platform-badge">([\s\S]*?)<\/span>/) || [""])[1] || "-";
  const sw = (h.match(/<div class="site-switch">[\s\S]*?<\/div>\s*<\/div>/) || [""])[0]
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const fo = (h.match(/<footer>[\s\S]*?<\/footer>/) || [""])[0]
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 90);
  const ti = (h.match(/<title>([\s\S]*?)<\/title>/) || [null, "-"])[1];
  const css = (h.match(/style\.css\?v=(\d{8})/) || [null, "?"])[1];
  const cssFile = fs.readFileSync(s.p + "/style.css", "utf8");
  const hasBadgeCss = cssFile.includes(".platform-badge");
  const hasGameVault = bb === "Oynuo" || /Oyu\s*no/i.test(bb + " " + ti);
  const hasLaunchCSS = fs.existsSync(s.p + "/style.css");
  const cardMeta = (h.match(/card-meta-top/) || [""])[0];
  const isMain = s.n === "ANA";
  const ok = hasGameVault;
  if (!ok) err++;
  console.log(
    "[" + s.n.padEnd(8) + "] brand='" + bb + "' badge=" + badge +
    " | badgeCSS=" + (hasBadgeCss ? "OK" : "YOK") +
    " | cache-v=" + css +
    (isMain ? " | card-meta=" + (cardMeta ? "OK" : "YOK") : "") +
    (ok ? "" : "  <= SORUN")
  );
  console.log("   switch: " + sw.slice(0, 150));
  console.log("   footer: " + fo);
}
console.log("");
console.log(err === 0 ? "HEPSI OYNUO - TAMAM" : "HATA SAYISI: " + err);
