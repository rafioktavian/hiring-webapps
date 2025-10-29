# 🚀 Hiring Portal – Role-Based Recruitment Platform

**Hiring Portal** adalah aplikasi berbasis **Next.js + Supabase** yang dirancang untuk mengelola proses rekrutmen berbasis peran (role-based).  
Sistem ini memiliki tiga level pengguna dengan hak akses berbeda:

- 🧑‍💼 **Super Admin** — mengatur Admin dan memantau semua aktivitas kandidat.  
- 👩‍💻 **Admin** — mengelola lowongan pekerjaan dan meninjau lamaran kandidat.  
- 🙋‍♂️ **Candidate** — mendaftar akun, mengisi profil, dan melamar pekerjaan.

Aplikasi ini dibuat untuk kebutuhan **assesment Frontend Engineer** serta studi kasus sistem manajemen rekrutmen dengan autentikasi dan dashboard berbeda tiap role.

---

## ✨ Fitur Utama

- 🔐 **Role-based Authentication (Super Admin, Admin, Candidate)**
- 👤 **Pendaftaran kandidat dengan Supabase Auth**
- 🧭 **Dashboard berbeda untuk tiap role**
- 📋 **CRUD Lowongan pekerjaan (Admin & Super Admin)**
- 📨 **Review & status lamaran kandidat**
- 📅 **Tanggal pembuatan & update otomatis**
- ⚙️ **Protected Route dengan Supabase Session**
- 🌙 **Mode pengembangan & deployment mudah ke Vercel**

---

## 💻 Cara Menjalankan Proyek

### 1️⃣ Clone Repository
```bash
git clone https://github.com/yourusername/hiring-portal.git
cd hiring-portal

npm install
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
npm run dev

Buka browser dan akses:
👉 http://localhost:3000

| Role                  | Email                             | Password                       | Akses       | Deskripsi                                                          |
| --------------------- | --------------------------------- | ------------------------------ | ----------- | ------------------------------------------------------------------ |
| 🧑‍💼 **Super Admin** | `superadmin@hiringportal.com`     | `@Admin123!`                   | 🔓 Penuh    | Membuat Admin, melihat semua kandidat, dan mengelola sistem.       |
| 👩‍💻 **Admin**       | `admin@hiringportal.com`          | `@Admin123!`                   | ⚙️ Terbatas | Mengelola lowongan, meninjau pelamar, memperbarui status lamaran.  |
| 🙋‍♂️ **Candidate**   | *(Daftar manual via `/register`)* | *(Password sesuai registrasi)* | 🧱 Dasar    | Mendaftar akun, melamar pekerjaan, dan memperbarui profil pribadi. |


| Role                  | Login URL                                                                          | Keterangan               |
| --------------------- | ---------------------------------------------------------------------------------- | ------------------------ |
| 🧑‍💼 **Super Admin** | [http://localhost:3000/super-admin/login](http://localhost:3000/super-admin/login) | Login Super Admin        |
| 👩‍💻 **Admin**       | [http://localhost:3000/admin/login](http://localhost:3000/admin/login)             | Login Admin              |
| 🙋‍♂️ **Candidate**   | [http://localhost:3000/login](http://localhost:3000/login)                         | Login kandidat umum      |
| 📝 **Register**       | [http://localhost:3000/register](http://localhost:3000/register)                   | Registrasi kandidat baru |


🗄️ Setup Database di Supabase

Masuk ke Supabase

Buat project baru.

Buka menu SQL Editor dan jalankan skrip berikut:

-- ENUM untuk role user
CREATE TYPE public.user_role AS ENUM (
    'super_admin',
    'admin',
    'candidate'
);

-- Tabel profil pengguna
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT UNIQUE,
    role public.user_role DEFAULT 'candidate',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aktifkan RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Kebijakan akses
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Admins and Super Admin can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid())
    IN ('admin', 'super_admin')
);

Tambahkan akun Super Admin manual melalui dashboard:

Masuk ke Supabase → Authentication → Users

Klik Add User

Isi:

Email: superadmin@hiringportal.com

Password: @Admin123!

Centang ✅ Confirm email

Salin UUID user yang dibuat

Jalankan query berikut di SQL Editor (ganti YOUR_SUPER_ADMIN_USER_ID):
INSERT INTO public.profiles (id, full_name, email, role)
VALUES (
  'YOUR_SUPER_ADMIN_USER_ID',
  'System Super Admin',
  'superadmin@hiringportal.com',
  'super_admin'
)
ON CONFLICT (id) DO NOTHING;

🧩 Flow Diagram (Role Interaction)

flowchart TD
    A[Candidate] -->|Melamar pekerjaan| B[Admin Review]
    B -->|Approve/Reject| C[Status Lamaran Diperbarui]
    D[Super Admin] -->|Membuat akun Admin| B
    D -->|Melihat seluruh laporan| E[Data Kandidat & Lowongan]

🧠 Best Practices & Security Notes

🔒 Super Admin hanya dibuat manual dan tidak dapat ditambahkan lewat UI.

🔐 Aktifkan verifikasi email dan reset password di Supabase.

⚙️ Jangan expose SUPABASE_SERVICE_ROLE_KEY di client.

🧱 Gunakan Row Level Security (RLS) untuk membatasi akses data antar pengguna.

🧩 Terapkan role-based routing di Next.js agar setiap user hanya mengakses dashboard sesuai perannya.

📊 Gunakan trigger Supabase untuk otomatis membuat profil setiap user baru.

🧰 Tech Stack
| Teknologi                                       | Fungsi                                     |
| ----------------------------------------------- | ------------------------------------------ |
| [Next.js 14+](https://nextjs.org/)              | Framework React modern untuk fullstack app |
| [Supabase](https://supabase.com/)               | Backend-as-a-Service (Auth + Database)     |
| [TypeScript](https://www.typescriptlang.org/)   | Static typing dan maintainability          |
| [Tailwind CSS](https://tailwindcss.com/)        | Styling cepat & responsif                  |
| [React Hook Form](https://react-hook-form.com/) | Validasi form yang ringan                  |
| [Lucide Icons](https://lucide.dev/)             | Ikon ringan & modern                       |


🧩 Deployment ke Vercel

Buka Vercel

Login menggunakan akun GitHub

Klik New Project → pilih repository ini

Tambahkan environment variable Supabase (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)

Klik Deploy

Aplikasi akan otomatis tersedia di domain seperti:
🌐 https://hiring-webapps.vercel.app


Output Saat Menjalankan npm run dev

> hiring-portal@1.0.0 dev
> next dev

ready - started server on http://localhost:3000
info  - Loaded env from .env.local
info  - Compiled successfully


Developed by Rafi Oktavian
📧 LinkedIn : https://www.linkedin.com/in/rafi-oktavian

💼 Portfolio: https://rafioktavian.github.io/portfolio/