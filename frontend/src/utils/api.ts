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

export async function getPurchasedListings() {
  return apiRequest('/listings/purchased');
}

export async function updateProfile(data: { full_name?: string; profile_picture?: string }) {
  return apiRequest('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function uploadProfilePicture(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest('/auth/profile-picture', {
    method: 'POST',
    body: formData,
  });
}

export async function updateListingStatus(listingId: string, status: string) {
  return apiRequest(`/listings/${listingId}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function updateListing(listingId: string, data: Record<string, unknown>) {
  return apiRequest(`/listings/${listingId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteListing(listingId: string) {
  return apiRequest(`/listings/${listingId}`, {
    method: 'DELETE',
  });
}

export async function deleteListingImage(listingId: string, imageUrl: string) {
  return apiRequest(`/listings/${listingId}/images?image_url=${encodeURIComponent(imageUrl)}`, {
    method: 'DELETE',
  });
}
export async function getConversations(filters: { role?: 'buying' | 'selling'; search?: string; filter?: 'active' | 'past' } = {}) {
  const params = new URLSearchParams();
  if (filters.role) params.append('role', filters.role);
  if (filters.search) params.append('search', filters.search);
  if (filters.filter) params.append('filter', filters.filter);
  return apiRequest(`/messages/?${params.toString()}`);
}

export async function getMessages(conversationId: string) {
  return apiRequest(`/messages/${conversationId}`);
}

export async function sendOffer(data: { listing_id: string; offer_amount: number; message?: string }) {
  return apiRequest('/messages/offer', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function initiateConversation(data: { listing_id: string; content?: string }) {
  return apiRequest('/messages/initiate', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getPendingOffers() {
  return apiRequest('/messages/pending-bids');
}

export interface UserParticipant {
  id: string;
  full_name: string;
  email: string;
}

export interface Conversation {
  id: string;
  listing: {
    id: string;
    title: string;
    price: number;
    status: string;
    seller_confirmed_sold: boolean;
    buyer_confirmed_sold: boolean;
  };
  buyer: UserParticipant;
  seller: UserParticipant;
  last_message_at: string;
  unread_count?: number;
}

export async function sendMessage(conversationId: string, content: string) {
  return apiRequest(`/messages/${conversationId}/text`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export async function getUnreadTotal() {
  return apiRequest('/messages/unread/total');
}

export async function updateOfferStatus(messageId: string, status: 'accepted' | 'declined') {
  return apiRequest(`/messages/message/${messageId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function updateOfferAmount(messageId: string, offer_amount: number) {
  return apiRequest(`/messages/message/${messageId}/offer`, {
    method: 'PUT',
    body: JSON.stringify({ listing_id: 'placeholder', offer_amount }), // listing_id ignored in backend for this route
  });
}

export async function confirmTransaction(listingId: string) {
  return apiRequest(`/listings/${listingId}/confirm-sold`, {
    method: 'POST',
  });
}

export async function revertToActive(listingId: string) {
  return apiRequest(`/listings/${listingId}/revert-active`, {
    method: 'POST',
  });
}

export async function cancelListing(listingId: string) {
  return apiRequest(`/listings/${listingId}/cancel`, {
    method: 'POST',
  });
}

export async function changePassword(currentPassword: string, newPassword: string) {
  return apiRequest('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
}
