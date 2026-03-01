<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->boolean('is_maintenance')->default(false)->after('icon');
            $table->text('maintenance_message')->nullable()->after('is_maintenance');
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn('is_maintenance');
            $table->dropColumn('maintenance_message');
        });
    }
};
