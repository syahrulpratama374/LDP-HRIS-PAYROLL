<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    /** Root aplikasi mengarahkan tamu ke halaman login. */
    public function test_root_mengarahkan_ke_login(): void
    {
        $this->get('/')->assertRedirect(route('login'));
    }
}
