import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ResetPassword from "../ResetPassword";

const { resetPasswordMock } = vi.hoisted(() => ({
  resetPasswordMock: vi.fn(),
}));

vi.mock("@features/auth/services/authServices", () => ({
  resetPassword: resetPasswordMock,
}));

const renderResetPassword = (ruta = "/reset-password?token=tok-123") =>
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <ResetPassword />
    </MemoryRouter>,
  );

describe("ResetPassword", () => {
  beforeEach(() => {
    resetPasswordMock.mockReset();
  });

  it("sin token muestra un error y un enlace para solicitar uno nuevo", () => {
    renderResetPassword("/reset-password");
    expect(screen.getByText(/no es válido/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /solicitá un enlace nuevo/i }),
    ).toHaveAttribute("href", "/forgot-password");
  });

  it("valida que las contraseñas coincidan", async () => {
    const user = userEvent.setup();
    renderResetPassword();
    await user.type(screen.getByLabelText("Nueva contraseña"), "claveSegura1");
    await user.type(
      screen.getByLabelText("Confirmar contraseña"),
      "claveDistinta1",
    );
    await user.click(
      screen.getByRole("button", { name: "Guardar contraseña" }),
    );
    expect(
      screen.getByText("Las contraseñas no coinciden"),
    ).toBeInTheDocument();
    expect(resetPasswordMock).not.toHaveBeenCalled();
  });

  it("valida el largo mínimo de la contraseña", async () => {
    const user = userEvent.setup();
    renderResetPassword();
    await user.type(screen.getByLabelText("Nueva contraseña"), "corta12");
    await user.type(screen.getByLabelText("Confirmar contraseña"), "corta12");
    await user.click(
      screen.getByRole("button", { name: "Guardar contraseña" }),
    );
    expect(
      screen.getByText("La contraseña debe tener al menos 8 caracteres"),
    ).toBeInTheDocument();
    expect(resetPasswordMock).not.toHaveBeenCalled();
  });

  it("guarda la contraseña nueva con el token de la URL y muestra el éxito", async () => {
    const user = userEvent.setup();
    resetPasswordMock.mockResolvedValue("Contraseña restablecida con éxito.");
    renderResetPassword();
    await user.type(screen.getByLabelText("Nueva contraseña"), "claveSegura1");
    await user.type(
      screen.getByLabelText("Confirmar contraseña"),
      "claveSegura1",
    );
    await user.click(
      screen.getByRole("button", { name: "Guardar contraseña" }),
    );
    expect(resetPasswordMock).toHaveBeenCalledWith(
      "tok-123",
      "claveSegura1",
    );
    expect(
      await screen.findByText("¡Contraseña actualizada!"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /ir a iniciar sesión/i }),
    ).toBeInTheDocument();
  });

  it("muestra el error del backend cuando el token expiró", async () => {
    const user = userEvent.setup();
    resetPasswordMock.mockRejectedValue(
      new Error(
        "El token de restablecimiento ha expirado. Por favor, solicita uno nuevo.",
      ),
    );
    renderResetPassword();
    await user.type(screen.getByLabelText("Nueva contraseña"), "claveSegura1");
    await user.type(
      screen.getByLabelText("Confirmar contraseña"),
      "claveSegura1",
    );
    await user.click(
      screen.getByRole("button", { name: "Guardar contraseña" }),
    );
    expect(
      await screen.findByText(/El token de restablecimiento ha expirado/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /solicitá un enlace nuevo/i }),
    ).toHaveAttribute("href", "/forgot-password");
  });

  it("nunca guarda ni registra el token de restablecimiento", async () => {
    const user = userEvent.setup();
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    const logSpy = vi.spyOn(console, "log");
    resetPasswordMock.mockResolvedValue("Contraseña restablecida con éxito.");
    renderResetPassword("/reset-password?token=tok-secreto-123");
    await user.type(screen.getByLabelText("Nueva contraseña"), "claveSegura1");
    await user.type(
      screen.getByLabelText("Confirmar contraseña"),
      "claveSegura1",
    );
    await user.click(
      screen.getByRole("button", { name: "Guardar contraseña" }),
    );
    await screen.findByText("¡Contraseña actualizada!");
    expect(JSON.stringify(setItemSpy.mock.calls)).not.toContain(
      "tok-secreto-123",
    );
    expect(JSON.stringify(logSpy.mock.calls)).not.toContain("tok-secreto-123");
  });
});
