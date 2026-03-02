<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Gate;

class MediaController extends Controller
{
    public function destroyIcon($filename) {
        Storage::disk('public')->delete('icons/' . $filename);
        return response()->json(['message' => 'Deleted']);
    }

    public function listIcons()
    {
        $files = Storage::disk('public')->files('icons');
        return response()->json(array_map('basename', $files));
    }

    public function upload(Request $request)
    {
        if (Gate::denies('manage-system')) {
            return response()->json(['message' => 'Only admins can upload icons'], 403);
        }

        $request->validate([
            'file' => 'required|image|mimes:png,jpg,jpeg,svg|max:2048',
        ]);

        if (!$request->hasFile('file')) {
            return response()->json(['message' => 'Upload failed: no file received'], 400);
        }

        $file = $request->file('file');

        // Build a safe, unique filename even if the client omits one
        $originalName = $file->getClientOriginalName() ?: 'icon.png';
        $nameOnly = Str::slug(pathinfo($originalName, PATHINFO_FILENAME)) ?: 'icon';
        $extension = strtolower($file->getClientOriginalExtension() ?: 'png');
        $finalName = $nameOnly . '-' . Str::random(6) . '.' . $extension;

        $path = $file->storeAs('icons', $finalName, 'public');

        if (!$path) {
            return response()->json(['message' => 'Upload failed: unable to write file'], 500);
        }

        return response()->json([
            'filename' => basename($path),
            'url' => Storage::url($path),
        ], 201);
    }

    public function destroy($filename)
    {
        if (Gate::denies('manage-system')) {
            return response()->json(['message' => 'Only admins can delete icons'], 403);
        }

        $path = 'icons/' . basename($filename);

        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
            return response()->json(['message' => 'Deleted']);
        }

        return response()->json(['message' => 'File not found'], 404);
    }
}