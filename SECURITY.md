# Política de seguridad

## Versiones con soporte

Solo la versión publicada en la rama `main` recibe correcciones de seguridad.
La versión Streamlit de `streamlit-app/` es para uso local y no se mantiene como
servicio público.

## Cómo informar de una vulnerabilidad

**No abras un issue público.** Escribe a **e.ddieag451@outlook.com** con el asunto
«Seguridad: Generador de CV» e incluye:

- una descripción del problema y su impacto;
- los pasos para reproducirlo (navegador, versión y, si aplica, un archivo .docx de
  ejemplo **sin datos personales reales**);
- si lo conoces, una propuesta de solución.

Recibirás acuse de recibo en un plazo razonable y te mantendré al tanto mientras se
investiga. Cuando el problema esté corregido se publicará en el
[CHANGELOG](CHANGELOG.md), con reconocimiento si lo deseas.

## Qué interesa especialmente

La promesa del proyecto es que los datos no salen del navegador. Son especialmente
relevantes:

- cualquier forma de que la página envíe datos a un servidor o los guarde en el
  dispositivo;
- formas de saltarse la Content-Security-Policy de `vercel.json`;
- archivos .docx preparados que provoquen ejecución de código, cuelgues o lectura
  de datos ajenos al importarlos;
- datos que viajen en el Word descargado sin que la persona lo espere (por
  ejemplo, secciones ocultas).

## Fuera de alcance

- Ataques que requieren acceso físico al equipo o un navegador comprometido.
- La infraestructura de Vercel o de GitHub, que se reporta a esos proveedores.
- Ausencia de cabeceras sin un impacto demostrable.
