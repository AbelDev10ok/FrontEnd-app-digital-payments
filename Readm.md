# Ejercicio de Implementación Full Stack

## 1. Requisitos / Introducción

Necesitas implementar una aplicación web simple que te permita tomar notas, etiquetarlas y filtrarlas. El desarrollo se divide en dos fases:

- **Fase 1**: Creación de notas
- **Fase 2**: Aplicación de etiquetas y filtrado

### CONSIDERACIONES IMPORTANTES:

- La Fase 1 es obligatoria para aprobar este ejercicio, mientras que la Fase 2 proporcionará puntos extra si se realiza.
- El contenido debe persistirse en una base de datos relacional utilizando un ORM - no se permite almacenamiento en memoria o mocks.

## 2. Entregables

Para aprobar este ejercicio, además de la implementación, debes:

- Subir el código a un repositorio privado de GitHub proporcionado por el personal de RRHH de Ensolvers y usar git correctamente. Tanto el frontend como el backend deben subirse a ese repositorio, en carpetas llamadas `backend` y `frontend` respectivamente.
- Incluir un script bash/zsh que permita ejecutar la aplicación. Idealmente, la aplicación debería iniciarse en un entorno Linux/macOS simplemente ejecutando un comando. Este comando debería configurar todo lo necesario para ejecutar la aplicación, como configurar un esquema de base de datos, pre-crear cualquier archivo de configuración, etc.
- Incluir un archivo `README.md` describiendo todos los runtimes, motores, herramientas, etc., requeridos para ejecutar la aplicación, con sus versiones concretas (por ejemplo, npm 18.17, etc).

## 3. Tecnologías

No hay restricción sobre la tecnología a utilizar, siempre que:

- Estructures la aplicación como una Single Page Web Application (SPA), es decir, frontend y backend son aplicaciones diferentes. Este es el caso general cuando usas React, Angular, Vue.js, o cualquier otro framework de UI similar. Por favor considera que renderizar una página web en el lado del servidor (usando JSP, EJS, Smarty, Blade, etc.) pero usando un poco de JS para, por ejemplo, obtener algunos datos, no es una SPA pura. Necesitas implementar una aplicación aislada, en una carpeta separada, con su propio package.json y dependencias.
- La aplicación backend exponga una API REST para la comunicación con el frontend.
- La aplicación backend esté separada en capas (por ejemplo, Controladores, Servicios, DAOs/Repositorios). Es importante mencionar que Laravel (PHP) y Django (Python) NO SOPORTAN esa separación de capas por defecto al construir aplicaciones, por lo que si envías un backend hecho directamente con esas tecnologías sin ningún ajuste adicional en la arquitectura, probablemente necesite ser mejorado o el ejercicio será rechazado directamente. Por otro lado, Spring Boot (Java) y Nestjs (Node.js) son dos tecnologías que imponen y/o facilitan el uso de esta separación de capas. Para más información, puedes consultar la definición del patrón Service Layer y un ejemplo en Spring Boot.

## 4. Historias de Usuario y Mockups

### Fase 1

#### Historias de Usuario

- Como usuario, quiero poder crear, editar y eliminar notas.
- Como usuario, quiero archivar/desarchivar notas.
- Como usuario, quiero listar mis notas activas.
- Como usuario, quiero listar mis notas archivadas.

### Fase 2

#### Historias de Usuario

- Como usuario, quiero poder agregar/eliminar categorías a las notas.
- Como usuario, quiero poder filtrar notas por categoría.

## 5. Requisitos Funcionales y No Funcionales Extra

- **Login**: Si proporcionas una pantalla de inicio de sesión, documenta el usuario/contraseña por defecto en `README.md`.
- **Versión desplegada en vivo**: Si despliegas la aplicación (por ejemplo, vía Heroku), agrega la URL de la versión en ejecución en vivo a `README.md`.
