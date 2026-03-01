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

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $path = $file->storeAs('icons', $file->getClientOriginalName(), 'public');
            return response()->json(['filename' => basename($path)], 200);
        }
        return response()->json(['message' => 'Upload failed'], 400);
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