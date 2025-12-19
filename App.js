// V1: Sadə gərginlik düşümü (yalnız R). Paylaşıla bilən link + nəticə cədvəli + kopyalama.

const SIZES = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240];

function pickNextSize(req) {
  for (const s of SIZES) if (s >= req) return s;
  return SIZES[SIZES.length - 1];
}

// Panosis-ə yaxın nəticə üçün Cu rho ~0.01786 götürürük (sadə modeldə).
function rhoOf(mat) {
  if (mat === "cu") return 0.01786;
  return 0.0282; // Al üçün yaxın qiymət
}

function fmt(n, d=2) {
  return Number.isFinite(n) ? n.toFixed(d) : "—";
}

function getInputs() {
  return {
    phase: Number(document.getElementById("phase").value),
    mat: document.getElementById("mat").value,
    P: Number(document.getElementById("p").value),
    L: Number(document.getElementById("l").value),
    V: Number(document.getElementById("v").value),
    vdPct: Number(document.getElementById("vd").value),
  };
}

function setInputsFromParams() {
  const u = new URL(location.href);
  const g = (k) => u.searchParams.get(k);

  const phase = g("phase");
  const mat = g("mat");
  const p = g("p");
  const l = g("l");
  const v = g("v");
  const vd = g("vd");

  if (phase) document.getElementById("phase").value = phase;
  if (mat) document.getElementById("mat").value = mat;
  if (p) document.getElementById("p").value = p;
  if (l) document.getElementById("l").value = l;
  if (v) document.getElementById("v").value = v;
  if (vd) document.getElementById("vd").value = vd;
}

function updateUrlFromInputs(inp) {
  const u = new URL(location.href);
  u.searchParams.set("phase", String(inp.phase));
  u.searchParams.set("mat", inp.mat);
  u.searchParams.set("p", String(inp.P));
  u.searchParams.set("l", String(inp.L));
  u.searchParams.set("v", String(inp.V));
  u.searchParams.set("vd", String(inp.vdPct));
  history.replaceState({}, "", u.toString());
}

function calc(inp) {
  const { phase, mat, P, L, V, vdPct } = inp;

  if (!(P > 0 && L > 0 && V > 0 && vdPct > 0)) {
    return { ok:false, err:"Dəyərləri düz yaz: hamısı 0-dan böyük olmalıdır." };
  }

  const I = (phase === 3) ? (P / (Math.sqrt(3) * V)) : (P / V);
  const dV = V * (vdPct / 100);

  // 1 faz: k=2 (gediş-gəliş), 3 faz: k=sqrt(3)
  const k = (phase === 3) ? Math.sqrt(3) : 2;

  const rho = rhoOf(mat);
  const S_req = (k * I * rho * L) / dV;
  const S_std = pickNextSize(S_req);

  // geri yoxlama: seçilən standart kəsitdə düşüm %
  const dV_std = (k * I * rho * L) / S_std;
  const vd_std_pct = (dV_std / V) * 100;

  return { ok:true, I, S_req, S_std, vd_std_pct };
}

function render(inp, res) {
  const out = document.getElementById("out");
  const row = document.getElementById("row");

  if (!res.ok) {
    out.textContent = res.err;
    row.innerHTML = `<td colspan="8" style="color:#b00020">${res.err}</td>`;
    return;
  }

  const kabelTxt = (inp.mat === "cu") ? "Mis (Cu)" : "Alüminium (Al)";

  out.innerHTML = `
    <b>Akım (təxmini):</b> ${fmt(res.I, 2)} A<br>
    <b>Hesablanan kəsit:</b> ${fmt(res.S_req, 6)} mm²<br>
    <b>Standart seçilən kəsit:</b> <span style="font-size:18px"><b>${res.S_std} mm²</b></span><br>
    <b>Bu standart kəsitlə düşüm:</b> ${fmt(res.vd_std_pct, 2)} %
    <div class="muted">Sadə modeldir (cosφ=1, yalnız R). Real seçimdə əlavə yoxlamalar şərtdir.</div>
  `;

  row.innerHTML = `
    <td>${inp.phase}</td>
    <td>${kabelTxt}</td>
    <td>${inp.P}</td>
    <td>${inp.L}</td>
    <td>${inp.V}</td>
    <td>${inp.vdPct}</td>
    <td>${fmt(res.S_req, 10)}</td>
    <td><b>${res.S_std}</b></td>
  `;

  // kopyalama üçün mətn saxla
  window.__lastResultText = `Faz: ${inp.phase}
Kabel: ${kabelTxt}
Güc: ${inp.P} W
Məsafə: ${inp.L} m
Gərginlik: ${inp.V} V
Düşüm limiti: ${inp.vdPct} %
Akım: ${fmt(res.I,2)} A
Hesablanan kəsit: ${fmt(res.S_req,6)} mm²
Standart kəsit: ${res.S_std} mm²
Standart kəsitlə düşüm: ${fmt(res.vd_std_pct,2)} %`;
}

function run() {
  const inp = getInputs();
  updateUrlFromInputs(inp);
  const res = calc(inp);
  render(inp, res);
}

document.getElementById("btn").addEventListener("click", run);

document.getElementById("copyBtn").addEventListener("click", async () => {
  const txt = window.__lastResultText;
  if (!txt) return alert("Əvvəlcə hesabla.");
  try {
    await navigator.clipboard.writeText(txt);
    alert("Kopyalandı.");
  } catch {
    alert("Brauzer icazə vermədi. Nəticəni əl ilə seçib kopyala.");
  }
});

// səhifə açılan kimi URL-dən doldur, sonra hesabla
setInputsFromParams();
run();
