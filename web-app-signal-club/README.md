# Signal Club

Dashboard de Vite para el proyecto TECH8000. Incluye 25 perfiles ficticios y 100 lecturas sintéticas de 14 países y regiones.

## Ejecutar

Con Node.js 22.12 o una versión compatible más reciente:

```sh
npm ci
npm run dev
```

Abre la URL que imprime Vite. Para probar el compilado ejecuta `npm run build` y luego `npm run preview`.

## Flujo de la demo

- Filtra las lecturas por país y tecnología para actualizar los gráficos y la tabla. **Export CSV** descarga la selección.
- **Add reading** permite copiar manualmente las métricas de Field Test Mode. El navegador no lee los datos de radio del teléfono directamente.
- El servidor de desarrollo y de vista previa exponen `GET /api/readings` y `POST /api/readings`. Las lecturas nuevas persisten en `.signal-club/readings.ndjson`. La API está pensada para la demo local y no incluye cuentas.
- En **Community**, elige un estudiante y pulsa **Send**. El chat simula el envío y conserva cada conversación en el navegador.
