# Mancana Butik

Mancana Butik için satış ve stok takip uygulaması: ürün kataloğu, satış kayıtları, günlük/aylık ciro paneli ve
Trendyol'a ürün yükleme. Next.js + Postgres + Clerk ile, Oteloji ile aynı teknik yaklaşımla kuruldu, ama tamamen
ayrı ve bağımsız bir proje/veritabanıdır.

## Canlıya almadan önce gerekenler

Bu proje şu an yalnızca yerel geliştirme ortamında kuruldu ve test edildi (sahte/placeholder kimlik bilgileriyle).
Gerçek kullanıma açmak için üç şey gerekiyor:

1. **Postgres veritabanı** — yeni bir Neon/Vercel Postgres veritabanı oluşturulmalı (Oteloji'ninkinden tamamen
   ayrı). Vercel projesi oluşturulurken "Storage" sekmesinden eklenebilir; bağlantı bilgileri otomatik
   `.env.local`'e (ya da Vercel proje ortam değişkenlerine) eklenir.
2. **Clerk uygulaması** — [dashboard.clerk.com](https://dashboard.clerk.com) üzerinden yeni bir uygulama
   oluşturulmalı (Oteloji'ninkinden ayrı, kullanıcılar karışmasın diye). `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` ve
   `CLERK_SECRET_KEY` değerleri `.env.local`'e eklenir.
3. **Trendyol satıcı API bilgileri** (opsiyonel, yalnızca "Trendyol'a Yükle" özelliği için) — Trendyol satıcı
   panelinden (partner.trendyol.com) Supplier ID, API Key ve API Secret alınıp uygulama içindeki Ayarlar
   ekranından girilir. **Bu entegrasyon henüz gerçek bir Trendyol hesabına karşı test edilmedi** — `src/lib/trendyol.ts`
   dosyasının başındaki not bunu detaylandırır. İlk denemede Trendyol'un güncel API dokümantasyonuna göre
   (endpoint adresi/gövde alanları değişmiş olabilir) küçük düzeltmeler gerekebilir.

Veritabanı kurulduktan sonra şema uygulanır:

```
npm run db:push
```

## Geliştirme

```
npm install
npm run dev       # http://localhost:3000
npm test          # vitest
npx tsc --noEmit  # tip kontrolü
npx eslint src    # lint
```

## Yapı

- `src/app/page.tsx` — tek sayfalık istemci uygulaması (Panel, Ürünler, Satışlar, Ayarlar).
- `src/app/api/*` — API rotaları (ürünler, satışlar, Trendyol ayarları/yükleme).
- `src/lib/trendyol.ts` — Trendyol API istemcisi (doğrulanmamış, bkz. yukarıdaki not).
- `db/schema.sql` — veritabanı şeması (`npm run db:push` ile uygulanır, tekrar çalıştırmak güvenlidir).
