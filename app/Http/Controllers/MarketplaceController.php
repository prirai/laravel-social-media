<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class MarketplaceController extends Controller
{
    public function index()
    {
        $listings = Listing::with('seller')
            ->latest()
            ->get();

        // Debug the listings data
        \Log::info('Listings with sellers:', $listings->toArray());

        $formattedListings = $listings->map(function ($listing) {
            // Debug each listing's seller
            \Log::info('Processing listing ' . $listing->id . ' with seller:', [
                'seller_id' => $listing->seller_id,
                'seller' => $listing->seller
            ]);

            if (!$listing->seller) {
                \Log::warning('Missing seller for listing:', [
                    'listing_id' => $listing->id,
                    'seller_id' => $listing->seller_id
                ]);
            }

            return [
                'id' => $listing->id,
                'title' => $listing->title,
                'price' => $listing->price,
                'description' => $listing->description,
                'images' => $listing->images ?? [],
                'category' => $listing->category,
                'status' => $listing->status ?? 'unverified',
                'seller' => $listing->seller ? [
                    'name' => $listing->seller->name,
                    'username' => $listing->seller->username,
                    'avatar' => $listing->seller->avatar,
                    'verification_status' => $listing->seller->verification_status,
                ] : null,
                'created_at' => $listing->created_at,
            ];
        });

        return Inertia::render('marketplace', [
            'listings' => $formattedListings,
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ]);
    }

    public function store(Request $request)
    {

        if (auth()->user()->verification_status !== 'verified') {
            return redirect()->back()->with('error', 'You must verify your documents before posting a listing.');
        }
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'category' => 'required|string',
            'description' => 'required|string',
            'images' => 'array|max:5', // Maximum 5 images
            'images.*' => 'image|max:5120', // 5MB max
        ]);

        $images = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = $image->store('marketplace', 'public');
                $images[] = '/storage/' . $path;
            }
        }

        $listing = Listing::create([
            'title' => $validated['title'],
            'price' => $validated['price'],
            'category' => $validated['category'],
            'description' => $validated['description'],
            'user_id' => auth()->id(),
            'status' => 'unverified',
            'images' => $images,
        ]);

        return redirect()->route('marketplace.index')
            ->with('success', 'Listing created successfully!');
    }

    public function destroy(Listing $listing)
    {
        // Check if the user owns the listing
        if ($listing->user_id !== auth()->id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Delete the listing's images from storage
        if ($listing->images) {
            foreach ($listing->images as $image) {
                $path = str_replace('/storage/', '', $image);
                if (Storage::disk('public')->exists($path)) {
                    Storage::disk('public')->delete($path);
                }
            }
        }

        // Delete the listing
        $listing->delete();

        return redirect()->route('marketplace.index')
            ->with('success', 'Listing deleted successfully!');
    }
}
