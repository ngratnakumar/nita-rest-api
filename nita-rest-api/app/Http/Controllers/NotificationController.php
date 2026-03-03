<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $perPage = min(max((int) $request->input('per_page', 20), 1), 100);
        $all = $request->boolean('all');

        $query = $request->user()
            ->notifications()
            ->orderByDesc('created_at');

        return $all ? $query->get() : $query->paginate($perPage);
    }

    public function markRead(Request $request, DatabaseNotification $notification)
    {
        if ($notification->notifiable_id !== $request->user()->id || $notification->notifiable_type !== get_class($request->user())) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if (!$notification->read_at) {
            $notification->markAsRead();
        }

        return response()->json(['status' => 'ok']);
    }

    public function markAllRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();
        return response()->json(['status' => 'ok']);
    }
}
