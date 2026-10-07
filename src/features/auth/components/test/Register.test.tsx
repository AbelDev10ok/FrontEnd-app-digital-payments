import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Register from "../Register";

const { registerMock } = vi.hoisted(() => ({ registerMock: vi.fn() }));

vi.mock("@features/auth/services/authServices", () => ({
  register: registerMock,
}));

const renderRegister = () =>
  render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>,
  );

const completarFormulario = async (
  user: ReturnType<typeof userEvent.setup>,
  datos: { negocio?: string; email: string; password: string },
) => {
  if (datos.negocio !== undefined) {
    await user.type(screen.getByLabelText(/Nombre de tu negocio/), datos.negocio);
  }
  await user.type(screen.getByLabelText("Email"), datos.email);
  await user.type(screen.getByLabelText("Contraseña"), datos.password);
};

describe("Register", () => {
  beforeEach(() => {
    registerMock.mockReset();
  });

  it("muestra los campos de negocio, email, contraseña y el botón de envío", () => {
    renderRegister();
    expect(
      screen.getByLabelText(/Nombre de tu negocio \(opcional\)/),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Crear cuenta" }),
    ).toBeInTheDocument();
  });

  it("valida los campos vacíos", async () => {
    const user = userEvent.setup();
    renderRegister();
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));
    expect(screen.getByText("El email es requerido")).toBeInTheDocument();
    expect(screen.getByText("La contraseña es requerida")).toBeInTheDocument();
    expect(registerMock).not.toHaveBeenCalled();
  });

  it("valida el largo mínimo de la contraseña", async () => {
    const user = userEvent.setup();
    renderRegister();
    await completarFormulario(user, { email: "a@b.com", password: "corta12" });
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));
    expect(
      screen.getByText("La contraseña debe tener al menos 8 caracteres"),
    ).toBeInTheDocument();
    expect(registerMock).not.toHaveBeenCalled();
  });

  it("envía email, contraseña y nombre de negocio al registrarse", async () => {
    const user = userEvent.setup();
    registerMock.mockResolvedValue(
      "Registro exitoso. Revisa tu correo para verificar tu cuenta.",
    );
    renderRegister();
    await completarFormulario(user, {
      negocio: "  Casa Rodríguez  ",
      email: "dueño@casarodriguez.com",
      password: "claveSegura1",
    });
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));
    expect(registerMock).toHaveBeenCalledWith(
      "dueño@casarodriguez.com",
      "claveSegura1",
      "Casa Rodríguez",
    );
  });

  it("muestra la pantalla de éxito tras el registro", async () => {
    const user = userEvent.setup();
    registerMock.mockResolvedValue(
      "Registro exitoso. Revisa tu correo para verificar tu cuenta.",
    );
    renderRegister();
    await completarFormulario(user, {
      email: "a@b.com",
      password: "claveSegura1",
    });
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));
    expect(await screen.findByText("¡Cuenta creada!")).toBeInTheDocument();
    expect(screen.getByText(/Revisa tu correo/)).toBeInTheDocument();
  });

  it("muestra el mensaje del backend cuando el registro falla", async () => {
    const user = userEvent.setup();
    registerMock.mockRejectedValue(new Error("No se pudo completar el registro"));
    renderRegister();
    await completarFormulario(user, { email: "a@b.com", password: "claveSegura1" });
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));
    expect(
      await screen.findByText("No se pudo completar el registro"),
    ).toBeInTheDocument();
  });
});
