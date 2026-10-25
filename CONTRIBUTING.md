# Cómo contribuir

Gracias por querer mejorar el Generador de CV. Esta guía explica cómo preparar el
entorno, qué reglas no se pueden romper y qué revisar antes de abrir un pull
request.

## Antes de empezar

- Para cambios grandes, abre primero un issue y comenta la idea.
- Para problemas de seguridad, no abras un issue: sigue [SECURITY.md](SECURITY.md).
- Al participar aceptas el [código de conducta](CODE_OF_CONDUCT.md).

## Entorno

Necesitas Node.js 22.12 o superior.

```bash
npm install
```

```bash
npm run dev
```

La app queda en `http://localhost:5173`. Para probar con las mismas cabeceras que
en producción (incluida la CSP), compila y sirve `dist/`:

```bash
npm run build
```

```bash
npm run preview
```

## Reglas del proyecto

1. **Privacidad ante todo.**
   - Nada puede enviar datos a la red ni guardarlos en el navegador: ni
     `fetch`, ni `localStorage`, ni cookies, ni analítica.
   - `tests/privacy.test.ts` y la CSP de `vercel.json` lo vigilan. No los
     relajes para que algo funcione: busca otra solución.
2. **Lo que se ve es lo que se exporta.**
   - Cualquier cambio de maqueta va en `src/document/layout.ts`, para que lo
     reflejen a la vez la vista previa, el PDF y el Word.
   - Si añades un campo, revisa `fromDict` y `exportableProfile` en
     `src/model/profile.ts`.
3. **Bilingüe.**
   - Todo texto visible va en `src/i18n/es.ts` y `src/i18n/en.ts`. El tipo
     `MessageKey` obliga a tener las dos versiones.
   - Las páginas legales tienen su pareja en `en/`.
4. **Accesible.**
   - Cada control lleva una etiqueta visible o `aria-label`.
   - Los íconos decorativos van con `aria-hidden`.
   - El color nunca es la única señal.
   - Los textos cumplen un contraste de 4.5:1, usando los tokens de
     `src/styles/tokens.css`.
5. **Sin dependencias en el navegador sin motivo.**
   - Una dependencia nueva para el navegador debe justificar su peso.
   - Las herramientas de desarrollo van en `devDependencies`.
6. **Formato de los datos del Word.**
   - Si cambias la estructura del perfil de forma incompatible, sube `VERSION`
     en `src/export/embed.ts`.
   - Sigue leyendo las versiones anteriores, para no romper los Word que ya se
     descargaron.

## Tareas comunes

**Añadir un campo a un tipo de entrada:**

1. El tipo y su fábrica en `ENTRY_FACTORIES`, en `src/model/profile.ts`.
2. La lectura en `fromDict`.
3. El campo en `ENTRY_SPECS` de `src/model/sections.ts`.
4. La etiqueta y el texto de ejemplo en los dos idiomas.
5. Su línea en `buildDocument`, si debe aparecer en el CV.
6. Pruebas en `tests/model.test.ts` y `tests/layout.test.ts`.

**Cambiar un texto legal:**

1. Edita la página en los dos idiomas.
2. Actualiza `SITE.legalUpdated` en `site.config.ts`.

## Antes de abrir el pull request

```bash
npm test
```

```bash
npm run build
```

```bash
npm run check:links
```

- [ ] Pruebas, tipos y build pasan.
- [ ] No hay enlaces rotos.
- [ ] Probaste el cambio en el navegador, en tema claro y oscuro y en un ancho de
      móvil.
- [ ] Si cambia algo visible, adjuntas una captura.
- [ ] Si cambia el comportamiento, actualizaste el README, `docs/ARCHITECTURE.md`
      o `CHANGELOG.md`.

## Mensajes de commit

Usa el imperativo y una primera línea corta que diga qué cambia, por ejemplo:
«Añadir el campo de nota media a Educación». Si hace falta, explica el porqué en
el cuerpo.

## Licencia

Al contribuir aceptas que tu aportación se publique con la [licencia MIT](LICENSE)
del proyecto.
