import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import VerifyEmail from "../VerifyEmail";

const { verifyEmailMock } = vi.hoisted(() => ({
  verifyEmailMock: vi.fn(),
}));

vi.mock("@features/auth/services/authServices", () => ({
  verifyEmail: verifyEmailMock,
}));

const renderVerifyEmail = (ruta = "/verify?token=tok-123") =>
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <VerifyEmail />
    </MemoryRouter>,
  );

describe("VerifyEmail", () => {
  beforeEach(() => {
    verifyEmailMock.mockReset();
  });

  it("muestra la confirmación cuando el token es válido", async () => {
    verifyEmailMock.mockResolvedValue(
      "¡Correo verificado con éxito! Ya puedes iniciar sesión.",
    );
    renderVerifyEmail();
    expect(await screen.findByText("¡Correo verificado!")).toBeInTheDocument();
    expect(verifyEmailMock).toHaveBeenCalledWith("tok-123");
    expect(
      screen.getByRole("button", { name: "Ir a iniciar sesión" }),
    ).toBeInTheDocument();
  });

  it("muestra el error del backend cuando el token es inválido", async () => {
    verifyEmailMock.mockRejectedValue(
      new Error("Token de verificacion invalido o expirado."),
    );
    renderVerifyEmail();
    expect(
      await screen.findByText(/Token de verificacion invalido o expirado/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Iniciá sesión" }),
    ).toHaveAttribute("href", "/login");
  });

  it("sin token muestra un error", () => {
    renderVerifyEmail("/verify");
    expect(screen.getByText(/no es válido/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Iniciá sesión" }),
    ).toHaveAttribute("href", "/login");
    expect(verifyEmailMock).not.toHaveBeenCalled();
  });

  it("consume el token una sola vez aunque React re-ejecute el efecto", async () => {
    verifyEmailMock.mockResolvedValue(
      "¡Correo verificado con éxito! Ya puedes iniciar sesión.",
    );
    render(
      <MemoryRouter initialEntries={["/verify?token=tok-123"]}>
        <React.StrictMode>
          <VerifyEmail />
        </React.StrictMode>
      </MemoryRouter>,
    );
    await screen.findByText("¡Correo verificado!");
    // El token se consume en el backend: una segunda petición lo rechazaría
    expect(verifyEmailMock).toHaveBeenCalledTimes(1);
  });

  it("nunca guarda ni registra el token de verificación", async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    const logSpy = vi.spyOn(console, "log");
    verifyEmailMock.mockResolvedValue("ok");
    renderVerifyEmail("/verify?token=tok-secreto-xyz");
    await screen.findByText("¡Correo verificado!");
    expect(JSON.stringify(setItemSpy.mock.calls)).not.toContain(
      "tok-secreto-xyz",
    );
    expect(JSON.stringify(logSpy.mock.calls)).not.toContain("tok-secreto-xyz");
  });
});
