<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MarketplaceController extends Controller
{
    public function index()
    {
        $listings = Listing::with('seller')
            ->latest()
            ->get()
            ->map(function ($listing) {
                return [
                    'id' => $listing->id,
                    'title' => $listing->title,
                    'price' => $listing->price,
                    'description' => $listing->description,
                    'images' => $listing->images,
                    'category' => $listing->category,
                    'seller' => [
                        'name' => $listing->seller->name,
                        'avatar' => $listing->seller->avatar,
                    ],
                    'created_at' => $listing->created_at,
                ];
            });

        return Inertia::render('marketplace', [
            'listings' => $listings
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'category' => 'required|string',
            'description' => 'required|string',
            'images.*' => 'image|max:5120', // 5MB max per image
        ]);

        $images = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('marketplace', 'public');
                $images[] = '/storage/' . $path;
            }
        }

        $listing = Listing::create([
            'user_id' => auth()->id(),
            'title' => $validated['title'],
            'price' => $validated['price'],
            'category' => $validated['category'],
            'description' => $validated['description'],
            'images' => $images,
        ]);

        return redirect()->route('marketplace.index');
    }
} 