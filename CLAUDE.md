# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

LDP HRIS & Payroll — an internal HR/payroll system (Indonesian domain language throughout: *karyawan* = employee, *cuti* = leave, *lembur* = overtime, *pinjaman/kasbon* = loan, *SPJ* = travel expense claim, *surat keluar/masuk* = outgoing/incoming letters, *absensi* = attendance). Code comments, UI text, flash messages and commit messages are in Indonesian; keep new code consistent with that.

Stack: Laravel 13 (PHP 8.3+), Inertia v2 + React 18 (JSX, no TypeScript), Tailwind 3, Vite, Ziggy for named routes in JS, DomPDF for PDFs, simple-qrcode, intervention/image. Scaffolded from Laravel Breeze.

## Commands

```sh
composer setup                 # install, .env, key, migrate, npm build
composer dev                   # runs `php artisan dev` (server + vite etc.)
npm run dev / npm run build    # Vite only
php artisan migrate:fresh --seed
php artisan db:seed --class=MenuSeeder   # NOT called by DatabaseSeeder — run it separately or the sidebar/permissions are empty

composer test                  # config:clear + php artisan test
php artisan test --filter=ProfileTest     # single test class / method
vendor/bin/pint                # PHP formatter (no JS linter configured)

php artisan ldp:daily-automation   # scheduled daily 00:00 (routes/console.php)
php artisan ai:snapshot            # regenerates AI_CONTEXT.md (dir tree, routes, live DB schema)
```

Docker: `docker-compose up` brings up `app` (php-fpm), nginx on :8000, MySQL 8 (`ldp_hris_payroll`, root/root), Redis, and a Vite container on :5173. The local `.env` uses `DB_HOST=mysql`, so artisan commands touching the DB must run inside the `app` container (`docker exec -it ldp_app php artisan ...`). Tests use in-memory SQLite (phpunit.xml) and currently only cover Breeze auth/profile.

`AI_CONTEXT.md` contains a generated dump of every table's columns — check it for schema before reading migrations (regenerate with `ai:snapshot` if stale).

## Architecture

### Authorization is database-driven (menus ↔ roles)
- All app routes live in `routes/web.php` inside one `['auth', 'verified', 'dynamic.role']` group. Public exceptions: asset QR scan (`/scan-aset/{kode}`) and letter verification (`/verifikasi/surat/{uuid}`, `/v/{uuid}`).
- `App\Http\Middleware\DynamicRolePermission` allows a request only if the current **route name** exists in the `menus` table and is attached to the user's role (`role_has_menus` pivot). If no exact match, it falls back to a `LIKE '<prefix>%'` match on the first segment of the route name (e.g. any `karyawan.*` menu grants all `karyawan.*` routes). Unnamed routes bypass the check; `role_id === 1` (Admin) bypasses everything.
- Consequence: **every new route must be named**, and needs a menu row (via `MenuSeeder` or the Role Management UI at `admin.role.index`) sharing its name prefix, or non-admins get 403.
- `HandleInertiaRequests` shares `auth.user` (with `role`, `karyawan.departemen`, `karyawan.jabatan`) and `auth.menus` (the role's active menu tree) to every page; the layout sidebar renders from `auth.menus`. Flash keys: `success`, `error`.
- Role IDs are hard-coded in controllers (from `UserRoleSeeder`): 1 Admin, 2 Direktur, 3 HC, 4 Finance, 5 Supervisor, 6 Karyawan. A common pattern is `if ($user->role_id == 5)` to scope lists to the supervisor's subordinates (`karyawans.atasan_id`). `CheckRole` (`role:1,4`) and `IsAdmin` middleware also exist.

### Users vs. employees
`User` (login, `role_id`) has one `Karyawan` (HR profile: departemen, jabatan, golongan, PTKP, atasan). Most business tables key on `karyawan_id`, not `user_id`; Admin users may have no karyawan, and controllers special-case that.

### Request/approval flows
- ESS routes (`cuti`, `lembur`, `pinjaman`, `spj`, `it-ticket`, `logbook-shift`, `absensi/karyawan`) are employee-facing; the matching `admin.*` routes under `/admin` are the approval side, usually `adminIndex` + `updateStatus` in the **same controller**.
- `Approval` is polymorphic (`approvable` morph to Cuti/Lembur/SPJ). `DelegasiWewenang` lets an approver delegate authority.
- E-letter (`Persuratan/SuratKeluarController`) has its own multi-step approval chain (`ApprovalSuratKeluar`, `RuteApprovalTemplate`, `RiwayatSuratApproval`) with signature images, QR verification by UUID, templates (`MasterTemplateSurat`) and print layout settings (`PengaturanSuratLayout`), rendered to PDF via DomPDF Blade views.
- Changes are logged to `AuditTrail` from controllers explicitly (no observer).

### Payroll
`PayrollController@generate` builds `Payroll` + `DetailPayroll` rows per active karyawan per month/year inside a transaction, from `MasterKomponenPayroll`, PTKP, attendance lateness, approved overtime and loan installments (`CicilanPinjaman`). Only `Draft` payrolls are regenerated; `finalize` makes them immutable.

### Runtime settings
`Pengaturan` is a key/value table (`kunci`/`nilai`) read at runtime for business parameters (e.g. `denda_terlambat`, `tarif_lembur_per_jam`, `fonnte_api_key`). `App\Services\WhatsAppService::sendNotification` sends WhatsApp messages via Fonnte using that key.

### Frontend
Pages resolve from `resources/js/Pages/**/{Name}.jsx` via `Inertia::render('Folder/Name')`. Layouts in `resources/js/Layouts` (`AuthenticatedLayout`, `AdminLayout`); shared components in `resources/js/Components`; icons from `lucide-react`; `Utils/formatRupiah.js` for currency. Use Ziggy's `route('name')` for URLs.
