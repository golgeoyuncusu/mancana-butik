-- Mancana Butik — satış/stok takip uygulaması şeması. Tek işletme (Oteloji'nin aksine çoklu otel/kiracı yok),
-- bu yüzden tablo başına hotel_id gibi bir alan yok. Betik tekrar tekrar güvenle çalıştırılabilir
-- (create table if not exists / add column if not exists).

create table if not exists users (
  id text primary key,                 -- Clerk kullanıcı id'si
  name text not null default '',
  email text,
  role text not null default 'owner',  -- 'owner' | 'staff' — v1'de ayrım yapılmıyor, ileride gerekirse kullanılabilir
  created_at timestamptz not null default now()
);

create table if not exists products (
  id serial primary key,
  name text not null,
  category text not null default 'Diğer',
  sku text,
  price numeric not null default 0,
  stock_quantity numeric not null default 0,
  description text,
  image_urls text[] not null default '{}',   -- birden fazla fotoğraf; ürünler ekranında ilk tıklanınca galeri açılır
  -- Trendyol'a ürün yüklemek için gereken alanlar. Trendyol'un kendi kategori/marka kimlikleri kullanıcı
  -- tarafından Trendyol satıcı panelinden bulunup girilir (bu uygulama Trendyol'un kategori ağacını içermez).
  trendyol_barcode text,
  trendyol_category_id integer,
  trendyol_brand_id integer,
  trendyol_synced_at timestamptz,
  trendyol_sync_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_products_name on products (lower(name));
create unique index if not exists uq_products_trendyol_barcode on products (trendyol_barcode) where trendyol_barcode is not null;
-- "create table if not exists" var olan bir tabloya yeni sütun eklemez (yalnızca tablo hiç yoksa çalışır),
-- bu yüzden image_urls burada ayrıca eklenir.
alter table products add column if not exists image_urls text[] not null default '{}';
-- Eski tekil image_url sütunundan geçiş (bir kereliğine): var olan tek görsel, yeni diziye taşınır, sütun kaldırılır.
do $$
begin
  if exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'image_url') then
    update products set image_urls = array[image_url] where image_url is not null and image_url <> '' and image_urls = '{}';
    alter table products drop column image_url;
  end if;
end $$;

create table if not exists sales (
  id serial primary key,
  product_id integer references products(id) on delete set null,
  product_name text not null,     -- satış anındaki ürün adı kopyası: ürün silinse/adı değişse de geçmiş satış bozulmaz
  quantity numeric not null default 1,
  unit_price numeric not null default 0,
  total numeric not null default 0,
  payment_method text not null default 'Nakit',
  note text,
  sold_at date not null default current_date,
  created_by text references users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_sales_sold_at on sales (sold_at desc);

-- Trendyol satıcı API bilgileri: tekil satır (id=1), Ayarlar ekranından girilir.
create table if not exists trendyol_settings (
  id integer primary key default 1,
  supplier_id text,
  api_key text,
  api_secret text,
  updated_at timestamptz not null default now()
);
insert into trendyol_settings (id) values (1) on conflict (id) do nothing;
