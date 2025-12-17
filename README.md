# 📊 iSubrek - Subscription Tracker

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=for-the-badge&logo=supabase)

**Kelola langganan dan pembayaran berulang dengan aman dan mudah.**

[Demo](#demo) • [Fitur](#-fitur-utama) • [Instalasi](#-instalasi) • [Dokumentasi](#-dokumentasi)

</div>

---

## 📖 Tentang iSubrek

iSubrek adalah aplikasi web untuk melacak langganan (subscription), trial, dan pembayaran berulang. Aplikasi ini membantu mencegah tagihan tak terduga dengan memonitor siklus billing, metode pembayaran, dan menyimpan kredensial akun secara aman.

Dibangun dengan teknologi modern: **Next.js 15**, **TypeScript**, **Supabase**, dan **Clerk Authentication**, iSubrek menawarkan pengalaman mobile-first yang responsif untuk manajemen langganan.

---

## ✨ Fitur Utama

### 📱 Dashboard Interaktif
- **Summary Cards** - Total pengeluaran bulanan, jumlah langganan aktif, dan trial yang akan berakhir
- **Responsive Layout** - Grid untuk desktop, card-based list untuk mobile
- **Visual Alerts** - Highlight untuk pembayaran yang mendekati jatuh tempo

### 💳 Manajemen Langganan
- **CRUD Operations** - Tambah, edit, hapus, dan lihat detail langganan
- **Billing Cycles** - Support monthly, yearly, one-time, dan trial
- **Kategori** - Entertainment, Tools, Work, Utilities
- **Status Tracking** - Active, Cancelled, Expired

### 🔐 Keamanan
- **Payment Masking** - Nomor kartu hanya menampilkan 4 digit terakhir (**** 1234)
- **AES Encryption** - Password akun dienkripsi server-side
- **User Isolation** - Data terisolasi per user dengan Clerk ID
- **Server Actions** - Operasi sensitif hanya di server

### 📅 Integrasi Kalender
- **Google Calendar** - Tambahkan reminder pembayaran ke kalender
- **Auto-generated Events** - Event "Renew [Nama Langganan]" dengan detail lengkap

### 🎨 UI/UX Modern
- **Dark/Light Theme** - Toggle tema dengan persistensi
- **Mobile-First** - Sheet/Drawer untuk form di mobile
- **Toast Notifications** - Feedback untuk setiap aksi
- **Shadcn/UI Components** - Komponen UI yang konsisten dan accessible

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 15 (App Router), React 19 |
| **Language** | TypeScript 5 (strict mode) |
| **Styling** | Tailwind CSS v4, shadcn/ui |
| **Database** | Supabase (PostgreSQL) |
| **ORM** | Drizzle ORM |
| **Auth** | Clerk (Google OAuth + Email) |
| **Forms** | React Hook Form + Zod v4 |
| **State** | Zustand (UI), TanStack Query (Server) |
| **Testing** | Vitest + fast-check (PBT) |
| **Icons** | Lucide React |

---

## 📁 Struktur Project

```
src/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout dengan ClerkProvider
│   ├── page.tsx                # Dashboard (halaman utama)
│   ├── globals.css             # Global styles
│   ├── sign-in/                # Halaman login
│   ├── sign-up/                # Halaman registrasi
│   └── subscriptions/
│       └── [id]/page.tsx       # Detail langganan
├── actions/                    # Server Actions
│   └── subscriptions.ts        # CRUD operations
├── components/                 # React components
│   ├── ui/                     # shadcn/ui components
│   ├── subscription-form.tsx   # Form create/edit
│   ├── subscription-sheet.tsx  # Mobile drawer wrapper
│   ├── subscription-card.tsx   # Card langganan
│   ├── subscription-list.tsx   # List dengan filtering
│   ├── summary-cards.tsx       # Dashboard summary
│   ├── password-copy-button.tsx
│   ├── calendar-button.tsx
│   └── theme-toggle.tsx
├── db/                         # Database layer
│   ├── index.ts                # postgres-js client
│   └── schema.ts               # Drizzle schema
├── lib/                        # Utility functions
│   ├── utils.ts                # cn() helper
│   ├── masking.ts              # Payment masking
│   ├── encryption.ts           # AES encryption
│   ├── date-utils.ts           # Date calculations
│   ├── calculations.ts         # Dashboard calculations
│   ├── filtering.ts            # Category/status filter
│   ├── serialization.ts        # JSON serialization
│   ├── calendar.ts             # Google Calendar URL
│   └── validations.ts          # Zod schemas
├── hooks/                      # Custom hooks
│   ├── use-auth.ts             # Clerk user ID
│   └── use-subscriptions.ts    # TanStack Query hook
└── stores/                     # Zustand stores
    └── ui-store.ts             # Theme state
```

---

## 🚀 Instalasi

### Prerequisites

- Node.js 18+ 
- npm atau yarn
- Akun [Supabase](https://supabase.com)
- Akun [Clerk](https://clerk.com)

### 1. Clone Repository

```bash
git clone https://github.com/username/isubrek.git
cd isubrek
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Buat file `.env.local` di root project:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Supabase Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# Encryption (generate random 32-char string)
ENCRYPTION_KEY=your-32-character-encryption-key
```

### 4. Setup Database

```bash
# Generate migration
npm run db:generate

# Push schema ke Supabase
npm run db:push
```

### 5. Run Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:ui` | Open Vitest UI |
| `npm run test:coverage` | Run tests with coverage |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Drizzle Studio |

---

## 🧪 Testing

iSubrek menggunakan **Vitest** sebagai test runner dan **fast-check** untuk property-based testing.

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# With UI
npm run test:ui
```

### Test Coverage

| Category | Tests |
|----------|-------|
| Masking | 6 tests |
| Encryption | 6 tests |
| Date Utils | 12 tests |
| Calculations | 10 tests |
| Filtering | 8 tests |
| Validations | 13 tests |
| Serialization | 5 tests |
| Calendar | 6 tests |
| Server Actions | 6 tests |
| **Total** | **74 tests** |

---

## 🔒 Security Features

### Payment Method Masking
```typescript
// Input: "1234567890123456"
// Output: "**** 3456"
maskPaymentMethod(fullNumber: string): string
```

### Password Encryption
```typescript
// AES encryption dengan server-side key
encryptPassword(plainText: string): string
decryptPassword(cipherText: string): string
```

### User Data Isolation
- Setiap query difilter berdasarkan Clerk User ID
- Server Actions memvalidasi ownership sebelum operasi

---

## 📱 Screenshots

> *Coming soon*

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Your Name**

- GitHub: [@username](https://github.com/username)

---

<div align="center">

Made with ❤️ using Next.js and TypeScript

</div>
