# Registro de cambios

Todos los cambios relevantes del proyecto se documentan aquí. El formato sigue
[Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa
[versionado semántico](https://semver.org/lang/es/).

## [1.1.0] - 2026-10-25

### Añadido

- **Licencia y documentación:**
  - licencia MIT;
  - documentación del proyecto: README, arquitectura, guía de contribución,
    política de seguridad, código de conducta y este registro;
  - integración continua en GitHub Actions y plantillas de issues y pull requests.
- **Páginas legales y 404:** aviso legal, política de privacidad y política de
  cookies en español e inglés, y página 404 bilingüe.
- **Metadatos para buscadores y redes:**
  - título y descripción por página, canonical, Open Graph, Twitter Card,
    `hreflang` y JSON-LD `WebApplication`;
  - `sitemap.xml` y `robots.txt`, generados desde `site.config.ts`.
- **Íconos:** `favicon.ico`, ícono de Apple, íconos del manifest
  (`site.webmanifest`) e imagen para redes sociales.
- **Enlaces y comprobaciones:**
  - enlaces legales en la portada, el riel y el diálogo de privacidad;
  - `npm run check:links` y pruebas del sitio (metas, sitemap, imágenes y
    cabeceras).

### Cambiado

- Cabecera HSTS, `upgrade-insecure-requests` en la CSP, URL limpias y caché para
  fuentes e íconos.
- Precarga de Instrument Serif, el título grande de la portada. El desplazamiento
  al cargar (CLS) baja a 0.

## [1.0.0] - 2026-10-25

### Añadido

- **Web estática para Vercel** que funciona entera en el navegador: editor por
  secciones, vista previa en vivo y descarga en PDF (pdfmake) y Word (docx).
- **Continuar otro día:** el Word descargado incluye los datos visibles del CV en
  una parte Custom XML y se puede volver a subir para seguir editando.
- **Privacidad:** sin almacenamiento ni cookies, y CSP con `connect-src 'none'`.
- **Una sola maqueta** para la vista previa, el PDF y el Word.
- **Interfaz:**
  - en español e inglés, con tema claro, oscuro y automático;
  - adaptada a móvil.
- **Conversión de perfiles:** script `profile-to-docx` para llevar a la web los
  perfiles JSON de la versión Streamlit.

### Cambiado

- La versión Streamlit pasa a `streamlit-app/`, para uso local.
- La fuente del PDF es «CV Doc Sans», una versión de Carlito sin ligaduras, para
  que el texto se extraiga bien.

### Eliminado

- La exportación y la importación en JSON, el editor JSON avanzado y la
  exportación a LaTeX de la web.

## [0.2.0] - 2026-10-23

### Cambiado

- **Rediseño de la versión Streamlit** con el sistema de diseño «Generador local
  de CV»:
  - riel de secciones, editor por secciones y vista previa en vivo;
  - temas Papel y Tinta.
- Fuentes autoalojadas: la interfaz ya no hace peticiones a Google Fonts.

### Eliminado

- El asistente de IA (Ollama) y su configuración.

## [0.1.0]

- Primera versión local en Streamlit: perfiles JSON y exportación a LaTeX, PDF,
  DOCX y JSON.

[1.1.0]: https://github.com/eddieisoffline/generador-cv/compare/762fb03...main
[1.0.0]: https://github.com/eddieisoffline/generador-cv/compare/e624961...762fb03
[0.2.0]: https://github.com/eddieisoffline/generador-cv/commit/e624961
