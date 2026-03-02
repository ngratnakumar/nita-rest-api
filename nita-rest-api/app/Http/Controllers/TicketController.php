<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\TicketAttachment;
use App\Models\TicketComment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class TicketController extends Controller
{
    private const STATUSES = [
        'new',
        'assigned',
        'info',
        'working',
        'testing',
        'done',
        'closed',
    ];

    private function isIt(User $user): bool
    {
        return $user->roles()->whereIn('name', ['admin', 'IT Team'])->exists();
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $query = Ticket::with(['creator:id,username,name', 'assignee:id,username,name', 'attachments', 'comments.user:id,username,name']);

        if ($this->isIt($user)) {
            $status = $request->string('status');
            $assigneeId = $request->integer('assignee_id');
            $hideClosed = $request->boolean('hide_closed');
            $unassignedOnly = $request->boolean('unassigned');
            $creatorId = $request->integer('creator_id');
            $category = $request->string('category');
            $period = $request->string('period');
            $sortBy = $request->string('sort_by')->lower() ?: 'updated_at';
            $sortDir = $request->string('sort_dir')->lower() === 'asc' ? 'asc' : 'desc';

            if ($status->isNotEmpty()) {
                $query->where('status', $status);
            }

            if ($assigneeId) {
                $query->where('assignee_id', $assigneeId);
            }

            if ($creatorId) {
                $query->where('user_id', $creatorId);
            }

            if ($unassignedOnly) {
                $query->whereNull('assignee_id');
            }

            if ($hideClosed) {
                $query->whereNotIn('status', ['done', 'closed']);
            }

            if ($category->isNotEmpty()) {
                $query->whereHas('service', function ($q) use ($category) {
                    $q->where('category', $category);
                });
            }

            if ($period->isNotEmpty()) {
                $dateFrom = match ($period->toString()) {
                    'last7' => Carbon::now()->subDays(7),
                    'last30' => Carbon::now()->subDays(30),
                    'last365' => Carbon::now()->subDays(365),
                    default => null,
                };
                if ($dateFrom) {
                    $query->whereDate('created_at', '>=', $dateFrom->toDateString());
                }
            }

            $allowedSorts = ['updated_at', 'created_at', 'status'];
            if (!in_array($sortBy, $allowedSorts, true)) {
                $sortBy = 'updated_at';
            }
            $query->orderBy($sortBy, $sortDir);
        } else {
            $query->where('user_id', $user->id);
            $query->orderBy('updated_at', 'desc');
        }

        return $query->paginate(20);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'service_id' => ['required', 'exists:services,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'attachments.*' => ['file', 'mimes:png,jpg,jpeg,svg,pdf', 'max:20480'], // 20MB
        ]);

        $ticket = Ticket::create([
            'user_id' => $user->id,
            'service_id' => $data['service_id'],
            'title' => $data['title'],
            'description' => $data['description'],
            'status' => 'new',
        ]);

        $this->storeAttachments($request, $ticket, $user);

        return $ticket->load(['creator:id,username,name', 'assignee:id,username,name', 'attachments']);
    }

    public function show(Request $request, Ticket $ticket)
    {
        $user = $request->user();
        if (!$this->canView($user, $ticket)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        return $ticket->load(['creator:id,username,name', 'assignee:id,username,name', 'attachments', 'comments.user:id,username,name']);
    }

    public function comment(Request $request, Ticket $ticket)
    {
        $user = $request->user();
        if (!$this->canView($user, $ticket)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'body' => ['nullable', 'string'],
            'attachments.*' => ['file', 'mimes:png,jpg,jpeg,svg,pdf', 'max:20480'],
        ]);

        if (empty($data['body']) && !$request->hasFile('attachments')) {
            return response()->json(['message' => 'Add a comment or an attachment'], 422);
        }

        $comment = TicketComment::create([
            'ticket_id' => $ticket->id,
            'user_id' => $user->id,
            'body' => $data['body'] ?? null,
        ]);

        $this->storeAttachments($request, $ticket, $user);

        return $comment->load('user:id,username,name');
    }

    public function updateStatus(Request $request, Ticket $ticket)
    {
        $user = $request->user();
        if (!$this->canWork($user, $ticket)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'status' => ['required', Rule::in(self::STATUSES)],
        ]);

        $ticket->update(['status' => $data['status']]);

        return $ticket->fresh(['creator:id,username,name', 'assignee:id,username,name']);
    }

    public function assign(Request $request, Ticket $ticket)
    {
        $user = $request->user();
        if (!$this->isIt($user)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'assignee_id' => ['nullable', 'exists:users,id'],
        ]);

        $ticket->update([
            'assignee_id' => $data['assignee_id'] ?? null,
            'status' => $data['assignee_id'] ? 'assigned' : $ticket->status,
        ]);

        return $ticket->fresh(['creator:id,username,name', 'assignee:id,username,name']);
    }

    public function handlers()
    {
        $handlers = User::whereHas('roles', function ($q) {
            $q->whereIn('name', ['IT Team', 'admin']);
        })->select('id', 'name', 'username')->get();

        return $handlers;
    }

    private function canView(User $user, Ticket $ticket): bool
    {
        return $ticket->user_id === $user->id || $this->isIt($user);
    }

    private function canWork(User $user, Ticket $ticket): bool
    {
        return $this->isIt($user) || $ticket->assignee_id === $user->id;
    }

    private function storeAttachments(Request $request, Ticket $ticket, User $user): void
    {
        if (!$request->hasFile('attachments')) {
            return;
        }

        $files = $request->file('attachments');
        if (!is_array($files)) {
            $files = [$files];
        }

        foreach ($files as $file) {
            $stored = $file->store('ticket_attachments', 'public');
            TicketAttachment::create([
                'ticket_id' => $ticket->id,
                'user_id' => $user->id,
                'path' => $stored,
                'original_name' => $file->getClientOriginalName(),
                'mime_type' => $file->getClientMimeType(),
                'size' => $file->getSize(),
            ]);
        }
    }
}
