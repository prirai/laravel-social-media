<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

// For searches
class UserController extends Controller
{
    public function search(Request $request)
    {
        $query = $request->input('query');
        
        if (strlen($query) < 2) {
            return response()->json(['users' => []]);
        }

        $users = User::where('username', 'like', "%{$query}%")
            ->orWhere('name', 'like', "%{$query}%")
            ->select('id', 'name', 'username', 'avatar')
            ->limit(10)
            ->get();

        return response()->json(['users' => $users]);
    }
} 