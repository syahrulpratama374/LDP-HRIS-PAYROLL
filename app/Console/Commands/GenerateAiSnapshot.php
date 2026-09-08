<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class GenerateAiSnapshot extends Command
{
    protected $signature = 'ai:snapshot';
    protected $description = 'Generate AI_CONTEXT.md berisi state terbaru project untuk konteks LLM';

    public function handle()
    {
        $this->info('Memulai snapshot project untuk AI...');
        $outputFile = base_path('AI_CONTEXT.md');$content = "# AI_CONTEXT: LDP HRIS & PAYROLL\n";
        $content .= "> Dibuat pada: " . now()->format('Y-m-d H:i:s') . "\n\n";

        // 1. Snapshot Versi & Dependensi
        $content .= "## 1. TECH STACK & DEPENDENCIES\n";
        $content .= "### Composer (Backend)\n```json\n";
        $composer = json_decode(File::get(base_path('composer.json')), true);
        $content .= json_encode($composer['require'] ?? [], JSON_PRETTY_PRINT) . "\n```\n";
        
        $content .= "### NPM (Frontend)\n```json\n";
        $npm = json_decode(File::get(base_path('package.json')), true);
        $content .= json_encode($npm['dependencies'] ?? [], JSON_PRETTY_PRINT) . "\n```\n\n";

        // 2. Snapshot Struktur Direktori (Dibatasi agar token AI tidak meledak)
        $content .= "## 2. STRUKTUR DIREKTORI (App, Routes, Database)\n```text\n";
        $content .= $this->generateTree(base_path('app'), 0, 3);
        $content .= $this->generateTree(base_path('routes'), 0, 2);
        $content .= $this->generateTree(base_path('database/migrations'), 0, 1);
        $content .= $this->generateTree(base_path('resources/js/Pages'), 0, 3);
        $content .= "```\n\n";

        // 3. Snapshot Rute Aktif
        $content .= "## 3. ACTIVE ROUTES\n```text\n";
        Artisan::call('route:list --path=api,web');
        // Filter output route agar bersih dari vendor route
        $routes = explode("\n", Artisan::output());
        $cleanRoutes = array_filter($routes, fn($r) => !str_contains($r, '_ignition') && !str_contains($r, 'sanctum'));
        $content .= implode("\n", $cleanRoutes) . "\n```\n\n";

        // 4. Snapshot Skema Database (Tabel & Kolom)
        $content .= "## 4. DATABASE SCHEMA (Real-time)\n";
        try {
            $tables = DB::select('SHOW TABLES');$dbName = 'Tables_in_' . env('DB_DATABASE');
            foreach ($tables as $table) {$tableName = $table->$dbName;
                // Abaikan tabel bawaan laravel agar rapi
                if (in_array($tableName, ['migrations', 'failed_jobs', 'password_reset_tokens', 'sessions', 'cache', 'cache_locks', 'jobs', 'job_batches'])) continue;
                
                $content .= "### Tabel: `{$tableName}`\n```text\n";
                $columns = DB::select("DESCRIBE {$tableName}");
                foreach ($columns as$col) {
                    $content .= "- {$col->Field} ({$col->Type}) " . ($col->Null === 'YES' ? '[Nullable]' : '') . "\n";
                }
                $content .= "```\n";
            }
        } catch (\Exception $e) {
            $content .= "> Gagal memuat database: " . $e->getMessage() . "\n";
        }

        File::put($outputFile, $content);
        $this->info("Snapshot berhasil! File AI_CONTEXT.md telah dibuat/diperbarui.");
    }

    /**
     * Helper untuk membuat Tree direktori yang ramah LLM
     */
    private function generateTree($dir, $depth = 0, $maxDepth = 3)
    {
        if (!File::exists($dir) || $depth > $maxDepth) return "";
        $out = "";
        $files = array_diff(scandir($dir), ['.', '..']);
        $dirName = basename($dir);
        
        if ($depth === 0) $out .= "[$dirName/]\n";
        
        foreach ($files as $file) {
            $path = $dir . '/' . $file;
            $indent = str_repeat("  ", $depth + 1) . "├── ";
            if (is_dir($path)) {
                $out .= $indent . $file . "/\n";
                $out .= $this->generateTree($path, $depth + 1, $maxDepth);
            } else {
                $out .= $indent . $file . "\n";
            }
        }
        return $out;
    }
}