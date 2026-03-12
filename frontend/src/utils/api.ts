export const BASE_URL = 'http://127.0.0.1:8000';
const API_URL = `${BASE_URL}/api/v1`;

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');

  const headers: HeadersInit = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // Only set Content-Type to application/json if body is not FormData and Content-Type is not already set
  const hasContentType = Object.keys(headers).some(key => key.toLowerCase() === 'content-type');
  if (!(options.body instanceof FormData) && !hasContentType) {
    // @ts-expect-error headers type doesn't explicitly allow string indexing but it works
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'API request failed');
  }

  return response.json();
}

export async function getListings(filters: Record<string, string | number | undefined> = {}) {
  const params = new URLSearchParams();
  Object.keys(filters).forEach(key => {
    if (filters[key]) params.append(key, String(filters[key]));
  });
  return apiRequest(`/listings/?${params.toString()}`);
}

export async function createListing(data: Record<string, unknown>) {
  return apiRequest('/listings/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function uploadListingImage(listingId: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest(`/listings/${listingId}/images`, {
    method: 'POST',
    body: formData,
  });
}

export async function getMyListings() {
  return apiRequest('/listings/me');
}

export async function updateListingStatus(listingId: string, status: string) {
  return apiRequest(`/listings/${listingId}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function deleteListing(listingId: string) {
  return apiRequest(`/listings/${listingId}`, {
    method: 'DELETE',
  });
}
