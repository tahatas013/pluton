# Plüton

LEGO koleksiyonunu ve istek listesini tutan, iPhone ve Mac'e kurulabilen bir web uygulaması (PWA).
Arayüz "Plaka" fikri üzerine kurulu: zemin bir LEGO plakası, üstündeki her şey bir tuğla.

**Adres:** https://tahatas013.github.io/pluton/

![Ekranlar](work/tasarim/uygulama-v1.png)

## Kurulum

- **iPhone:** Safari'de adresi aç → Paylaş → **Ana Ekrana Ekle**
- **Mac:** Safari'de aç → Dosya → **Dock'a Ekle**

Kurduktan sonra uygulama internetsiz de açılır; bakılan set görselleri önbellekte kalır.

## Neler var

- **Keşfet:** yılın yeni setleri, temalar, 3.000+ parçalık dev yapılar, "şansına bir set"
- **Ara:** set adı ya da kutudaki numarayla arama
- **Koleksiyon:** durum (kutusunda / yapıldı / sergide / söküldü), adet, not; toplam parça ve minifigür
- **İstekler:** üç öncelik seviyesi; alınca tek dokunuşla koleksiyona taşınır
- **Set sayfası:** parça ve minifigür sayısı, Türk mağazalarında (Akakçe, Trendyol, Hepsiburada, Amazon) set numarasıyla arama, montaj talimatları
- **Yedek:** veriler cihazda tutulur; Ayarlar'dan yedek alıp AirDrop ile diğer cihaza aktarılabilir

## Nasıl çalışıyor

- Vite + React + TypeScript, animasyonlar için Motion, veriler IndexedDB'de
- `scripts/build-catalog.mjs` Rebrickable'ın herkese açık CSV dökümlerinden set kataloğunu üretir
- GitHub Actions (`.github/workflows/yayinla.yml`) her push'ta ve her pazartesi kataloğu tazeleyip GitHub Pages'e yayınlar

## Geliştirme

```bash
npm install
npm run catalog      # Rebrickable'dan güncel kataloğu indirir
npm run dev          # http://localhost:5173/pluton/
```

Rebrickable'a erişilemeyen bir ortamda `npm run catalog:dev` küçük bir örnek katalog yazar.
İkonlar `scripts/icon.svg` dosyasından `npm run icons` ile üretilir.

Set verileri ve görselleri [Rebrickable](https://rebrickable.com)'dan gelir.
LEGO®, LEGO Group'un ticari markasıdır; bu uygulama LEGO Group ile bağlantılı değildir.
