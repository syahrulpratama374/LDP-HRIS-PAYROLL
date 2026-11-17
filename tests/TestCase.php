<?php

namespace Tests;

use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Proteksi CSRF/origin Laravel 13 tidak dilewati otomatis saat test; matikan agar POST test tidak 419
        $this->withoutMiddleware(PreventRequestForgery::class);
    }
}
