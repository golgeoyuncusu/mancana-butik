// Trendyol Pazaryeri (Marketplace) Entegrasyon API istemcisi.
//
// ÖNEMLİ / DOĞRULANMAMIŞ: Bu istemci, Trendyol'un GENEL OLARAK BİLİNEN entegrasyon API şekline göre yazıldı
// (gerçek bir satıcı hesabına karşı TEST EDİLEMEDİ, çünkü bu uygulamanın henüz bir Trendyol Supplier ID /
// API Key / Secret'ı yok). Canlıya almadan önce mutlaka:
//   1) Trendyol Partner/Satıcı panelinden (partner.trendyol.com / entegrasyon.trendyol.com) gerçek API
//      bilgileriyle (Supplier ID, API Key, API Secret) Ayarlar ekranından bu bilgiler girilmeli,
//      2) Ürünler'de "Trendyol'a Yükle" bir kez denenip Trendyol'un güncel API dokümantasyonuna göre
//      endpoint adresi/gövde alanları (base URL değişmiş olabilir) doğrulanmalı ve gerekirse düzeltilmeli.
// Trendyol, ürün oluşturma isteklerini ASENKRON bir "batch" (toplu iş) olarak işler: bu istemci isteği
// gönderir ve bir batchRequestId döner; işlemin gerçekten başarılı olup olmadığını Trendyol panelinden ya da
// (ileride eklenebilecek) bir batch-durumu sorgusuyla teyit etmek gerekir.

export type TrendyolSettings = { supplierId: string; apiKey: string; apiSecret: string };

export type TrendyolProductInput = {
  barcode: string;
  title: string;
  categoryId: number;
  brandId: number;
  quantity: number;
  stockCode: string;
  price: number;
  description?: string;
  imageUrl?: string;
};

export class TrendyolApiError extends Error {}

function authHeader(s: TrendyolSettings) {
  const token = Buffer.from(`${s.apiKey}:${s.apiSecret}`).toString("base64");
  return `Basic ${token}`;
}

/** İstek gövdesini kurar (saf fonksiyon, ağ çağrısı yapmaz — testlidir). */
export function buildTrendyolProductPayload(product: TrendyolProductInput) {
  return {
    items: [
      {
        barcode: product.barcode,
        title: product.title,
        productMainId: product.barcode,
        brandId: product.brandId,
        categoryId: product.categoryId,
        quantity: Math.max(0, Math.round(product.quantity)),
        stockCode: product.stockCode,
        dimensionalWeight: 1,
        description: product.description || product.title,
        currencyType: "TRY",
        listPrice: product.price,
        salePrice: product.price,
        vatRate: 20,
        cargoCompanyId: 10,   // Trendyol Express varsayılanı — satıcı panelinde farklıysa güncellenmeli
        images: product.imageUrl ? [{ url: product.imageUrl }] : [],
        attributes: [],
      },
    ],
  };
}

/** Tek bir ürünü Trendyol'da oluşturur/günceller (barkod eşleşirse günceller). Trendyol'un kendi
 * batch-request kimliğini döner; işlemin sonucu bu id ile Trendyol panelinden takip edilebilir. */
export async function uploadProductToTrendyol(settings: TrendyolSettings, product: TrendyolProductInput): Promise<{ batchRequestId: string }> {
  if (!settings.supplierId || !settings.apiKey || !settings.apiSecret) {
    throw new TrendyolApiError("Trendyol API bilgileri (Supplier ID / API Key / Secret) eksik. Ayarlar'dan girin.");
  }
  const url = `https://api.trendyol.com/sapigw/suppliers/${encodeURIComponent(settings.supplierId)}/v2/products`;
  const body = buildTrendyolProductPayload(product);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authHeader(settings),
      "Content-Type": "application/json",
      "User-Agent": `${settings.supplierId} - SelfIntegration`,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let json: Record<string, unknown> | null = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* Trendyol her zaman JSON dönmeyebilir */ }

  if (!res.ok) {
    const msg = (json?.errors as { message?: string }[] | undefined)?.[0]?.message || json?.message as string | undefined || text || `HTTP ${res.status}`;
    throw new TrendyolApiError("Trendyol'a yükleme başarısız: " + msg);
  }
  const batchRequestId = (json?.batchRequestId as string) || "";
  if (!batchRequestId) throw new TrendyolApiError("Trendyol beklenmedik bir yanıt döndü (batchRequestId yok).");
  return { batchRequestId };
}
