# Generador de CV

Una web para escribir un CV por secciones, verlo al instante y descargarlo en
PDF o Word. Todo ocurre en el navegador: no hay servidor, cuentas ni base de
datos, y nada de lo que se escribe sale del equipo de la persona.

## Privacidad

- **Nada se envía.** La página es estática. El editor, la vista previa y las
  exportaciones (PDF con pdfmake, Word con docx) corren en el navegador.
- **Nada se guarda.** Sin cookies, `localStorage`, `sessionStorage` ni
  IndexedDB. Al cerrar o recargar la pestaña el CV se borra; si hay cambios
  sin descargar, el navegador avisa antes.
- **Seguir otro día.** El Word descargado lleva dentro una copia de los datos
  del CV (una parte Custom XML estándar, `urn:generador-cv:perfil`). Subirlo en
  «Continuar con mi Word» recupera el editor. La copia solo contiene lo que el
  CV muestra: las secciones ocultas no viajan en el archivo. Word conserva esa
  parte al editar y guardar; Google Docs la borra.
- **Garantizado por el navegador.** `vercel.json` sirve una Content Security
  Policy con `connect-src 'none'` y `form-action 'none'`: aunque el código lo
  intentara, la página no puede conectarse a ningún servidor después de cargar.
  Las fuentes y los íconos están dentro del sitio.
- Una prueba (`tests/privacy.test.ts`) falla si el código usa almacenamiento o
  red.

## Desarrollo

Requiere Node 20 o superior.

```bash
npm install
```

```bash
npm run dev
```

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo en `http://localhost:5173` |
| `npm test` | Pruebas (modelo, validador, maqueta, Word, PDF, privacidad) |
| `npm run build` | Comprueba tipos y genera `dist/` |
| `npm run preview` | Sirve `dist/` en `http://localhost:4173` con las mismas cabeceras que Vercel |

## Publicar en Vercel

1. Sube este repositorio a GitHub (la carpeta `streamlit-app/` puede ir
   también; Vercel la ignora gracias a `.vercelignore`).
2. En Vercel, **Add New → Project** e importa el repositorio. `vercel.json` ya
   define el framework (Vite), el comando de build, la carpeta `dist` y las
   cabeceras de seguridad; no hay variables de entorno.
3. Despliega. Para comprobar las cabeceras: `curl -I https://tu-sitio.vercel.app`.

También se puede publicar desde la terminal con `npx vercel` (pide iniciar
sesión). No actives Vercel Web Analytics ni Speed Insights: añadirían scripts
que la CSP bloquea y contradicen la promesa de no recoger datos.

## Páginas legales, SEO y buscadores

- **Páginas estáticas** (HTML sin JavaScript, en español e inglés), con URL
  limpias gracias a `cleanUrls` en `vercel.json`:
  - `/aviso-legal` y `/en/legal-notice`
  - `/privacidad` y `/en/privacy`
  - `/cookies` y `/en/cookies`
  - la 404 bilingüe
- **Cookies:** el sitio no usa cookies ni almacenamiento, así que no lleva banner.
- **Una sola fuente:** `site.config.ts` guarda el correo de contacto, la fecha de
  los textos legales y el título y la descripción de cada página.
- **Lo que genera `vite/site-plugin.ts` al compilar:**
  - `canonical`, Open Graph, Twitter Card, `hreflang`, íconos y `theme-color`;
  - el JSON-LD `WebApplication` de la portada;
  - `sitemap.xml` y `robots.txt`.
- **La URL del sitio:** sale de `SITE_URL`. Si no está definida, se usa
  `VERCEL_PROJECT_PRODUCTION_URL`, que Vercel define al compilar, así que con el
  dominio `.vercel.app` o uno propio no hay que configurar nada.
- **Google Search Console:**
  1. Añade la propiedad.
  2. Verifícala por DNS, o define `GOOGLE_SITE_VERIFICATION` en Vercel con el
     código de la meta etiqueta y vuelve a desplegar.
  3. Envía `/sitemap.xml`.

  No hay ficha de Google Business: es solo para negocios con local o zona de servicio.
- **HTTPS:** Vercel redirige siempre a HTTPS. Además, `vercel.json` envía HSTS y
  `upgrade-insecure-requests`.
- **Íconos e imagen para redes:** `favicon.ico`, `apple-touch-icon.png`,
  `icon-*.png` y `og-image.jpg`. Se generaron una vez con Chrome sin interfaz a
  partir de `public/favicon.svg` y del motivo de la portada. Una prueba falla si
  alguna imagen de `public/` pasa de 100 KB.
- **Comprobaciones:**
  - `npm run check:links` revisa los enlaces internos y las anclas de `dist/`;
    con `--external` también los externos.
  - `npm run lighthouse` mide la portada servida por `npm run preview`.

  Lighthouse marca «robots.txt» como fallido porque lo descarga desde la página y
  la CSP (`connect-src 'none'`) lo bloquea. Los buscadores lo leen directamente,
  sin ese problema.

## Estructura

```
src/
  model/       perfil (tipos, lectura tolerante de datos, visibilidad) y secciones
  lib/         validador de viñetas y formato de fechas y enlaces
  document/    buildDocument: una maqueta para la vista previa, el PDF y el Word
  export/      Word (docx + datos incrustados), PDF (pdfmake) y lectura del Word
  components/  interfaz (React) con el sistema de diseño
  i18n/        textos en español e inglés
  styles/      tokens, componentes y diseño de la app
tests/         Vitest
vite/          plugin que genera metas, JSON-LD, sitemap y robots desde site.config.ts
*.html, en/    portada (index.html), páginas legales y 404
scripts/       profile-to-docx: convierte perfiles JSON de la versión Streamlit
streamlit-app/ versión anterior en Python, para uso local
```

## Perfiles de la versión Streamlit

La web no abre JSON. Para continuar en la web un perfil guardado por la versión
Streamlit, conviértelo en tu equipo a un Word con datos:

```bash
npm run profile-to-docx -- streamlit-app/profiles/mi_perfil.json --out streamlit-app/exports
```

El título profesional, el resumen y las secciones ocultas no pasan al Word,
porque ninguna de las dos versiones los exporta.

## Licencias de terceros

- Instrument Sans, Instrument Serif y Carlito: SIL Open Font License 1.1
  (`public/fonts/licenses`). El PDF usa una versión reducida de Carlito con
  otro nombre, como exige su licencia (`src/export/fonts/README.md`).
- Íconos: Material Symbols Rounded, Apache 2.0.
