import { describe, expect, it } from 'vitest';
import { getErrorMessage, handleResponse } from './http';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('handleResponse', () => {
  it('desenvuelve data cuando el envelope es OK', async () => {
    const data = { hola: 1 };
    await expect(
      handleResponse(jsonResponse({ status: 'OK', message: 'ok', data })),
    ).resolves.toEqual(data);
  });

  it('lanza el mensaje cuando status no es OK aunque la respuesta sea 200', async () => {
    await expect(
      handleResponse(jsonResponse({ status: 'ERROR', message: 'Falló', data: null })),
    ).rejects.toThrow('Falló');
  });

  it('lanza el mensaje cuando la respuesta no es ok', async () => {
    await expect(
      handleResponse(jsonResponse({ status: 'ERROR', message: 'No encontrado' }, 404)),
    ).rejects.toThrow('No encontrado');
  });

  it('usa un mensaje genérico si no viene message', async () => {
    await expect(
      handleResponse(jsonResponse({ status: 'ERROR' }, 500)),
    ).rejects.toThrow('Ocurrió un error');
  });
});

describe('getErrorMessage', () => {
  it('extrae el message de un body JSON', async () => {
    await expect(
      getErrorMessage(jsonResponse({ message: 'Token inválido' }, 401), 'fallback'),
    ).resolves.toBe('Token inválido');
  });

  it('usa el fallback cuando el body no es JSON', async () => {
    const response = new Response('<html>nope</html>', { status: 500 });
    await expect(getErrorMessage(response, 'fallback')).resolves.toBe('fallback');
  });

  it('usa el fallback cuando el JSON no tiene message', async () => {
    await expect(
      getErrorMessage(jsonResponse({ foo: 1 }, 400), 'fallback'),
    ).resolves.toBe('fallback');
  });
});
