# NAPALIM — React Native Mobil Dönüşüm ve Yol Haritası

Bu doküman, Napalim web prototipinin (`justalpay/napalim_app`) React Native + Expo + TypeScript altyapısıyla gerçek bir native mobil uygulamaya (iOS & Android) dönüştürülme sürecinin master planıdır.

---

## 🧭 Temel Prensipler

1. **Sıfır Web-Kalıntısı (Pure Native UI):**
   - WebView veya HTML/CSS kullanılmaz.
   - Tüm arayüz React Native bileşenleri (`View`, `Text`, `Pressable`, `FlatList`, `Image`, `Modal`) ile oluşturulur.
2. **Tasarım Bütünlüğü (1:1 Görsel Kimlik):**
   - Web prototipindeki renk paleti (`#07070d` karanlık tema, `#a855f7` neon mor, `#ec4899` neon pembe), kart kenar yuvarlaklıkları ve tipografi korunur.
3. **Mevcut Projenin Korunması:**
   - Referans web uygulaması (`vibrant-maxwell`) ayrı tutulur, hiçbir dosyası değiştirilmez veya silinmez.

---

## 🚀 Aşamalı Geliştirme Yol Haritası

### ✅ Aşama A — Native Temel ve Harita Prototipi (TAMAMLANDI)
* [x] Bağımsız Expo + TypeScript mobil projesi oluşturuldu (`napalim-mobile`).
* [x] `@maplibre/maplibre-react-native` ve `react-native-safe-area-context` paketleri kuruldu.
* [x] `app.json` içinde native config plugin, `bundleIdentifier` ve `package` (`com.justalpay.napalim`) tanımlandı.
* [x] Expo Prebuild ile native Android ortamı (`./android`) başarıyla üretildi.
* [x] Orijinal web projesinden Carto Dark Matter stil URL'i ve Kadıköy merkez koordinatları aktarıldı.
* [x] Test pinleri, Safe Area uyumlu Napalim üst barı ve pin detay kartı içeren native `MapScreen` oluşturuldu.
* [x] TypeScript doğrulaması sıfır hata ile tamamlandı.

---

### ⏳ Aşama B — Napalim Ana Arayüzü ve Native Navigasyon
* [ ] `@react-navigation/native` ve `@react-navigation/bottom-tabs` kurulumu.
* [ ] Mevcut web prototipindeki 5 sekmeli alt navigasyon çubuğu (Harita, Etkinlikler, Keşfet/Swipe, Mesajlar, Profil).
* [ ] Aktif sekme neon ışıltıları, haptics (titreşim) geri bildirimi.
* [ ] Ekranlar arası native geçiş animasyonları.

---

### ⏳ Aşama C — Mekan ve Harita Gelişmiş Özellikleri
* [ ] 20 adet gerçek mekan verisinin (`PINS`) native veri modeline aktarılması.
* [ ] Kategori filtre çipleri (Oyun 🎮, Kafe ☕, Sanat 🎨, Spor 🏃, Müzik 🎵, Diğer 🎯).
* [ ] Semt arama çubuğu ve otomatik `Camera.flyTo` animasyonu.
* [ ] MapLibre Native kümeleme (Supercluster) entegrasyonu.
* [ ] Kullanıcı konumu ve neon rota çizgisi (`ShapeSource` + `LineLayer`).
* [ ] Yürüme mesafesi/süresi hesaplama ve Google Haritalar'a `Linking.openURL` yönlendirmesi.

---

### ⏳ Aşama D — 72 Saatlik Etkinlik Sistemi
* [ ] Geri sayım sayacı motoru (`getTimeRemaining` fonksiyonunun taşınması).
* [ ] Aciliyet durumları (kırmızı < 6s, sarı < 24s, normal).
* [ ] 30 kişilik kontenjan sınırı ve doluluk barı.
* [ ] Etkinlik oluşturma modalı (tarih, mekan, kategori, açıklama).
* [ ] Üye listesi, katılım istekleri ve admin yetkileri (üye çıkarma, etkinliği kapatma).

---

### ⏳ Aşama E — Keşfet ve Swipe (Tinder Kart Sistemi)
* [ ] `react-native-gesture-handler` + `react-native-reanimated` ile 120Hz native kart fiziği.
* [ ] 3'lü kart destesi derinlik ve perspektif animasyonu.
* [ ] Beğen (sağa), Pas (sola), Süper Beğeni (yukarı) hareketleri ve butonları.
* [ ] Eşleşme (Match) modalı ve `react-native-confetti-cannon` kutlama efekti.

---

### ⏳ Aşama F — Profil ve Kimlik Doğrulama Arayüzü
* [ ] Profil ekranı (avatar, yaş, konum, biyografi, ilgi alanı etiketleri).
* [ ] 3D AI maskot avatarları ve cihazdan fotoğraf yükleme (`expo-image-picker`).
* [ ] Hoş Geldin / Giriş ekranı (E-posta/Şifre, Google ile Giriş, Apple ile Giriş tasarımı).

---

### ⏳ Aşama G — Merkezi Backend ve Canlı Sosyal Özellikler
* [ ] Backend mimarisi seçimi (Supabase / Firebase).
* [ ] Gerçek kullanıcı kimlik doğrulaması (`expo-apple-authentication`, `@react-native-google-signin`).
* [ ] Gerçek zamanlı WebSocket/Push mesajlaşma motoru (simülasyondan gerçek sohbete geçiş).
* [ ] Push bildirimleri (`expo-notifications`).

---

### ⏳ Aşama H — Güvenlik, Test ve Mağaza Yayını
* [ ] Raporlama, kullanıcı engelleme ve hesap silme akışları (App Store şartları).
* [ ] Android Release AAB derlemesi (`npx expo run:android --variant release` veya EAS Build).
* [ ] iOS Xcode / TestFlight derlemesi (EAS Build / Mac ortamı).
* [ ] Google Play Console ve Apple App Store Connect yükleme süreçleri.
