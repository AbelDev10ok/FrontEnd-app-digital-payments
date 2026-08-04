import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "../authStore";
import { login as loginService } from "@features/auth/services/authServices";

vi.mock("@features/auth/services/authServices", () => ({
  login: vi.fn(),
  refreshToken: vi.fn(),
}));

const encodePayload = (obj: object) =>
  btoa(JSON.stringify(obj))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const makeToken = (role: string, expOffset = 3600) =>
  `${encodePayload({ alg: "HS256", typ: "JWT" })}.${encodePayload({
    sub: "admin@test.com",
    authorities: `[${role}]`,
    exp: Math.floor(Date.now() / 1000) + expOffset,
  })}.firma`;

describe("authStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
    vi.clearAllMocks();
  });

  it("login exitoso setea user, tokens y rol extraído del JWT", async () => {
    vi.mocked(loginService).mockResolvedValue({
      username: "admin@test.com",
      accessToken: makeToken("ROLE_ADMIN"),
      refreshToken: "rt-123",
    });

    await useAuthStore.getState().login("admin@test.com", "123456");

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual({ email: "admin@test.com", role: "ROLE_ADMIN" });
    expect(state.accessToken).toBeTruthy();
    expect(state.refreshToken).toBe("rt-123");
  });

  it("login fallido lanza error y deja isLoading en false", async () => {
    vi.mocked(loginService).mockRejectedValue(
      new Error("Credenciales inválidas"),
    );

    await expect(
      useAuthStore.getState().login("a@b.com", "nope"),
    ).rejects.toThrow("Credenciales inválidas");
    expect(useAuthStore.getState().isLoading).toBe(false);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("logout limpia el estado", () => {
    useAuthStore.setState({
      user: { email: "x@y.com", role: "ROLE_USER" },
      accessToken: "t",
      refreshToken: "r",
      isAuthenticated: true,
    });

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.user).toBeNull();
  });

  it("setTokens extrae rol y email del nuevo token", () => {
    useAuthStore.getState().setTokens(makeToken("ROLE_USER"), "rt");
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.role).toBe("ROLE_USER");
    expect(state.user?.email).toBe("admin@test.com");
    expect(state.refreshToken).toBe("rt");
  });

  it("persiste la sesión en localStorage bajo auth-store", async () => {
    vi.mocked(loginService).mockResolvedValue({
      username: "admin@test.com",
      accessToken: makeToken("ROLE_ADMIN"),
      refreshToken: "rt",
    });

    await useAuthStore.getState().login("a@b.com", "123456");

    expect(localStorage.getItem("auth-store")).toContain("ROLE_ADMIN");
  });
});
