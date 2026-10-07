import { authenticatedFetch } from "@/features/auth/services/authServices";
import { BILLING_API_URL } from "@/shared/config/api";

export interface PlanInfo {
  id: number;
  name: string;
  description?: string;
  price: number;
  currency: string;
  trialDays: number;
}

export interface SubscriptionStatus {
  id?: number;
  status: string;
  plan?: PlanInfo;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  mpPreapprovalId?: string;
  mpInitPoint?: string;
  createdAt?: string;
  trialEndsAt?: string | null;
  businessPlanStatus?: string;
}

export interface SubscribeResponse {
  initPoint: string;
  preapprovalId: string;
  status: string;
}

export const billingService = {
  async getStatus(): Promise<SubscriptionStatus> {
    const response = await authenticatedFetch(`${BILLING_API_URL}/subscription`);
    if (!response.ok) {
      throw new Error("Error al obtener el estado de la suscripcion");
    }
    const body = await response.json();
    if (body?.status === "OK" && body?.data) {
      return body.data as SubscriptionStatus;
    }
    throw new Error(body?.message ?? "Error al obtener la suscripcion");
  },

  async subscribe(): Promise<SubscribeResponse> {
    const response = await authenticatedFetch(`${BILLING_API_URL}/subscribe`, {
      method: "POST",
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.message ?? "Error al iniciar la suscripcion");
    }
    const body = await response.json();
    if (body?.status === "OK" && body?.data) {
      return body.data as SubscribeResponse;
    }
    throw new Error(body?.message ?? "Error al iniciar la suscripcion");
  },
};