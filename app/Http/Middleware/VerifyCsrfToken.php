/**
 * Indicates whether the XSRF-TOKEN cookie should be set on the response.
 *
 * @var bool
 */
protected $addHttpCookie = true;

/**
 * Indicates whether the XSRF-TOKEN cookie should use the secure flag.
 *
 * @var bool
 */
protected $secure = null;

/**
 * The constructor.
 */
public function __construct()
{
    // Set secure flag based on environment or explicitly from config
    $this->secure = env('SESSION_SECURE_COOKIE', env('APP_ENV') === 'production');
} 