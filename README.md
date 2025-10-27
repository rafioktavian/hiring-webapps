# Hiring Portal

This is a Next.js project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

### 1. Setup Supabase

1.  Create a new project on [Supabase](https://supabase.com).
2.  Go to the **SQL Editor** in your Supabase project.
3.  Run the following SQL to create the `profiles` table and the `user_role` enum:

    ```sql
    -- Create the user_role ENUM type
    CREATE TYPE public.user_role AS ENUM (
        'super_admin',
        'admin',
        'candidate'
    );

    -- Create the profiles table
    CREATE TABLE public.profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        full_name TEXT,
        email TEXT UNIQUE,
        role public.user_role DEFAULT 'candidate',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Seed the Super Admin user
    -- IMPORTANT: First, create a user in Supabase Auth with the email 'superadmin@hiringportal.com'
    -- Then, get that user's UID from the 'users' table in the 'auth' schema.
    -- Replace 'YOUR_SUPER_ADMIN_USER_ID' with the actual UID.
    -- INSERT INTO public.profiles (id, full_name, email, role)
    -- VALUES ('YOUR_SUPER_ADMIN_USER_ID', 'System Super Admin', 'superadmin@hiringportal.com', 'super_admin')
    -- ON CONFLICT DO NOTHING;

    -- Enable RLS
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

    -- Policies for profiles table
    CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

    CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

    CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin') );

    ```
4.  **Important:** You must manually create the superadmin user in the Supabase Auth dashboard (`superadmin@hiringportal.com`), then find its ID and use it to run the seeding SQL script to assign the `super_admin` role.

### 2. Environment Variables

Create a `.env.local` file in the root of your project and add your Supabase project URL and anon key:

```bash
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```

You can find these in your Supabase project settings under "API".

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Login Credentials

-   **Super Admin:** `superadmin@hiringportal.com` / (password you set in Supabase) (*Current password :@Admin123!)
-   **Admin:** Create via the Super Admin dashboard.
-   **Candidate:** Register on the `/register` page.
