@php
    $value = data_get($entry, $column['name']);
    $fileExtension = pathinfo($value, PATHINFO_EXTENSION);
    $isImage = in_array(strtolower($fileExtension), ['jpg', 'jpeg', 'png', 'gif', 'webp']);
@endphp

<div>
    @if($isImage)
        <a href="{{ asset($value) }}" target="_blank">
            <img src="{{ asset($value) }}" alt="Verification Document" class="img-thumbnail" style="max-height: 50px;">
        </a>
    @else
        <a href="{{ asset($value) }}" target="_blank" class="btn btn-sm btn-link">
            <i class="la la-file-pdf"></i> View Document
        </a>
    @endif
</div> 