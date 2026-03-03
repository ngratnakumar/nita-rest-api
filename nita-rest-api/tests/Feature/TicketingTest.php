<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\Service;
use App\Models\Ticket;
use App\Models\TicketApproval;
use App\Models\TicketComment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TicketingTest extends TestCase
{
    use RefreshDatabase;

    private function userWithRoles(array $roles = []): User
    {
        $user = User::factory()->create();
        foreach ($roles as $roleName) {
            $role = Role::firstOrCreate(['name' => $roleName]);
            $user->roles()->syncWithoutDetaching($role->id);
        }
        return $user;
    }

    private function makeTicket(User $creator): Ticket
    {
        $service = Service::create([
            'name' => 'Email',
            'slug' => 'email-' . uniqid(),
            'url' => 'https://service.local',
            'category' => 'General',
            'icon' => 'Activity',
        ]);

        return Ticket::create([
            'user_id' => $creator->id,
            'service_id' => $service->id,
            'title' => 'Printer down',
            'description' => 'Cannot print invoices',
            'status' => 'new',
        ]);
    }

    public function test_it_user_can_request_and_decide_approval(): void
    {
        $itUser = $this->userWithRoles(['IT Team']);
        $approver = $this->userWithRoles([]);
        $creator = $this->userWithRoles([]);
        $ticket = $this->makeTicket($creator);

        Sanctum::actingAs($itUser);
        $requestResponse = $this->postJson("/api/tickets/{$ticket->id}/approvals", [
            'approver_id' => $approver->id,
            'note' => 'Need approval',
        ]);

        $requestResponse->assertStatus(201)->assertJsonFragment([
            'status' => 'pending',
            'approver_id' => $approver->id,
            'requester_id' => $itUser->id,
        ]);

        $approvalId = $requestResponse->json('id');
        $this->assertDatabaseHas('ticket_approvals', [
            'id' => $approvalId,
            'ticket_id' => $ticket->id,
            'status' => 'pending',
        ]);

        Sanctum::actingAs($approver);
        $decision = $this->postJson("/api/tickets/{$ticket->id}/approvals/{$approvalId}/decision", [
            'status' => 'approved',
            'note' => 'All good',
        ]);

        $decision->assertStatus(200)->assertJsonFragment([
            'status' => 'approved',
            'decision_note' => 'All good',
        ]);

        $this->assertDatabaseHas('ticket_approvals', [
            'id' => $approvalId,
            'status' => 'approved',
        ]);
    }

    public function test_non_it_cannot_request_approvals_or_list_approvers(): void
    {
        $creator = $this->userWithRoles([]);
        $ticket = $this->makeTicket($creator);

        Sanctum::actingAs($creator);
        $this->getJson('/api/tickets/approvers')->assertStatus(403);
        $this->postJson("/api/tickets/{$ticket->id}/approvals", [
            'approver_id' => $creator->id,
        ])->assertStatus(403);
    }

    public function test_approver_can_view_ticket_even_if_not_creator_or_it(): void
    {
        $creator = $this->userWithRoles([]);
        $approver = $this->userWithRoles([]);
        $ticket = $this->makeTicket($creator);

        TicketApproval::create([
            'ticket_id' => $ticket->id,
            'requester_id' => $creator->id,
            'approver_id' => $approver->id,
            'status' => 'pending',
        ]);

        Sanctum::actingAs($approver);
        $response = $this->getJson("/api/tickets/{$ticket->id}");
        $response->assertOk()->assertJsonFragment([
            'id' => $ticket->id,
            'title' => 'Printer down',
        ]);
    }

    public function test_creator_can_add_comment(): void
    {
        $creator = $this->userWithRoles([]);
        $ticket = $this->makeTicket($creator);

        Sanctum::actingAs($creator);
        $response = $this->postJson("/api/tickets/{$ticket->id}/comment", [
            'body' => 'Please update soon',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('ticket_comments', [
            'ticket_id' => $ticket->id,
            'user_id' => $creator->id,
            'body' => 'Please update soon',
        ]);
    }

    public function test_it_sees_all_tickets_regular_sees_own(): void
    {
        $creatorA = $this->userWithRoles([]);
        $creatorB = $this->userWithRoles([]);
        $itUser = $this->userWithRoles(['IT Team']);

        $ticketA = $this->makeTicket($creatorA);
        $ticketB = $this->makeTicket($creatorB);

        Sanctum::actingAs($creatorA);
        $regularList = $this->getJson('/api/tickets');
        $regularList->assertOk();
        $this->assertCount(1, $regularList->json('data'));
        $this->assertEquals($ticketA->id, $regularList->json('data.0.id'));

        Sanctum::actingAs($itUser);
        $itList = $this->getJson('/api/tickets');
        $itList->assertOk();
        $this->assertCount(2, $itList->json('data'));
    }

    public function test_creator_can_reopen_closed_ticket(): void
    {
        $creator = $this->userWithRoles([]);
        $ticket = $this->makeTicket($creator);
        $ticket->update(['status' => 'closed']);

        Sanctum::actingAs($creator);
        $response = $this->postJson("/api/tickets/{$ticket->id}/reopen");

        $response->assertOk()->assertJsonFragment([
            'status' => 'reopened',
        ]);
    }

    public function test_notifications_for_approval_and_comment(): void
    {
        $itUser = $this->userWithRoles(['IT Team']);
        $approver = $this->userWithRoles([]);
        $creator = $this->userWithRoles([]);
        $ticket = $this->makeTicket($creator);

        Sanctum::actingAs($itUser);
        $this->postJson("/api/tickets/{$ticket->id}/approvals", [
            'approver_id' => $approver->id,
            'note' => 'Need approval',
        ])->assertStatus(201);

        Sanctum::actingAs($approver);
        $notifications = $this->getJson('/api/notifications');
        $notifications->assertOk();
        $this->assertGreaterThan(0, $notifications->json('data') ? count($notifications->json('data')) : 0);

        $notificationId = $notifications->json('data.0.id');
        $this->postJson("/api/notifications/{$notificationId}/read")->assertOk();

        Sanctum::actingAs($creator);
        $this->postJson("/api/tickets/{$ticket->id}/comment", [
            'body' => 'Update please',
        ])->assertStatus(201);

        Sanctum::actingAs($creator);
        $this->postJson('/api/notifications/read-all')->assertOk();
    }
}
