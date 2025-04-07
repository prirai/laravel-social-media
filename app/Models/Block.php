<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Hash;

class Block extends Model
{
    protected $fillable = [
        'index',
        'timestamp',
        'data',
        'previous_hash',
        'hash',
    ];

    protected $casts = [
        'data' => 'array',
        'timestamp' => 'datetime',
    ];

    public static function createBlock(array $data): self
    {
        $previousBlock = self::latest()->first();
        $index = $previousBlock ? $previousBlock->index + 1 : 0;
        $timestamp = now();
        $previousHash = $previousBlock ? $previousBlock->hash : '0';

        $block = new self([
            'index' => $index,
            'timestamp' => $timestamp,
            'data' => $data,
            'previous_hash' => $previousHash,
        ]);

        $block->hash = $block->calculateHash();
        $block->save();

        return $block;
    }

    public function calculateHash(): string
    {
        return hash('sha256', json_encode([
            'index' => $this->index,
            'timestamp' => $this->timestamp,
            'data' => $this->data,
            'previous_hash' => $this->previous_hash,
        ]));
    }

    public function isValid(): bool
    {
        if ($this->hash !== $this->calculateHash()) {
            return false;
        }

        if ($this->index === 0) {
            return true;
        }

        $previousBlock = self::where('index', $this->index - 1)->first();
        if (!$previousBlock || $this->previous_hash !== $previousBlock->hash) {
            return false;
        }

        return true;
    }
} 