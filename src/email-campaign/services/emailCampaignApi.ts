
const API_URL = "http://localhost:8080/api/email/send-design";

export interface EmailCampaignRequest {
  recipientEmail: string;
  designName: string;
  htmlContent: string;
}

export async function sendEmailCampaign(
  request: EmailCampaignRequest
): Promise<string> {
  const response = await fetch(API_URL, {
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
