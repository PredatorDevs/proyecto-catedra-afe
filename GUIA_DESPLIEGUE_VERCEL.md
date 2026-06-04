# Guia de despliegue en Vercel para proyecto AdonisJS

## 1. Contexto importante
Este proyecto es AdonisJS full-stack (servidor Node + vistas Edge + Lucid + sesiones).

Vercel funciona principalmente con funciones serverless. Por eso, para subir este repo a Vercel de forma correcta, hay que considerar lo siguiente:

- No es un despliegue "Node server tradicional" como en VPS/Render/Railway.
- Debes adaptar el backend a funcion serverless (un handler de entrada) o separar frontend/backend.
- Si quieres cero adaptaciones del runtime de Adonis, lo mas estable suele ser Render/Railway/Fly.

Esta guia deja el camino recomendado para Vercel con adaptacion serverless.

## 2. Requisitos previos

- Cuenta de Vercel
- Repo en GitHub/GitLab/Bitbucket
- Base de datos MySQL publica (RDS, PlanetScale, etc.)
- Dominio emisor verificado en Resend (si usas envio de correo)
- Node.js 20+ local

## 3. Variables de entorno que debes cargar en Vercel

Configura en Project Settings > Environment Variables (Production y Preview):

- NODE_ENV=production
- APP_KEY=tu_app_key_segura
- HOST=0.0.0.0
- PORT=3333
- LOG_LEVEL=info
- SESSION_DRIVER=cookie
- DB_HOST=...
- DB_PORT=3306
- DB_USER=...
- DB_PASSWORD=...
- DB_DATABASE=...
- RESEND_ENABLED=true
- RESEND_API_KEY=...
- RESEND_FROM_EMAIL=...
- RESEND_FROM_NAME=Hotel AFE
- RESEND_TEST_RECIPIENT=...

Notas:

- APP_KEY debe ser estable entre deploys.
- DB_HOST debe aceptar conexiones desde internet (con whitelist/seguridad adecuada).
- Nunca subas secretos al repositorio.

## 4. Preparacion del repositorio

Verifica localmente:

1. npm ci
2. npm run build

Si build falla local, no promociones a Vercel.

## 5. Adaptacion minima para Vercel (serverless)

### 5.1 Archivo vercel.json
Crea un archivo vercel.json en la raiz para enrutar todo al handler serverless.

Contenido recomendado (ajustable):

{
  "version": 2,
  "functions": {
    "api/index.ts": {
      "runtime": "@vercel/node",
      "maxDuration": 30
    }
  },
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/api/index.ts"
    }
  ]
}

### 5.2 Handler de entrada
Crea api/index.ts para inicializar y reutilizar el runtime de Adonis por invocacion.

Puntos clave del handler:

- Cargar la app una sola vez (cache en memoria del modulo).
- Delegar cada request al servidor HTTP de Adonis.
- Evitar reinicializaciones por request para reducir latencia.

Importante:

- La implementacion exacta depende de la version interna de APIs de Adonis.
- Si ya tienes un adaptador oficial/comunitario para tu version, usa ese adaptador en lugar de un bootstrap manual.

## 6. Configuracion del proyecto en Vercel

1. Importa el repositorio.
2. Framework Preset: Other.
3. Build Command: npm run build
4. Install Command: npm ci
5. Output Directory: dejar vacio (manejo por funciones).
6. Node.js Version: 20.x
7. Agrega variables de entorno del paso 3.
8. Deploy.

## 7. Post-deploy checklist

Despues del primer deploy, valida:

1. Login y sesiones (cookie) en dominio Vercel.
2. Modulo de reservaciones y pagos.
3. Generacion de documento fiscal.
4. Descarga PDF del documento fiscal.
5. Envio de correo via Resend.
6. Conexion DB en lectura/escritura.

## 8. Problemas comunes en Vercel

### 8.1 Timeout en rutas pesadas
Sintoma:

- Respuestas 504 o corte en procesos largos.

Acciones:

- Reducir trabajo sincrono por request.
- Mover procesos largos a colas/background (externo).
- Evitar recalculo costoso en la misma respuesta.

### 8.2 Cold starts
Sintoma:

- Primer request lento tras inactividad.

Acciones:

- Reusar instancia inicializada.
- Minimizar carga en bootstrap.

### 8.3 Errores de DB por conexiones
Sintoma:

- Saturacion o errores de pool.

Acciones:

- Ajustar pool de conexiones para serverless.
- Evaluar proxy de conexiones para MySQL.

### 8.4 Correo no enviado
Sintoma:

- Falla en endpoint de envio.

Acciones:

- Confirmar RESEND_ENABLED=true.
- Revisar API key y remitente verificado.
- Confirmar correo destino valido.

## 9. Recomendacion practica para produccion
Si necesitas maxima estabilidad operativa con Adonis full-stack:

- Opcion A: Deploy backend en Render/Railway/Fly y usar Vercel solo para frontend (si separas).
- Opcion B: Mantener Vercel, pero con pruebas de carga y monitoreo desde el primer dia.

## 10. Comandos utiles

- npm ci
- npm run build
- node ace test

Para validar solo el spec funcional usado en este proyecto:

- node ace test functional --files "tests/functional/hotels_phase3_payments.spec.ts"

---

Con esta guia tienes la ruta para desplegar en Vercel de forma controlada, entendiendo claramente las limitaciones de serverless para un proyecto Adonis full-stack.
