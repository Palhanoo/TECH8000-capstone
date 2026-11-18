# Signal Club

Dashboard de Vite para el proyecto TECH8000. Usa los mismos datos de prototipo que la app Signal Club
(`prototypes/bruno`): los estudiantes y las lecturas vienen de `shared/` en la raíz del repositorio.

## Ejecutar

El sitio completo se compila con un solo Vite desde la raíz del repositorio, con Node.js 22.12 o más reciente:

```sh
npm ci
npm run dev
```

Abre `/web-app-signal-club/` en la URL que imprime Vite. Para probar el compilado ejecuta `npm run build` y luego `npm run preview`.

## Flujo de la demo

- Filtra las lecturas por país y tecnología para actualizar los gráficos y la tabla. **Export CSV** descarga la selección.
- **Add reading** permite copiar manualmente las métricas de Field Test Mode. El navegador no lee los datos de radio del teléfono directamente.
- Los datos se guardan en el navegador (`localStorage`, clave `signal-club-shared-db`) y se comparten con la app Signal Club del mismo sitio: una lectura añadida aquí aparece en su feed, y las lecturas grabadas allí aparecen aquí, incluso con las dos abiertas en pestañas distintas.
- En **Community**, elige un estudiante y pulsa **Send**. El chat simula el envío y conserva cada conversación en el navegador.
