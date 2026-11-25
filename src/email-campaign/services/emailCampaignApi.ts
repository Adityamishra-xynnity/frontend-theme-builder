import type {
  EmailTemplateResponse,
  EmailCampaignHeaderTemplateResponse,
  EmailCampaignResponse,
  EmailCampaignRequest,
  EmailCampaignSendRequest,
  SpringPage,
} from "../types/campaign";

const API_BASE_URL = "http://localhost:8080/api";

// ==========================================
// TEMPLATE API SERVICES
// ==========================================

/**
 * Fetch all active email templates with optional category and search filters.
 */
export async function fetchEmailTemplates(
  category?: string,
  search?: string
): Promise<EmailTemplateResponse[]> {
  const params = new URLSearchParams();
  if (category && category !== "all") {
    params.append("category", category);
  }
  if (search && search.trim()) {
    params.append("search", search.trim());
  }

  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await fetch(`${API_BASE_URL}/email-templates${query}`, {
    method: "GET",
    headers: {
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Failed to fetch email templates (${response.status})`);
  }

  return response.json();
}

/**
 * Fetch paginated active email templates.
 */
export async function fetchEmailTemplatesPaginated(
  page = 0,
  size = 20,
  category?: string,
  search?: string
): Promise<SpringPage<EmailTemplateResponse>> {
  const params = new URLSearchParams();
  params.append("page", String(page));
  params.append("size", String(size));
  if (category && category !== "all") {
    params.append("category", category);
  }
  if (search && search.trim()) {
    params.append("search", search.trim());
  }

  const response = await fetch(`${API_BASE_URL}/email-templates/page?${params.toString()}`, {
    method: "GET",
    headers: {
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Failed to fetch paginated templates (${response.status})`);
  }

  return response.json();
}

/**
 * Fetch distinct active template categories for filtering.
 */
export async function fetchEmailTemplateCategories(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/email-templates/categories`, {
    method: "GET",
    headers: {
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Failed to fetch template categories (${response.status})`);
  }

  return response.json();
}

/**
 * Fetch single email template by numeric ID.
 */
export async function fetchEmailTemplateById(id: number): Promise<EmailTemplateResponse> {
  const response = await fetch(`${API_BASE_URL}/email-templates/${id}`, {
    method: "GET",
    headers: {
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Failed to fetch template #${id}`);
  }

  return response.json();
}

/**
 * Fetch single email template by unique template slug key.
 */
export async function fetchEmailTemplateByKey(templateKey: string): Promise<EmailTemplateResponse> {
  const response = await fetch(`${API_BASE_URL}/email-templates/key/${encodeURIComponent(templateKey)}`, {
    method: "GET",
    headers: {
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Failed to fetch template by key "${templateKey}"`);
  }

  return response.json();
}

// ==========================================
// HEADER TEMPLATE API SERVICES
// ==========================================

/**
 * Fetch active pre-built email campaign header templates from dedicated table.
 */
export async function fetchEmailCampaignHeaderTemplates(
  category?: string
): Promise<EmailCampaignHeaderTemplateResponse[]> {
  const params = new URLSearchParams();
  if (category && category !== "all") {
    params.append("category", category);
  }

  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await fetch(
    `${API_BASE_URL}/email-campaign-header-templates${query}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      errorText || `Failed to fetch header templates (${response.status})`
    );
  }

  return response.json();
}

// ==========================================
// CAMPAIGN CRUD API SERVICES
// ==========================================

/**
 * Fetch all user campaigns.
 */
export async function fetchEmailCampaigns(): Promise<EmailCampaignResponse[]> {
  const response = await fetch(`${API_BASE_URL}/email-campaigns`, {
    method: "GET",
    headers: {
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to fetch email campaigns");
  }

  return response.json();
}

/**
 * Fetch a single campaign by ID.
 */
export async function fetchEmailCampaignById(id: number): Promise<EmailCampaignResponse> {
  const response = await fetch(`${API_BASE_URL}/email-campaigns/${id}`, {
    method: "GET",
    headers: {
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Failed to fetch campaign #${id}`);
  }

  return response.json();
}

/**
 * Create a new email campaign.
 */
export async function createEmailCampaign(
  request: EmailCampaignRequest
): Promise<EmailCampaignResponse> {
  const response = await fetch(`${API_BASE_URL}/email-campaigns`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to create email campaign");
  }

  return response.json();
}

/**
 * Update an existing email campaign.
 */
export async function updateEmailCampaign(
  id: number,
  request: EmailCampaignRequest
): Promise<EmailCampaignResponse> {
  const response = await fetch(`${API_BASE_URL}/email-campaigns/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Failed to update campaign #${id}`);
  }

  return response.json();
}

/**
 * Duplicate a campaign.
 */
export async function duplicateEmailCampaign(id: number): Promise<EmailCampaignResponse> {
  const response = await fetch(`${API_BASE_URL}/email-campaigns/${id}/duplicate`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Failed to duplicate campaign #${id}`);
  }

  return response.json();
}

/**
 * Delete a campaign.
 */
export async function deleteEmailCampaign(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/email-campaigns/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Failed to delete campaign #${id}`);
  }
}

// ==========================================
// SEND EMAIL SERVICE
// ==========================================

/**
 * Send an email design through the backend SMTP mail sender.
 */
export async function sendEmailCampaign(
  request: EmailCampaignSendRequest
): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/email/send-design`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(errorMessage || "Failed to send email campaign");
  }

  return response.text();
}

// Backward-compatible alias
export type EmailCampaignRequestType = EmailCampaignSendRequest;
