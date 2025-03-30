<?php

namespace App\Http\Controllers;

use App\Models\VerificationDocument;
use Illuminate\Http\Request;

class VerificationController extends Controller
{
    public function submit(Request $request)
    {
        $request->validate([
            'document' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'notes' => 'nullable|string',
        ]);

        $path = $request->file('document')->store('verification-documents', 'public');

        VerificationDocument::updateOrCreate(
            ['user_id' => auth()->id()],
            [
                'document_path' => $path,
                'document_type' => $request->file('document')->getClientOriginalExtension(),
                'notes' => $request->notes,
            ]
        );

        auth()->user()->update(['verification_status' => 'pending']);

        return back()->with('success', 'Verification document submitted successfully');
    }
}
