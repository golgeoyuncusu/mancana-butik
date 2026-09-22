"use client";

import { useEffect, useRef } from "react";
import { UserButton, RedirectToSignIn, useAuth } from "@clerk/nextjs";

const APP_HTML = `
<div class="app">
  <div class="top-loader" id="topLoader"></div>
  <header class="topbar">
    <div class="brand-text">
      <strong>Mancana Butik</strong>
      <span>Satış ve Stok Takibi</span>
    </div>
  </header>

  <main class="content">
    <div class="card" id="dbBanner" hidden><p class="empty-note" style="color:var(--rust)">Veri alınamadı, bağlantınızı kontrol edin.</p></div>

    <section class="view" id="view-dashboard">
      <div class="card"><div class="stat-row" id="dashStats"></div></div>
      <div class="card">
        <div class="card-head"><h2>Son Satışlar</h2></div>
        <div id="dashRecentSales"></div>
      </div>
    </section>

    <section class="view" id="view-products" hidden>
      <div class="card">
        <div class="card-head"><h2>Ürünler</h2><button type="button" class="btn small" id="productAddBtn">+ Ürün</button></div>
        <div class="form-panel" id="productForm" hidden>
          <div class="field-row">
            <div class="field"><label>Ürün adı</label><input type="text" id="f-p-name" placeholder="Ör. Keten Elbise"></div>
            <div class="field"><label>Kategori</label><input type="text" id="f-p-category" list="productCategoryList" placeholder="Ör. Elbise"></div>
          </div>
          <datalist id="productCategoryList">
            <option value="Elbise"></option><option value="Üst Giyim"></option><option value="Alt Giyim"></option>
            <option value="Aksesuar"></option><option value="Ayakkabı"></option><option value="Diğer"></option>
          </datalist>
          <div class="field-row">
            <div class="field"><label>Fiyat (₺)</label><input type="number" id="f-p-price" placeholder="0"></div>
            <div class="field"><label>Stok miktarı</label><input type="number" id="f-p-stock" placeholder="0"></div>
          </div>
          <div class="field"><label>SKU / stok kodu (opsiyonel)</label><input type="text" id="f-p-sku"></div>
          <div class="field"><label>Açıklama (opsiyonel)</label><textarea id="f-p-desc" rows="2"></textarea></div>
          <div class="field">
            <label>Ürün fotoğrafı (opsiyonel)</label>
            <div class="img-picker">
              <img id="f-p-image-preview" class="img-picker-preview" alt="" hidden>
              <button type="button" class="btn ghost small" id="f-p-image-pick-btn">Fotoğraf Seç</button>
              <button type="button" class="btn ghost small danger" id="f-p-image-clear-btn" hidden>Kaldır</button>
              <span class="img-picker-status" id="f-p-image-status"></span>
            </div>
            <input type="file" id="f-p-image-file" accept="image/*" hidden>
            <input type="hidden" id="f-p-image">
          </div>
          <details class="ty-fields">
            <summary>Trendyol bilgileri (yüklemek için gerekli, opsiyonel)</summary>
            <div class="field-row">
              <div class="field"><label>Barkod</label><input type="text" id="f-p-ty-barcode"></div>
              <div class="field"><label>Kategori ID</label><input type="number" id="f-p-ty-category"></div>
            </div>
            <div class="field"><label>Marka ID</label><input type="number" id="f-p-ty-brand"></div>
          </details>
          <div class="form-actions">
            <button type="button" class="btn" id="productSaveBtn">Kaydet</button>
            <button type="button" class="btn ghost" id="productCancelBtn">Vazgeç</button>
          </div>
        </div>
        <div id="productsList"></div>
      </div>
    </section>

    <section class="view" id="view-sales" hidden>
      <div class="card">
        <div class="card-head"><h2>Satışlar</h2><button type="button" class="btn small" id="saleAddBtn">+ Satış</button></div>
        <div class="form-panel" id="saleForm" hidden>
          <div class="field"><label>Ürün</label>
            <select id="f-s-product"><option value="">— Serbest ürün (listede yok) —</option></select>
          </div>
          <div class="field" id="f-s-freename-wrap"><label>Ürün adı</label><input type="text" id="f-s-freename"></div>
          <div class="field-row">
            <div class="field"><label>Miktar</label><input type="number" id="f-s-quantity" value="1"></div>
            <div class="field"><label>Birim fiyat (₺)</label><input type="number" id="f-s-price"></div>
          </div>
          <div class="field-row">
            <div class="field"><label>Ödeme yöntemi</label>
              <select id="f-s-payment"><option>Nakit</option><option>Kredi Kartı</option><option>Havale/EFT</option><option>Diğer</option></select>
            </div>
            <div class="field"><label>Tarih</label><input type="date" id="f-s-date"></div>
          </div>
          <div class="field"><label>Not (opsiyonel)</label><input type="text" id="f-s-note"></div>
          <div class="form-actions">
            <button type="button" class="btn" id="saleSaveBtn">Satışı Kaydet</button>
            <button type="button" class="btn ghost" id="saleCancelBtn">Vazgeç</button>
          </div>
        </div>
        <div id="salesList"></div>
      </div>
    </section>

    <section class="view" id="view-settings" hidden>
      <div class="card">
        <div class="card-head"><h2>Trendyol Bağlantısı</h2></div>
        <p class="hint">Ürünleri Trendyol'a yükleyebilmek için satıcı panelinizden aldığınız API bilgilerini girin. Bu entegrasyon
          henüz gerçek bir Trendyol hesabına karşı test edilmedi — ilk denemede bir hata alırsanız bana bildirin, birlikte düzeltiriz.</p>
        <div class="field"><label>Supplier ID</label><input type="text" id="f-ty-supplier"></div>
        <div class="field"><label>API Key</label><input type="password" id="f-ty-key" placeholder="Değiştirmek için doldurun"></div>
        <div class="field"><label>API Secret</label><input type="password" id="f-ty-secret" placeholder="Değiştirmek için doldurun"></div>
        <button type="button" class="btn" id="tySaveBtn">Kaydet</button>
        <p class="hint" id="tyStatus"></p>
      </div>
      <div class="card">
        <div class="card-head"><h2>Hesabım</h2></div>
        <p class="li-sub" id="meLabel"></p>
      </div>
    </section>
  </main>

  <nav class="bottom-nav" id="bottomNav" aria-label="Alt gezinme">
    <button type="button" data-view="dashboard" class="active" aria-current="page">
      <span class="bn-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/><path d="M10 20v-5.5h4V20"/></svg></span>
      <span class="bn-label">Panel</span>
    </button>
    <button type="button" data-view="products">
      <span class="bn-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 6h16l-1.5 9h-13z"/><path d="M8.5 6 7 3H4"/><circle cx="10" cy="19" r="1.4"/><circle cx="16.5" cy="19" r="1.4"/></svg></span>
      <span class="bn-label">Ürünler</span>
    </button>
    <button type="button" data-view="sales">
      <span class="bn-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><path d="M7 14h4"/></svg></span>
      <span class="bn-label">Satışlar</span>
    </button>
    <button type="button" data-view="settings">
      <span class="bn-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z"/></svg></span>
      <span class="bn-label">Ayarlar</span>
    </button>
  </nav>

  <div class="toast" id="toast"></div>
</div>
`;

export default function Home() {
  const { isLoaded, isSignedIn } = useAuth();
  const initedRef = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    if (initedRef.current) return;
    initedRef.current = true;
    const cleanup = mountApp();
    return cleanup;
  }, [isLoaded, isSignedIn]);

  if (!isLoaded) return <div className="auth-shell"><div className="auth-loader" /></div>;
  if (!isSignedIn) return <RedirectToSignIn />;

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: APP_HTML }} />
      <div id="userButtonPortal" style={{ display: "none" }}>
        <UserButton />
      </div>
    </>
  );
}

function mountApp() {
  const cleanups: (() => void)[] = [];
  function on(id: string, evt: string, fn: EventListenerOrEventListenerObject) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener(evt, fn);
    cleanups.push(() => el.removeEventListener(evt, fn));
  }
  function escapeHtml(s: unknown) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]!));
  }
  function money(v: unknown) {
    const n = Number(v);
    if (!Number.isFinite(n)) return "—";
    return n.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₺";
  }
  function todayIso() { return new Date().toLocaleDateString("sv"); }
  function fmtDateShort(iso: string) {
    const d = new Date(iso + "T00:00:00");
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
  }
  let toastTimer: ReturnType<typeof setTimeout> | null = null;
  function showToast(msg: string) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }
  async function api<T>(url: string, opts?: RequestInit): Promise<T> {
    const res = await fetch(url, { ...opts, headers: { "Content-Type": "application/json", ...(opts?.headers || {}) } });
    if (!res.ok) throw new Error("İstek başarısız (" + res.status + ")");
    return res.json();
  }

  // -------- types & state --------
  type Product = {
    id: number; name: string; category: string; sku: string; price: number; stockQuantity: number;
    description: string; imageUrl: string; trendyolBarcode: string; trendyolCategoryId: number | null;
    trendyolBrandId: number | null; trendyolSyncedAt: string; trendyolSyncError: string;
  };
  type Sale = { id: number; productId: number | null; productName: string; quantity: number; unitPrice: number; total: number; paymentMethod: string; note: string; soldAt: string; createdAt: string };
  type Me = { id: string; name: string; email: string | null; role: "owner" | "staff" };

  function normProduct(r: Record<string, unknown>): Product {
    return {
      id: r.id as number, name: r.name as string, category: (r.category as string) || "Diğer", sku: (r.sku as string) || "",
      price: Number(r.price) || 0, stockQuantity: Number(r.stock_quantity) || 0, description: (r.description as string) || "",
      imageUrl: (r.image_url as string) || "", trendyolBarcode: (r.trendyol_barcode as string) || "",
      trendyolCategoryId: (r.trendyol_category_id as number) ?? null, trendyolBrandId: (r.trendyol_brand_id as number) ?? null,
      trendyolSyncedAt: String(r.trendyol_synced_at || ""), trendyolSyncError: (r.trendyol_sync_error as string) || "",
    };
  }
  function normSale(r: Record<string, unknown>): Sale {
    return {
      id: r.id as number, productId: (r.product_id as number) ?? null, productName: r.product_name as string,
      quantity: Number(r.quantity) || 0, unitPrice: Number(r.unit_price) || 0, total: Number(r.total) || 0,
      paymentMethod: (r.payment_method as string) || "Nakit", note: (r.note as string) || "",
      soldAt: String(r.sold_at || ""), createdAt: String(r.created_at || ""),
    };
  }

  let productsData: Product[] = [];
  let salesData: Sale[] = [];
  let meUser: Me | null = null;
  let tySettings = { supplierId: "", hasApiKey: false, hasApiSecret: false };
  let editingProduct: number | null = null;

  async function fetchAll() {
    const loaderEl = document.getElementById("topLoader");
    if (loaderEl) loaderEl.classList.add("show");
    try {
      const [me, products, sales, ty] = await Promise.all([
        api<Me>("/api/me"),
        api<Record<string, unknown>[]>("/api/products"),
        api<Record<string, unknown>[]>("/api/sales"),
        api<{ supplierId: string; hasApiKey: boolean; hasApiSecret: boolean }>("/api/trendyol/settings"),
      ]);
      meUser = me;
      productsData = products.map(normProduct);
      salesData = sales.map(normSale);
      tySettings = ty;
      const banner = document.getElementById("dbBanner");
      if (banner) banner.hidden = true;
      renderAll();
    } catch {
      const banner = document.getElementById("dbBanner");
      if (banner) banner.hidden = false;
    } finally {
      if (loaderEl) loaderEl.classList.remove("show");
    }
  }

  // -------- render: dashboard --------
  function renderDashboard() {
    const t = todayIso();
    const month = t.slice(0, 7);
    const todayTotal = salesData.filter((s) => s.soldAt === t).reduce((a, s) => a + s.total, 0);
    const monthTotal = salesData.filter((s) => s.soldAt.startsWith(month)).reduce((a, s) => a + s.total, 0);
    const outOfStock = productsData.filter((p) => p.stockQuantity <= 0).length;
    const statsEl = document.getElementById("dashStats");
    if (statsEl) {
      statsEl.innerHTML =
        "<div class=\"stat-tile\"><div class=\"num\">" + money(todayTotal) + "</div><div class=\"lbl\">Bugünkü ciro</div></div>" +
        "<div class=\"stat-tile\"><div class=\"num\">" + money(monthTotal) + "</div><div class=\"lbl\">Bu ayki ciro</div></div>" +
        "<div class=\"stat-tile\"><div class=\"num\">" + productsData.length + "</div><div class=\"lbl\">Ürün sayısı</div></div>" +
        "<div class=\"stat-tile\"><div class=\"num\">" + outOfStock + "</div><div class=\"lbl\">Stokta tükenen</div></div>";
    }
    const el = document.getElementById("dashRecentSales");
    if (!el) return;
    const recent = salesData.slice(0, 8);
    if (!recent.length) { el.innerHTML = "<p class=\"empty-note\">Henüz satış kaydı yok</p>"; return; }
    el.innerHTML = recent.map((s) =>
      "<div class=\"list-item\"><div class=\"li-top\">" +
      "<div><div class=\"li-title\">" + escapeHtml(s.productName) + "</div>" +
      "<div class=\"li-sub\">" + s.quantity + " adet · " + escapeHtml(s.paymentMethod) + " · " + fmtDateShort(s.soldAt) + "</div></div>" +
      "<div class=\"li-amount\">" + money(s.total) + "</div></div></div>"
    ).join("");
  }

  // -------- render: products --------
  function trendyolStatusHtml(p: Product) {
    if (p.trendyolSyncError) return "<span class=\"badge badge-rust\">Trendyol hata</span>";
    if (p.trendyolSyncedAt) return "<span class=\"badge badge-good\">Trendyol'da</span>";
    return "";
  }
  function renderProducts() {
    const el = document.getElementById("productsList");
    if (!el) return;
    const sorted = productsData.slice().sort((a, b) => a.category.localeCompare(b.category, "tr") || a.name.localeCompare(b.name, "tr"));
    if (!sorted.length) { el.innerHTML = "<p class=\"empty-note\">Henüz ürün eklenmedi.</p>"; return; }
    el.innerHTML = sorted.map((p) => {
      const low = p.stockQuantity <= 0;
      return "<div class=\"list-item\"><div class=\"li-top\">" +
        "<div class=\"li-media\">" +
        (p.imageUrl ? "<img class=\"product-img\" src=\"" + escapeHtml(p.imageUrl) + "\" alt=\"\">" : "") +
        "<div><div class=\"li-title\">" + escapeHtml(p.name) + "</div>" +
        "<div class=\"li-sub\">" + escapeHtml(p.category) + " · " + money(p.price) + " · " + p.stockQuantity + " adet stokta" + (p.sku ? " · " + escapeHtml(p.sku) : "") + "</div>" +
        (p.trendyolSyncError ? "<div class=\"li-sub\" style=\"color:var(--rust)\">" + escapeHtml(p.trendyolSyncError) + "</div>" : "") +
        "</div></div>" + (low ? "<span class=\"badge badge-amber\">Stok yok</span>" : "") + "</div>" +
        (trendyolStatusHtml(p) ? "<div class=\"trendyol-status\">" + trendyolStatusHtml(p) + "</div>" : "") +
        "<div class=\"li-actions\">" +
        "<button type=\"button\" data-edit-product=\"" + p.id + "\">Düzenle</button>" +
        "<button type=\"button\" data-ty-upload=\"" + p.id + "\">Trendyol'a Yükle</button>" +
        "<button type=\"button\" class=\"danger\" data-del-product=\"" + p.id + "\">Sil</button>" +
        "</div></div>";
    }).join("");
  }
  // Ürün fotoğrafı: telefondan seçilir/çekilir, hemen Vercel Blob'a yüklenir ve genel erişimli URL'si gizli alana
  // yazılır — kullanıcı bir link girmez, yalnızca dosyayı seçer.
  function setProductImagePreview(url: string) {
    const img = document.getElementById("f-p-image-preview") as HTMLImageElement;
    const clearBtn = document.getElementById("f-p-image-clear-btn") as HTMLElement;
    (document.getElementById("f-p-image") as HTMLInputElement).value = url;
    if (url) { img.src = url; img.hidden = false; clearBtn.hidden = false; }
    else { img.src = ""; img.hidden = true; clearBtn.hidden = true; }
  }
  async function pickAndUploadProductImage() {
    const fileInput = document.getElementById("f-p-image-file") as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) return;
    const statusEl = document.getElementById("f-p-image-status") as HTMLElement;
    statusEl.textContent = "Yükleniyor…";
    try {
      const res = await fetch("/api/upload", { method: "POST", headers: { "Content-Type": file.type }, body: file });
      if (!res.ok) { const b = await res.json().catch(() => null); throw new Error(b?.error || "Yüklenemedi."); }
      const { url } = await res.json();
      setProductImagePreview(url);
      statusEl.textContent = "";
    } catch (e) {
      statusEl.textContent = "";
      showToast(e instanceof Error ? e.message : "Fotoğraf yüklenemedi.");
    } finally {
      fileInput.value = "";
    }
  }
  function openProductForm(id: number | null) {
    editingProduct = id;
    const p = id ? productsData.find((x) => x.id === id) : null;
    (document.getElementById("f-p-name") as HTMLInputElement).value = p ? p.name : "";
    (document.getElementById("f-p-category") as HTMLInputElement).value = p ? p.category : "";
    (document.getElementById("f-p-price") as HTMLInputElement).value = p ? String(p.price) : "";
    (document.getElementById("f-p-stock") as HTMLInputElement).value = p ? String(p.stockQuantity) : "0";
    (document.getElementById("f-p-sku") as HTMLInputElement).value = p ? p.sku : "";
    (document.getElementById("f-p-desc") as HTMLTextAreaElement).value = p ? p.description : "";
    setProductImagePreview(p ? p.imageUrl : "");
    (document.getElementById("f-p-ty-barcode") as HTMLInputElement).value = p ? p.trendyolBarcode : "";
    (document.getElementById("f-p-ty-category") as HTMLInputElement).value = p?.trendyolCategoryId ? String(p.trendyolCategoryId) : "";
    (document.getElementById("f-p-ty-brand") as HTMLInputElement).value = p?.trendyolBrandId ? String(p.trendyolBrandId) : "";
    (document.getElementById("productForm") as HTMLElement).hidden = false;
  }
  async function submitProductForm() {
    const name = (document.getElementById("f-p-name") as HTMLInputElement).value.trim();
    if (!name) { showToast("Ürün adı gerekli."); return; }
    const data = {
      name,
      category: (document.getElementById("f-p-category") as HTMLInputElement).value.trim() || "Diğer",
      price: Number((document.getElementById("f-p-price") as HTMLInputElement).value) || 0,
      stockQuantity: Number((document.getElementById("f-p-stock") as HTMLInputElement).value) || 0,
      sku: (document.getElementById("f-p-sku") as HTMLInputElement).value.trim(),
      description: (document.getElementById("f-p-desc") as HTMLTextAreaElement).value.trim(),
      imageUrl: (document.getElementById("f-p-image") as HTMLInputElement).value.trim(),
      trendyolBarcode: (document.getElementById("f-p-ty-barcode") as HTMLInputElement).value.trim() || null,
      trendyolCategoryId: Number((document.getElementById("f-p-ty-category") as HTMLInputElement).value) || null,
      trendyolBrandId: Number((document.getElementById("f-p-ty-brand") as HTMLInputElement).value) || null,
    };
    try {
      if (editingProduct) await api("/api/products/" + editingProduct, { method: "PATCH", body: JSON.stringify(data) });
      else await api("/api/products", { method: "POST", body: JSON.stringify(data) });
      (document.getElementById("productForm") as HTMLElement).hidden = true;
      await fetchAll();
    } catch { showToast("Kaydedilemedi (aynı isim ya da barkod başka bir üründe olabilir)."); }
  }
  async function uploadToTrendyol(id: number) {
    showToast("Trendyol'a yükleniyor…");
    try {
      await api("/api/trendyol/upload/" + id, { method: "POST" });
      showToast("Trendyol'a gönderildi.");
      await fetchAll();
    } catch (e) {
      showToast(e instanceof Error ? e.message.replace(/^İstek başarısız \(\d+\)$/, "Trendyol'a yükleme başarısız.") : "Trendyol'a yükleme başarısız.");
      await fetchAll();
    }
  }

  // -------- render: sales --------
  function syncSaleProductOptions() {
    const sel = document.getElementById("f-s-product") as HTMLSelectElement | null;
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = "<option value=\"\">— Serbest ürün (listede yok) —</option>" +
      productsData.slice().sort((a, b) => a.name.localeCompare(b.name, "tr")).map((p) => "<option value=\"" + p.id + "\">" + escapeHtml(p.name) + " (" + p.stockQuantity + " adet)</option>").join("");
    if (cur && productsData.some((p) => String(p.id) === cur)) sel.value = cur;
  }
  function updateSaleFreeNameVisibility() {
    const sel = document.getElementById("f-s-product") as HTMLSelectElement;
    const wrap = document.getElementById("f-s-freename-wrap");
    if (wrap) wrap.hidden = !!sel.value;
  }
  function applySaleProductChoice() {
    const sel = document.getElementById("f-s-product") as HTMLSelectElement;
    const p = productsData.find((x) => String(x.id) === sel.value);
    if (p) (document.getElementById("f-s-price") as HTMLInputElement).value = String(p.price);
    updateSaleFreeNameVisibility();
  }
  function renderSales() {
    const el = document.getElementById("salesList");
    if (!el) return;
    syncSaleProductOptions();
    const sorted = salesData.slice().sort((a, b) => (b.soldAt + b.createdAt).localeCompare(a.soldAt + a.createdAt));
    if (!sorted.length) { el.innerHTML = "<p class=\"empty-note\">Henüz satış kaydı yok</p>"; return; }
    el.innerHTML = sorted.map((s) =>
      "<div class=\"list-item\"><div class=\"li-top\">" +
      "<div><div class=\"li-title\">" + escapeHtml(s.productName) + "</div>" +
      "<div class=\"li-sub\">" + s.quantity + " × " + money(s.unitPrice) + " · " + escapeHtml(s.paymentMethod) + " · " + fmtDateShort(s.soldAt) +
      (s.note ? " · " + escapeHtml(s.note) : "") + "</div></div>" +
      "<div class=\"li-amount\">" + money(s.total) + "</div></div>" +
      "<div class=\"li-actions\"><button type=\"button\" class=\"danger\" data-del-sale=\"" + s.id + "\">Sil</button></div></div>"
    ).join("");
  }
  function openSaleForm() {
    syncSaleProductOptions();
    (document.getElementById("f-s-product") as HTMLSelectElement).value = "";
    (document.getElementById("f-s-freename") as HTMLInputElement).value = "";
    (document.getElementById("f-s-quantity") as HTMLInputElement).value = "1";
    (document.getElementById("f-s-price") as HTMLInputElement).value = "";
    (document.getElementById("f-s-payment") as HTMLSelectElement).value = "Nakit";
    (document.getElementById("f-s-date") as HTMLInputElement).value = todayIso();
    (document.getElementById("f-s-note") as HTMLInputElement).value = "";
    updateSaleFreeNameVisibility();
    (document.getElementById("saleForm") as HTMLElement).hidden = false;
  }
  async function submitSaleForm() {
    const productId = (document.getElementById("f-s-product") as HTMLSelectElement).value;
    const freeName = (document.getElementById("f-s-freename") as HTMLInputElement).value.trim();
    if (!productId && !freeName) { showToast("Ürün seçin ya da ürün adı girin."); return; }
    const data = {
      productId: productId ? Number(productId) : null,
      productName: freeName,
      quantity: Number((document.getElementById("f-s-quantity") as HTMLInputElement).value) || 1,
      unitPrice: Number((document.getElementById("f-s-price") as HTMLInputElement).value) || 0,
      paymentMethod: (document.getElementById("f-s-payment") as HTMLSelectElement).value,
      soldAt: (document.getElementById("f-s-date") as HTMLInputElement).value || todayIso(),
      note: (document.getElementById("f-s-note") as HTMLInputElement).value.trim(),
    };
    try {
      await api("/api/sales", { method: "POST", body: JSON.stringify(data) });
      (document.getElementById("saleForm") as HTMLElement).hidden = true;
      showToast("Satış kaydedildi.");
      await fetchAll();
    } catch { showToast("Kaydedilemedi."); }
  }

  // -------- render: settings --------
  function renderSettings() {
    const supplierEl = document.getElementById("f-ty-supplier") as HTMLInputElement | null;
    if (supplierEl && document.activeElement !== supplierEl) supplierEl.value = tySettings.supplierId;
    const keyEl = document.getElementById("f-ty-key") as HTMLInputElement | null;
    if (keyEl) keyEl.placeholder = tySettings.hasApiKey ? "Kayıtlı — değiştirmek için doldurun" : "Girilmedi";
    const secretEl = document.getElementById("f-ty-secret") as HTMLInputElement | null;
    if (secretEl) secretEl.placeholder = tySettings.hasApiSecret ? "Kayıtlı — değiştirmek için doldurun" : "Girilmedi";
    const status = document.getElementById("tyStatus");
    if (status) {
      status.textContent = tySettings.supplierId && tySettings.hasApiKey && tySettings.hasApiSecret
        ? "Trendyol bilgileri kayıtlı."
        : "Trendyol bilgileri eksik — ürünleri yükleyebilmek için Supplier ID, API Key ve API Secret'ın hepsi girilmeli.";
    }
    const meLabel = document.getElementById("meLabel");
    if (meLabel && meUser) meLabel.textContent = meUser.name + (meUser.email ? " · " + meUser.email : "") + " · " + (meUser.role === "owner" ? "İşletme sahibi" : "Personel");
    const saveBtn = document.getElementById("tySaveBtn") as HTMLButtonElement | null;
    if (saveBtn) saveBtn.hidden = meUser?.role !== "owner";
  }
  async function saveTrendyolSettings() {
    const data = {
      supplierId: (document.getElementById("f-ty-supplier") as HTMLInputElement).value.trim(),
      apiKey: (document.getElementById("f-ty-key") as HTMLInputElement).value.trim(),
      apiSecret: (document.getElementById("f-ty-secret") as HTMLInputElement).value.trim(),
    };
    try {
      await api("/api/trendyol/settings", { method: "POST", body: JSON.stringify(data) });
      (document.getElementById("f-ty-key") as HTMLInputElement).value = "";
      (document.getElementById("f-ty-secret") as HTMLInputElement).value = "";
      showToast("Kaydedildi.");
      await fetchAll();
    } catch { showToast("Kaydedilemedi."); }
  }

  function renderAll() {
    renderDashboard();
    renderProducts();
    renderSales();
    renderSettings();
  }

  // -------- navigation --------
  function switchView(name: string) {
    document.querySelectorAll<HTMLElement>(".view").forEach((v) => { v.hidden = v.id !== "view-" + name; });
    document.querySelectorAll<HTMLElement>(".bottom-nav button[data-view]").forEach((b) => {
      const active = b.dataset.view === name;
      b.classList.toggle("active", active);
      b.setAttribute("aria-current", active ? "page" : "false");
    });
  }
  document.querySelectorAll<HTMLElement>(".bottom-nav button[data-view]").forEach((b) => {
    const fn = () => switchView(b.dataset.view!);
    b.addEventListener("click", fn);
    cleanups.push(() => b.removeEventListener("click", fn));
  });

  // -------- wiring --------
  on("productAddBtn", "click", () => openProductForm(null));
  on("productCancelBtn", "click", () => { (document.getElementById("productForm") as HTMLElement).hidden = true; });
  on("productSaveBtn", "click", submitProductForm);
  on("f-p-image-pick-btn", "click", () => document.getElementById("f-p-image-file")!.click());
  on("f-p-image-file", "change", pickAndUploadProductImage);
  on("f-p-image-clear-btn", "click", () => setProductImagePreview(""));
  on("productsList", "click", (e) => {
    const target = e.target as HTMLElement;
    const ed = target.closest("[data-edit-product]") as HTMLElement | null; if (ed) { openProductForm(+ed.dataset.editProduct!); return; }
    const ty = target.closest("[data-ty-upload]") as HTMLElement | null; if (ty) { uploadToTrendyol(+ty.dataset.tyUpload!); return; }
    const del = target.closest("[data-del-product]") as HTMLElement | null;
    if (del && confirm("Bu ürünü silmek istiyor musunuz?")) api("/api/products/" + del.dataset.delProduct, { method: "DELETE" }).then(() => fetchAll()).catch(() => showToast("Silinemedi."));
  });

  on("saleAddBtn", "click", openSaleForm);
  on("saleCancelBtn", "click", () => { (document.getElementById("saleForm") as HTMLElement).hidden = true; });
  on("saleSaveBtn", "click", submitSaleForm);
  on("f-s-product", "change", applySaleProductChoice);
  on("salesList", "click", (e) => {
    const target = e.target as HTMLElement;
    const del = target.closest("[data-del-sale]") as HTMLElement | null;
    if (del && confirm("Bu satışı silmek istiyor musunuz? (Stok geri eklenir)")) api("/api/sales/" + del.dataset.delSale, { method: "DELETE" }).then(() => fetchAll()).catch(() => showToast("Silinemedi."));
  });

  on("tySaveBtn", "click", saveTrendyolSettings);

  void fetchAll();
  return () => { cleanups.forEach((fn) => fn()); };
}
