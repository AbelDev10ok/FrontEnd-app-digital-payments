import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  authenticatedFetch,
  forgotPassword,
  login,
  logout,
  resetPassword,
  refreshToken,
  verifyEmail,
} from "../authServices";
import { useAuthStore } from "@features/auth/store/authStore";

const jsonResponse = (ok: boolean, status: number, body: unknown) => ({
  ok,
  status,
  json: async () => body,
  text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
});

describe("login", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("devuelve los datos desenrollados del envelope si es OK", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(true, 200, {
        message: "Login succes",
        status: "OK",
        data: { username: "a@b.com", accessToken: "at", refreshToken: "rt" },
      }),
    );

    const result = await login("a@b.com", "pass");
    expect(result).toEqual({
      username: "a@b.com",
      accessToken: "at",
      refreshToken: "rt",
    });
  });

  it("lanza error si las credenciales son inválidas", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(false, 401, {
        message: "Error de autenticacion username o password incorrecto",
        status: "401",
      }),
    );

    await expect(login("a@b.com", "mal")).rejects.toThrow(
      "Error de autenticacion",
    );
  });
});

describe("verifyEmail", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("confirma la cuenta y devuelve el mensaje del envelope", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(true, 200, {
        message: "¡Correo verificado con éxito! Ya puedes iniciar sesión.",
        status: "OK",
        data: null,
      }),
    );

    const result = await verifyEmail("tok-123");

    expect(result).toContain("Correo verificado");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/auth/verify?token=tok-123"),
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("lanza el mensaje del backend si el token es inválido", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(false, 400, {
        message: "Token de verificacion invalido o expirado.",
        status: "BAD_REQUEST",
        data: null,
      }),
    );

    await expect(verifyEmail("tok-viejo")).rejects.toThrow(
      "Token de verificacion invalido o expirado.",
    );
  });
});

describe("forgotPassword", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("pide el enlace al backend y devuelve el mensaje (texto plano, sin envelope)", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        true,
        200,
        "Si el email está registrado, recibirás un enlace para restablecer tu contraseña.",
      ),
    );

    const result = await forgotPassword("dueño@casarodriguez.com");

    expect(result).toContain("Si el email está registrado");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/auth/forgot-password"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "dueño@casarodriguez.com" }),
      }),
    );
  });

  it("lanza el mensaje del backend si la solicitud falla", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(false, 400, "No se pudo procesar la solicitud."),
    );

    await expect(forgotPassword("a@b.com")).rejects.toThrow(
      "No se pudo procesar la solicitud.",
    );
  });
});

describe("resetPassword", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("envía el token y la contraseña nueva y devuelve el mensaje (texto plano, sin envelope)", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(true, 200, "Contraseña restablecida con éxito."),
    );

    const result = await resetPassword("tok-123", "claveSegura1");

    expect(result).toBe("Contraseña restablecida con éxito.");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/auth/reset-password?token=tok-123"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ newPassword: "claveSegura1" }),
      }),
    );
  });

  it("lanza el mensaje del backend si el token es inválido o expiró", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(false, 400, "No se pudo restablecer la contrasena."),
    );

    await expect(resetPassword("tok-viejo", "claveSegura1")).rejects.toThrow(
      "No se pudo restablecer la contrasena.",
    );
  });
});

describe("refreshToken", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("devuelve el cuerpo raw { accessToken, refreshToken } en éxito (sin envelope)", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(true, 200, { accessToken: "new-at", refreshToken: "rt" }),
    );

    const result = await refreshToken("rt");
    expect(result).toEqual({ accessToken: "new-at", refreshToken: "rt" });
  });

  it("lanza el mensaje del backend si el refresh falla", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => {
        throw new Error("no json");
      },
      text: async () => "Refresh token expired",
    });

    await expect(refreshToken("rt")).rejects.toThrow("Refresh token expired");
  });
});

describe("authenticatedFetch", () => {
  const fetchMock = vi.fn();
  const url = "http://localhost:8080/api/loans";

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    localStorage.clear();
    useAuthStore.setState({
      user: { email: "a@b.com", role: "ROLE_USER" },
      accessToken: "oldAccess",
      refreshToken: "oldRefresh",
      isAuthenticated: true,
      isLoading: false,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("agrega el header Authorization Bearer", async () => {
    fetchMock.mockResolvedValue(jsonResponse(true, 200, {}));

    await authenticatedFetch(url);

    expect(fetchMock).toHaveBeenCalledWith(
      url,
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer oldAccess" }),
      }),
    );
  });

  it("lanza error si no hay access token", async () => {
    useAuthStore.setState({ accessToken: null, isAuthenticated: false });

    await expect(authenticatedFetch(url)).rejects.toThrow(
      "No access token available",
    );
  });

  it("reintenta una vez con el token refrescado tras un 401 y persiste el refresh token rotado", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(false, 401, {}))
      .mockResolvedValueOnce(
        jsonResponse(true, 200, {
          accessToken: "newAccess",
          refreshToken: "newRefresh",
        }),
      )
      .mockResolvedValueOnce(jsonResponse(true, 200, {}));

    const result = await authenticatedFetch(url);

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const retryInit = fetchMock.mock.calls[2][1] as RequestInit;
    expect((retryInit.headers as Record<string, string>).Authorization).toBe(
      "Bearer newAccess",
    );
    expect(useAuthStore.getState().refreshToken).toBe("newRefresh");
  });

  it("peticiones concurrentes con 401 comparten un solo refresh (single-flight)", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(false, 401, {}))
      .mockResolvedValueOnce(jsonResponse(false, 401, {}))
      .mockResolvedValueOnce(
        jsonResponse(true, 200, {
          accessToken: "newAccess",
          refreshToken: "newRefresh",
        }),
      )
      .mockResolvedValueOnce(jsonResponse(true, 200, {}))
      .mockResolvedValueOnce(jsonResponse(true, 200, {}));

    const [a, b] = await Promise.all([
      authenticatedFetch(url),
      authenticatedFetch(url),
    ]);

    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(5);
    const refreshCalls = fetchMock.mock.calls.filter(([callUrl]) =>
      (callUrl as string).includes("/auth/refresh-token"),
    );
    expect(refreshCalls).toHaveLength(1);
  });

  it("hace logout y lanza error si el refresh falla", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(false, 401, {}))
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => {
          throw new Error("sin json");
        },
        text: async () => "Refresh token expired",
      })
      .mockResolvedValueOnce(jsonResponse(true, 200, {}));

    await expect(authenticatedFetch(url)).rejects.toThrow();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.accessToken).toBeNull();
    expect(fetchMock.mock.calls.some(([callUrl]) =>
      (callUrl as string).includes("/auth/logout"),
    )).toBe(true);
  });
});

describe("logout", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("envía POST a /auth/logout con el refresh token", async () => {
    fetchMock.mockResolvedValue(jsonResponse(true, 200, {}));

    await logout("rt-to-invalidate");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/auth/logout"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ refreshToken: "rt-to-invalidate" }),
      }),
    );
  });

  it("no lanza error si la red falla (best-effort)", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));

    await expect(logout("rt")).resolves.toBeUndefined();
  });
});
