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
  /** Ultimo cobro de renovacion rechazado (null si el ultimo cobro fue aprobado). */
  lastPaymentFailedAt?: string | null;
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

  /** Cancela la suscripcion: sin mas cobros; el acceso dura hasta fin del periodo pagado. */
  async cancel(): Promise<SubscriptionStatus> {
    return gestionar("cancel", "Error al cancelar la suscripcion");
  },

  /** Pausa la suscripcion: MP no cobra mientras este pausada. */
  async pause(): Promise<SubscriptionStatus> {
    return gestionar("pause", "Error al pausar la suscripcion");
  },

  /** Reactiva una suscripcion pausada. */
  async resume(): Promise<SubscriptionStatus> {
    return gestionar("resume", "Error al reactivar la suscripcion");
  },
};

async function gestionar(
  accion: "cancel" | "pause" | "resume",
  mensajeError: string,
): Promise<SubscriptionStatus> {
  const response = await authenticatedFetch(`${BILLING_API_URL}/subscription/${accion}`, {
    method: "POST",
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.message ?? mensajeError);
  }
  if (body?.status === "OK" && body?.data) {
    return body.data as SubscriptionStatus;
  }
  throw new Error(body?.message ?? mensajeError);
}