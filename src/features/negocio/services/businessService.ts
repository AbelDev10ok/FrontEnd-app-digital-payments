import { authenticatedFetch } from "@/features/auth/services/authServices";
import {
  BUSINESS_API_URL,
  USUARIOS_API_URL,
} from "@/shared/config/api";
import type { BusinessMe, BusinessUpdateRequest } from "@/shared/types/business";

/** Extrae el mensaje de error de una respuesta 400 del backend. */
const extraerError = async (response: Response, fallback: string): Promise<Error> => {
  try {
    const body = await response.json();
    if (typeof body?.message === "string" && body.message) {
      return new Error(body.message);
    }
    // Errores de validacion: { campo: mensaje }
    if (body && typeof body === "object") {
      const mensajes = Object.values(body as Record<string, unknown>).filter(
        (v): v is string => typeof v === "string",
      );
      if (mensajes.length > 0) {
        return new Error(mensajes.join(" · "));
      }
    }
  } catch {
    // cuerpo no JSON
  }
  return new Error(fallback);
};

export const businessService = {
  /** Datos del negocio propio: settings + estado del plan. Respuesta cruda (sin envelope). */
  async getMyBusiness(): Promise<BusinessMe> {
    const response = await authenticatedFetch(`${BUSINESS_API_URL}/me`);
    if (!response.ok) throw await extraerError(response, "Error al cargar los datos del negocio");
    return response.json();
  },

  async updateMyBusiness(request: BusinessUpdateRequest): Promise<BusinessMe> {
    const response = await authenticatedFetch(`${BUSINESS_API_URL}/me`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!response.ok) throw await extraerError(response, "Error al guardar los datos del negocio");
    return response.json();
  },

  /**
   * Cambia la contrasena del usuario autenticado.
   * El backend invalida el refresh token: las demas sesiones se cierran.
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<string> {
    const response = await authenticatedFetch(`${USUARIOS_API_URL}/me/password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!response.ok) {
      throw await extraerError(response, "Error al cambiar la contraseña");
    }
    const body = await response.json().catch(() => null);
    return body?.message ?? "Contraseña actualizada.";
  },
};
