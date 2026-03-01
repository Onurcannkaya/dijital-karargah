# ⚔️ Dijital Karargâh — Komuta Merkezi

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0-FFB300?style=for-the-badge&logo=rocket&logoColor=white" />
  <img src="https://img.shields.io/badge/PWA-Ready-4CAF50?style=for-the-badge&logo=pwa&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" />
  <img src="https://img.shields.io/badge/Vercel-Deploy-000000?style=for-the-badge&logo=vercel&logoColor=white" />
</p>

> **Kişisel ve ekip görevlerini askeri disiplinle yöneten, bulut tabanlı PWA görev yönetim sistemi.**

---

## 🎯 Özellikler

| Özellik | Açıklama |
|---------|----------|
| 🔐 **Kullanıcı Girişi** | Supabase Auth ile e-posta/şifre kayıt ve giriş |
| ☁️ **Bulut Senkronizasyonu** | Tüm görevler Supabase PostgreSQL'de güvenle saklanır |
| 📡 **Realtime** | Ekiple paylaşılan görevler anında diğer kullanıcılarda görünür |
| 🔔 **Bildirimler** | Görev vakti geldiğinde tarayıcı push bildirimi |
| 🌗 **Gündüz/Gece Modu** | Profesyonel açık ve koyu tema desteği |
| 📱 **PWA** | Telefona kurulabilir, offline çalışabilir |
| 📅 **Takvim Görünümü** | Görevleri aylık takvimde görselleştirme |
| 🎊 **Confetti Efekti** | Görev tamamlandığında kutlama animasyonu |
| 📊 **İlerleme Çubuğu** | Tamamlanma yüzdesini anlık takip |
| 🌐 **Ekip Paylaşımı** | Görevleri ekiple paylaşma ve atama |

---

## 🏗️ Teknoloji Yığını

```
Frontend     → Vanilla JS (ES Modules), HTML5, CSS3
Backend      → Supabase (PostgreSQL + Auth + Realtime)
PWA          → Service Worker (Network-First cache stratejisi)
Hosting      → Vercel
Tasarım      → BEM Metodolojisi, CSS Custom Properties
Fontlar      → Space Grotesk + Barlow Condensed (Google Fonts)
```

---

## 📁 Proje Yapısı

```
dijital-karargah/
├── css/
│   └── style.css          # Tüm stiller (Dark/Light tema, responsive)
├── js/
│   ├── app.js             # Ana uygulama mantığı (Auth, Render, Events)
│   └── db.js              # Supabase veri katmanı (CRUD, Realtime)
├── index.html             # Ana sayfa (SPA)
├── manifest.json          # PWA manifest dosyası
├── sw.js                  # Service Worker (önbellek yönetimi)
└── README.md              # Bu dosya
```

---

## 🚀 Kurulum ve Çalıştırma

### Ön Koşullar
- Bir [Supabase](https://supabase.com) hesabı ve projesi
- `tasks` tablosu (id, title, category, date, priority, completed, user_id, visibility, assigned_to, created_at)

### Yerel Geliştirme

```bash
# Projeyi klonla
git clone https://github.com/Onurcannkaya/dijital-karargah.git
cd dijital-karargah

# Yerel sunucu başlat
python -m http.server 3000

# Tarayıcıda aç
# http://localhost:3000
```

### Supabase Yapılandırması

`js/db.js` dosyasındaki aşağıdaki değişkenleri kendi Supabase projenizle güncelleyin:

```javascript
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
```

---

## 🗄️ Veritabanı Şeması

```sql
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'kisisel',
  date TIMESTAMPTZ DEFAULT NOW(),
  priority TEXT DEFAULT 'medium',
  completed BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id),
  visibility TEXT DEFAULT 'private',
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Politikaları
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kullanıcı kendi görevlerini görebilir"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id OR visibility = 'shared');

CREATE POLICY "Kullanıcı görev ekleyebilir"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kullanıcı kendi görevlerini güncelleyebilir"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Kullanıcı kendi görevlerini silebilir"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);
```

---

## ⌨️ Klavye Kısayolları

| Kısayol | İşlem |
|---------|-------|
| `Ctrl + N` | Yeni görev modal'ını aç |
| `Escape` | Modal'ı kapat |

---

## 📸 Ekran Görüntüleri

### 🌙 Koyu Tema (Varsayılan)
Endüstriyel altın vurgulu karanlık arayüz, CSS grid doku efekti ile.

### ☀️ Açık Tema
Ferah, profesyonel SaaS görünümü, belirgin gölgeler ve yumuşak renkler.

### 📱 Mobil Görünüm
Tam responsive tasarım — 375px'den 4K'ya kadar her ekranda kusursuz.

---

## 👨‍💻 Geliştirici

**Onurcan Kaya**

- GitHub: [@Onurcannkaya](https://github.com/Onurcannkaya)

---

## 📄 Lisans

Bu proje MIT Lisansı altında lisanslanmıştır.

---

<p align="center">
  <strong>⚔️ Karargâh Aktif — Görev Bekleniyor, Komutan!</strong>
</p>
