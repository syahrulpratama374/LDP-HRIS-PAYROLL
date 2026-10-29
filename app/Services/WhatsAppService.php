<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use App\Models\Pengaturan;

class WhatsAppService
{
    public static function sendNotification($targetPhone, $message)
    {
        $apiKey = Pengaturan::where('kunci', 'fonnte_api_key')->value('nilai');

        if (!$apiKey || !$targetPhone) {
            return false;
        }

        return Http::withHeaders([
            'Authorization' => $apiKey,
        ])->post('https://api.fonnte.com/send', [
            'target'  => $targetPhone,
            'message' => $message,
        ]);
    }
}