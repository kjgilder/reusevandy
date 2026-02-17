export const BASE_URL = 'http://localhost:8000';
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
    // @ts-ignore
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

export async function getListings(filters: any = {}) {
  const params = new URLSearchParams();
  Object.keys(filters).forEach(key => {
    if (filters[key]) params.append(key, filters[key]);
  });
  return apiRequest(`/listings/?${params.toString()}`);
}

export async function createListing(data: any) {
  return apiRequest('/listings/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest('/utils/upload', {
    method: 'POST',
    body: formData,
  });
}
