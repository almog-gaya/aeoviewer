export async function getRedditUser() {
  try {
    // Check if we have an access token in cookies
    const token = getCookie('reddit_access_token');
    if (!token) return null;

    // Try to get user info from Reddit API
    const response = await fetch('https://oauth.reddit.com/api/v1/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'web:AEO-Viewer-Bot:1.0 (by /u/your_reddit_username)'
      }
    });

    if (!response.ok) {
      // Token might be expired, remove it
      document.cookie = 'reddit_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      return null;
    }

    const user = await response.json();
    return user;
  } catch (error) {
    console.error('Error getting Reddit user:', error);
    return null;
  }
}

export const handleRedditLogin = async () => {

  window.location.href = "/api/auth/reddit/login";

};

export function handleRedditLogout() {
  // Clear the access token cookie
  document.cookie = 'reddit_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  // Reload the page to update UI
  window.location.reload();
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

