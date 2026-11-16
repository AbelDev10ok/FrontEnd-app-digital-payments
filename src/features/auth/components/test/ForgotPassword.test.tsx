import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ForgotPassword from "../ForgotPassword";

const { forgotPasswordMock } = vi.hoisted(() => ({
  forgotPasswordMock: vi.fn(),
}));

vi.mock("@features/auth/services/authServices", () => ({
  forgotPassword: forgotPasswordMock,
}));

const renderForgotPassword = () =>
  render(
    <MemoryRouter>
      <ForgotPassword />
    </MemoryRouter>,
  );

describe("ForgotPassword", () => {
  beforeEach(() => {
    forgotPasswordMock.mockReset();
  });

  it("muestra el campo de email y el botón de envío", () => {
    renderForgotPassword();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Enviar enlace" }),
    ).toBeInTheDocument();
  });

  it("valida el email vacío", async () => {
    const user = userEvent.setup();
    renderForgotPassword();
    await user.click(screen.getByRole("button", { name: "Enviar enlace" }));
    expect(screen.getByText("El email es requerido")).toBeInTheDocument();
    expect(forgotPasswordMock).not.toHaveBeenCalled();
  });

  it("pide el enlace y muestra la confirmación", async () => {
    const user = userEvent.setup();
    forgotPasswordMock.mockResolvedValue(
      "Si el email está registrado, recibirás un enlace para restablecer tu contraseña.",
    );
    renderForgotPassword();
    await user.type(screen.getByLabelText("Email"), "dueño@casarodriguez.com");
    await user.click(screen.getByRole("button", { name: "Enviar enlace" }));
    expect(forgotPasswordMock).toHaveBeenCalledWith(
      "dueño@casarodriguez.com",
    );
    expect(await screen.findByText("¡Revisá tu correo!")).toBeInTheDocument();
    expect(
      screen.getByText(/Si el email está registrado/),
    ).toBeInTheDocument();
  });

  it("muestra el error del backend cuando la solicitud falla", async () => {
    const user = userEvent.setup();
    forgotPasswordMock.mockRejectedValue(
      new Error("No se pudo enviar el enlace"),
    );
    renderForgotPassword();
    await user.type(screen.getByLabelText("Email"), "a@b.com");
    await user.click(screen.getByRole("button", { name: "Enviar enlace" }));
    expect(
      await screen.findByText("No se pudo enviar el enlace"),
    ).toBeInTheDocument();
  });

  it("tiene un enlace para volver a iniciar sesión", () => {
    renderForgotPassword();
    expect(
      screen.getByRole("link", { name: "Iniciá sesión" }),
    ).toHaveAttribute("href", "/login");
  });
});
