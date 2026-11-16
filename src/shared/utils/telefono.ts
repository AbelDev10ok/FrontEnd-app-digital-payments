const PREFIJO_CELULAR_AR = '+549';
const LARGO_NACIONAL = 10;

/**
 * Largo del numero nacional argentino sin 0 ni 15 (area + abonado). El area
 * tiene 2, 3 o 4 digitos, por eso el 15 del formato viejo puede arrancar en la
 * posicion 2, 3 o 4 del numero sin el 0 inicial.
 */
function quitarQuince(digitos: string): string | null {
  const candidatos: number[] = [];
  for (let i = 2; i <= 4; i += 1) {
    if (digitos.slice(i, i + 2) === '15') {
      candidatos.push(i);
    }
  }

  if (candidatos.length !== 1) {
    return null;
  }

  return digitos.slice(0, candidatos[0]) + digitos.slice(candidatos[0] + 2);
}

function esNacionalValido(digitos: string): boolean {
  return digitos.length === LARGO_NACIONAL && !digitos.startsWith('0');
}

/**
 * Lleva un celular argentino al formato E.164 que se guarda en el cliente:
 * +549 + area + abonado. Acepta el numero nacional (11 5555-1234), el viejo
 * formato con 0 y 15 (011 15 5555-1234) y un valor que ya venga internacional
 * (+54 9 11 5555-1234). Devuelve null si no es un celular argentino valido.
 */
export function normalizarTelefonoArgentino(telefono: string | null | undefined): string | null {
  if (!telefono) {
    return null;
  }

  let digitos = telefono.replace(/\D/g, '');
  if (!digitos) {
    return null;
  }

  if (digitos.startsWith('54')) {
    digitos = digitos.slice(2);
    if (digitos.startsWith('9')) {
      digitos = digitos.slice(1);
    }
    if (digitos.startsWith('0')) {
      digitos = digitos.slice(1);
    }
    return esNacionalValido(digitos) ? PREFIJO_CELULAR_AR + digitos : null;
  }

  if (digitos.startsWith('0')) {
    const sinCero = digitos.slice(1);
    // 0 + area + 15 + abonado: 0 + 2 (15) + 10 (area + abonado)
    const nacional = digitos.length === 13 ? quitarQuince(sinCero) : sinCero;
    return nacional && digitos.length <= 13 && esNacionalValido(nacional)
      ? PREFIJO_CELULAR_AR + nacional
      : null;
  }

  // Area + 15 + abonado, sin el 0 inicial
  if (digitos.length === 12) {
    const nacional = quitarQuince(digitos);
    return nacional && esNacionalValido(nacional) ? PREFIJO_CELULAR_AR + nacional : null;
  }

  // Movil nacional con el 9 del formato internacional pero sin el 54
  if (digitos.length === 11 && digitos.startsWith('9')) {
    const nacional = digitos.slice(1);
    return esNacionalValido(nacional) ? PREFIJO_CELULAR_AR + nacional : null;
  }

  return esNacionalValido(digitos) ? PREFIJO_CELULAR_AR + digitos : null;
}

/**
 * Numero nacional (area + abonado) de un telefono guardado, o null si no se
 * puede interpretar como celular argentino.
 */
export function telefonoNacional(telefono: string | null | undefined): string | null {
  const normalizado = normalizarTelefonoArgentino(telefono);
  return normalizado ? normalizado.slice(PREFIJO_CELULAR_AR.length) : null;
}

/**
 * Texto que se muestra en listados y fichas. Los telefonos nuevos se guardan
 * en E.164 y se muestran sin el prefijo internacional; los legados que no se
 * pueden normalizar se dejan tal como estan.
 */
export function formatearTelefono(telefono: string | null | undefined): string {
  return telefonoNacional(telefono) ?? (telefono ?? '');
}

/**
 * Enlace de WhatsApp con el mensaje ya escrito para el cliente.
 *
 * wa.me necesita el numero internacional sin '+' ni separadores, por eso se
 * parte del E.164 normalizado: un telefono legado que no se puede interpretar
 * como celular argentino no abre un chat valido y devuelve null.
 */
/**
 * Arma el enlace tel: del telefono de un cliente. Los telefonos se cargan con
 * espacios, guiones o parentesis; el URI tel: necesita solo digitos, con el +
 * internacional unicamente al principio.
 */
export function buildTelHref(telefono: string | null | undefined): string | null {
  if (!telefono) {
    return null;
  }

  const limpio = telefono.trim().replace(/[^\d+]/g, '');
  if (!/\d/.test(limpio)) {
    return null;
  }

  const numero = limpio.startsWith('+')
    ? `+${limpio.slice(1).replace(/\+/g, '')}`
    : limpio.replace(/\+/g, '');

  return `tel:${numero}`;
}

/**
 * Enlace de WhatsApp con el mensaje ya escrito para el cliente.
 *
 * wa.me necesita el numero internacional sin '+' ni separadores, por eso se
 * parte del E.164 normalizado: un telefono legado que no se puede interpretar
 * como celular argentino no abre un chat valido y devuelve null.
 */
export function buildWhatsAppUrl(
  telefono: string | null | undefined,
  mensaje: string,
): string | null {
  const normalizado = normalizarTelefonoArgentino(telefono);
  if (!normalizado) {
    return null;
  }
  return `https://wa.me/${normalizado.slice(1)}?text=${encodeURIComponent(mensaje)}`;
}
