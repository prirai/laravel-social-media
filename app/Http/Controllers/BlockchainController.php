<?php

namespace App\Http\Controllers;

use App\Models\Block;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BlockchainController extends Controller
{
    public function index()
    {
        $blocks = Block::orderBy('index', 'desc')->get();
        $user = Auth::user();

        $verificationBlock = Block::where('data->type', 'verification')
            ->where('data->user_id', $user->id)
            ->where('data->action', 'user_verified')
            ->first();

        return inertia('Blockchain', [
            'blocks' => $blocks,
            'userVerificationStatus' => [
                'isVerified' => (bool) $verificationBlock,
                'verificationBlock' => $verificationBlock,
            ],
        ]);
    }

    public function verifyUser(User $user)
    {
        $block = Block::createBlock([
            'type' => 'verification',
            'action' => 'user_verified',
            'user_id' => $user->id,
            'details' => [
                'verified_by' => Auth::id(),
                'verification_type' => 'document',
                'timestamp' => now(),
            ],
        ]);

        return response()->json([
            'message' => 'User verification recorded on blockchain',
            'block' => $block,
        ]);
    }

    public function recordModeration($action, $userId, array $details = [])
    {
        $block = Block::createBlock([
            'type' => 'moderation',
            'action' => $action,
            'user_id' => $userId,
            'details' => array_merge($details, [
                'moderated_by' => Auth::id(),
                'timestamp' => now(),
            ]),
        ]);

        return $block;
    }

    public function recordListing($userId, array $details = [])
    {
        $block = Block::createBlock([
            'type' => 'listing',
            'action' => 'listing_created',
            'user_id' => $userId,
            'details' => array_merge($details, [
                'timestamp' => now(),
            ]),
        ]);

        return $block;
    }

    public function validateChain()
    {
        $blocks = Block::orderBy('index')->get();
        $isValid = true;
        $invalidBlocks = [];

        foreach ($blocks as $block) {
            if (!$block->isValid()) {
                $isValid = false;
                $invalidBlocks[] = $block->index;
            }
        }

        return response()->json([
            'isValid' => $isValid,
            'invalidBlocks' => $invalidBlocks,
            'totalBlocks' => $blocks->count(),
        ]);
    }
} 