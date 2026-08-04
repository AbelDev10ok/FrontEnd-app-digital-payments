import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Login from "../Login";

const { loginMock } = vi.hoisted(() => ({ loginMock: vi.fn() }));

vi.mock("@features/auth/store/authStore", () => ({
  useAuthStore: () => ({
    login: loginMock,
    isLoading: false,
    isAuthenticated: false,
    user: null,
  }),
}));

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );

describe("Login", () => {
  beforeEach(() => {
    loginMock.mockReset();
  });

  it("muestra los campos de email, contraseña y el botón de envío", () => {
    renderLogin();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Iniciar Sesión" }),
    ).toBeInTheDocument();
  });

  it("valida los campos vacíos", async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.click(screen.getByRole("button", { name: "Iniciar Sesión" }));
    expect(screen.getByText("El email es requerido")).toBeInTheDocument();
    expect(screen.getByText("La contraseña es requerida")).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("valida el formato del email", async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByLabelText("Email"), "email-invalido");
    await user.type(screen.getByLabelText("Contraseña"), "123456");
    await user.click(screen.getByRole("button", { name: "Iniciar Sesión" }));
    expect(screen.getByText("Ingresa un email válido")).toBeInTheDocument();
  });

  it("valida el largo mínimo de la contraseña", async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByLabelText("Email"), "a@b.com");
    await user.type(screen.getByLabelText("Contraseña"), "123");
    await user.click(screen.getByRole("button", { name: "Iniciar Sesión" }));
    expect(
      screen.getByText("La contraseña debe tener al menos 6 caracteres"),
    ).toBeInTheDocument();
  });

  it("muestra error general si el login falla", async () => {
    const user = userEvent.setup();
    loginMock.mockRejectedValue(new Error("boom"));
    renderLogin();
    await user.type(screen.getByLabelText("Email"), "a@b.com");
    await user.type(screen.getByLabelText("Contraseña"), "123456");
    await user.click(screen.getByRole("button", { name: "Iniciar Sesión" }));
    expect(screen.getByText(/Credenciales inválidas/)).toBeInTheDocument();
  });

  it("envía email y contraseña al login si la validación pasa", async () => {
    const user = userEvent.setup();
    loginMock.mockResolvedValue(undefined);
    renderLogin();
    await user.type(screen.getByLabelText("Email"), "a@b.com");
    await user.type(screen.getByLabelText("Contraseña"), "123456");
    await user.click(screen.getByRole("button", { name: "Iniciar Sesión" }));
    expect(loginMock).toHaveBeenCalledWith("a@b.com", "123456");
  });
});
