import { describe, expect, it } from "vitest";
import { buildTrendyolProductPayload, type TrendyolProductInput } from "./trendyol";

const base: TrendyolProductInput = {
  barcode: "MB-0001", title: "Keten Elbise", categoryId: 411, brandId: 7854,
  quantity: 5, stockCode: "MB-0001", price: 899.9,
};

describe("buildTrendyolProductPayload (Trendyol'a gönderilecek gövde)", () => {
  it("tek ürünlük bir items dizisi üretir, temel alanlar doğru eşlenir", () => {
    const body = buildTrendyolProductPayload(base);
    expect(body.items).toHaveLength(1);
    const item = body.items[0];
    expect(item.barcode).toBe("MB-0001");
    expect(item.title).toBe("Keten Elbise");
    expect(item.categoryId).toBe(411);
    expect(item.brandId).toBe(7854);
    expect(item.listPrice).toBe(899.9);
    expect(item.salePrice).toBe(899.9);
    expect(item.currencyType).toBe("TRY");
  });
  it("miktar negatif olamaz ve tam sayıya yuvarlanır", () => {
    expect(buildTrendyolProductPayload({ ...base, quantity: -3 }).items[0].quantity).toBe(0);
    expect(buildTrendyolProductPayload({ ...base, quantity: 2.7 }).items[0].quantity).toBe(3);
  });
  it("açıklama verilmezse başlık açıklama olarak kullanılır", () => {
    expect(buildTrendyolProductPayload(base).items[0].description).toBe("Keten Elbise");
    expect(buildTrendyolProductPayload({ ...base, description: "El yapımı" }).items[0].description).toBe("El yapımı");
  });
  it("görsel verilmezse boş dizi; birden fazla görsel sırayla eşlenir", () => {
    expect(buildTrendyolProductPayload(base).items[0].images).toEqual([]);
    expect(buildTrendyolProductPayload({ ...base, imageUrls: ["https://x/a.jpg"] }).items[0].images).toEqual([{ url: "https://x/a.jpg" }]);
    expect(buildTrendyolProductPayload({ ...base, imageUrls: ["https://x/a.jpg", "https://x/b.jpg"] }).items[0].images)
      .toEqual([{ url: "https://x/a.jpg" }, { url: "https://x/b.jpg" }]);
  });
});
