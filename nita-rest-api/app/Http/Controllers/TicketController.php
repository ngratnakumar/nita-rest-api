<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\TicketAttachment;
use App\Models\TicketComment;
use App\Models\TicketApproval;
use App\Models\User;
use App\Notifications\TicketUpdateNotification;
use Illuminate\Support\Facades\DB;
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
        'reopened',
    ];

    private function isClosed(Ticket $ticket): bool
    {
        return $ticket->status === 'closed';
    }

    private function isIt(User $user): bool
    {
        $roleNames = $user->roles()->pluck('name')->map(fn ($n) => strtolower($n))->all();
        return collect($roleNames)->contains(fn ($n) => in_array($n, ['admin', 'it team'], true));
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $perPage = min(max((int) $request->input('per_page', 20), 1), 100);
        $all = $request->boolean('all');
        $query = Ticket::with([
            'creator:id,username,name',
            'assignee:id,username,name',
            'attachments',
            'comments.user:id,username,name',
            'approvals.requester:id,username,name',
            'approvals.approver:id,username,name',
        ]);

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

        if ($all) {
            return $query->get();
        }

        return $query->paginate($perPage);
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
        return $ticket->load([
            'creator:id,username,name',
            'assignee:id,username,name',
            'attachments',
            'comments.user:id,username,name',
            'approvals.requester:id,username,name',
            'approvals.approver:id,username,name',
        ]);
    }

    public function comment(Request $request, Ticket $ticket)
    {
        $user = $request->user();
        if (!$this->canView($user, $ticket)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($this->isClosed($ticket)) {
            return response()->json(['message' => 'Ticket is closed. Ask the requester to reopen before adding updates.'], 422);
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
        $this->notifyTicketUsers($ticket, $user, 'New comment', "New comment on ticket #{$ticket->id}", [
            'ticket_id' => $ticket->id,
            'kind' => 'comment',
        ]);

        return response()->json($comment->load('user:id,username,name'), 201);
    }

    public function updateStatus(Request $request, Ticket $ticket)
    {
        $user = $request->user();
        if (!$this->canWork($user, $ticket)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($this->isClosed($ticket)) {
            return response()->json(['message' => 'Ticket is closed. Requester must reopen it before updates.'], 422);
        }

        $data = $request->validate([
            'status' => ['required', Rule::in(self::STATUSES)],
        ]);

        $ticket->update(['status' => $data['status']]);

        $this->notifyTicketUsers($ticket, $user, 'Status updated', "Ticket #{$ticket->id} status changed to {$data['status']}", [
            'ticket_id' => $ticket->id,
            'status' => $data['status'],
            'kind' => 'status',
        ]);

        return $ticket->fresh(['creator:id,username,name', 'assignee:id,username,name']);
    }

    public function assign(Request $request, Ticket $ticket)
    {
        $user = $request->user();
        if (!$this->isIt($user)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($this->isClosed($ticket)) {
            return response()->json(['message' => 'Ticket is closed. Requester must reopen it before updates.'], 422);
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

    public function reopen(Request $request, Ticket $ticket)
    {
        $user = $request->user();
        if ($ticket->user_id !== $user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if (!in_array($ticket->status, ['done', 'closed'], true)) {
            return response()->json(['message' => 'Only closed/done tickets can be reopened'], 422);
        }

        $ticket->update(['status' => 'reopened']);

        $this->notifyTicketUsers($ticket, $user, 'Ticket reopened', "Ticket #{$ticket->id} was reopened", [
            'ticket_id' => $ticket->id,
            'status' => 'reopened',
            'kind' => 'reopened',
        ]);

        return $ticket->fresh(['creator:id,username,name', 'assignee:id,username,name', 'approvals.requester:id,username,name', 'approvals.approver:id,username,name']);
    }

    public function handlers()
    {
        $handlers = User::whereHas('roles', function ($q) {
            $q->whereIn(DB::raw('LOWER(name)'), ['it team', 'admin']);
        })->select('id', 'name', 'username')->get();

        return $handlers;
    }

    public function approvers()
    {
        $user = auth()->user();
        if (!$this->isIt($user)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return User::select('id', 'name', 'username')->orderBy('name')->get();
    }

    public function requestApproval(Request $request, Ticket $ticket)
    {
        $user = $request->user();
        if (!$this->isIt($user)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($this->isClosed($ticket)) {
            return response()->json(['message' => 'Ticket is closed. Requester must reopen it before updates.'], 422);
        }

        $data = $request->validate([
            'approver_id' => ['required', 'exists:users,id'],
            'note' => ['nullable', 'string'],
        ]);

        $approval = TicketApproval::create([
            'ticket_id' => $ticket->id,
            'requester_id' => $user->id,
            'approver_id' => $data['approver_id'],
            'status' => 'pending',
            'request_note' => $data['note'] ?? null,
        ]);

        $approver = User::find($data['approver_id']);
        if ($approver) {
            $this->notifyUsers([$approver], 'Approval requested', "Ticket #{$ticket->id} needs your approval", [
                'ticket_id' => $ticket->id,
                'approval_id' => $approval->id,
                'kind' => 'approval_request',
            ]);
        }

        return response()->json($approval->load(['requester:id,username,name', 'approver:id,username,name']), 201);
    }

    public function decideApproval(Request $request, Ticket $ticket, TicketApproval $approval)
    {
        $user = $request->user();

        if ($approval->ticket_id !== $ticket->id) {
            return response()->json(['message' => 'Invalid approval'], 400);
        }

        if ($approval->approver_id !== $user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($this->isClosed($ticket)) {
            return response()->json(['message' => 'Ticket is closed. Requester must reopen it before updates.'], 422);
        }

        $data = $request->validate([
            'status' => ['required', Rule::in(['approved', 'rejected'])],
            'note' => ['nullable', 'string'],
        ]);

        $approval->update([
            'status' => $data['status'],
            'decision_note' => $data['note'] ?? null,
            'decided_at' => now(),
        ]);

        $ticket = $ticket->fresh();
        $this->notifyTicketUsers($ticket, $user, 'Approval decision', "Approval {$data['status']} for ticket #{$ticket->id}", [
            'ticket_id' => $ticket->id,
            'approval_id' => $approval->id,
            'kind' => 'approval_decision',
            'decision' => $data['status'],
        ], [$approval->requester, $ticket->creator, $ticket->assignee]);

        return $approval->fresh(['requester:id,username,name', 'approver:id,username,name']);
    }

    private function canView(User $user, Ticket $ticket): bool
    {
        if ($ticket->user_id === $user->id || $this->isIt($user)) {
            return true;
        }

        // Approvers can view tickets they've been asked to approve
        return $ticket->approvals()->where('approver_id', $user->id)->exists();
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

    private function notifyUsers(array $users, string $title, string $message, array $data = []): void
    {
        $unique = collect($users)
            ->filter()
            ->unique('id');

        foreach ($unique as $recipient) {
            $recipient->notify(new TicketUpdateNotification([
                'title' => $title,
                'message' => $message,
                'ticket_id' => $data['ticket_id'] ?? null,
                'approval_id' => $data['approval_id'] ?? null,
                'kind' => $data['kind'] ?? 'update',
                'status' => $data['status'] ?? null,
                'decision' => $data['decision'] ?? null,
            ]));
        }
    }

    private function notifyTicketUsers(Ticket $ticket, User $actor, string $title, string $message, array $data = [], ?array $overrides = null): void
    {
        $targets = $overrides ?? [$ticket->creator, $ticket->assignee];
        $targets = collect($targets)
            ->filter(fn ($u) => $u && $u->id !== $actor->id)
            ->all();

        $this->notifyUsers($targets, $title, $message, $data + ['ticket_id' => $ticket->id]);
    }
}
