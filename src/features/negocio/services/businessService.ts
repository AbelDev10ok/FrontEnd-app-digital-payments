import { authenticatedFetch } from "@/features/auth/services/authServices";
import {
  BUSINESS_API_URL,
  USUARIOS_API_URL,
} from "@/shared/config/api";
import type { BusinessMe, BusinessUpdateRequest } from "@/shared/types/business";

/** Resultado del cambio de contraseña: mensaje + refresh token rotado. */
export interface ChangePasswordResult {
  message: string;
  /**
   * Refresh token nuevo que devuelve el backend: esta sesión sigue abierta y
   * las demás quedan invalidadas. `null` si el backend no lo expone.
   */
  refreshToken: string | null;
}

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
   * El backend rota el refresh token: las otras sesiones se cierran y la
   * respuesta trae el token nuevo para conservar esta sesion abierta.
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<ChangePasswordResult> {
    const response = await authenticatedFetch(`${USUARIOS_API_URL}/me/password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!response.ok) {
      throw await extraerError(response, "Error al cambiar la contraseña");
    }
    const body = await response.json().catch(() => null);
    return {
      message: body?.message ?? "Contraseña actualizada.",
      refreshToken:
        typeof body?.data?.refreshToken === "string" ? body.data.refreshToken : null,
    };
  },
};
