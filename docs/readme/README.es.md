# FreshDig for SoundCloud

> 🌐 [日本語](../../README.md) | [English](README.en.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [Español](README.es.md) | [Tiếng Việt](README.vi.md)

FreshDig es una extensión para Chrome y Edge dirigida a oyentes, DJ y productores que descubren artistas mediante las estaciones de SoundCloud. Dig aplica tus reglas a los candidatos y a la cola que SoundCloud proporciona.

## Qué problema resuelve

Al escuchar una estación aparecen una y otra vez canciones que ya conoces o artistas que prefieres evitar. FreshDig elige la siguiente canción usando la información de SoundCloud y la configuración local de FreshDig.

## Funciones principales

- **Modo Dig**: detecta y salta canciones, artistas y géneros con Like, seguidos o excluidos
- **Saltar canciones ya escuchadas**: solo si lo activas en los ajustes de Dig; registra las canciones que realmente sonaron 10 segundos y las salta la próxima vez (desactivado por defecto)
- **Dislike / Hate**: excluir una canción o un artista completo
- **Lista para escuchar después**: guarda artistas y abre su página de canciones desde el icono de la extensión
- **Mini reproductor**: ventana aparte para reproducir, pasar, ajustar volumen, añadir a playlist, Like, Repost, Follow y excluir
- **Copia de seguridad de listas**: exporta las cuatro listas (escuchar después, canciones, artistas y géneros bloqueados) en Markdown y restaura desde JSON
- **Informe de errores**: guarda un informe de diagnóstico local para investigar paradas de reproducción y similares

## Cómo se registran las canciones escuchadas

Este ajuste está desactivado por defecto. Al activarlo, solo se registran por ID las canciones cuya posición avanzó realmente 10 segundos. Buscar o pausar no cuenta. Los registros se guardan en la IndexedDB de la página y, si no está disponible, en localStorage. Si abres directamente la página de canciones de un artista, se prioriza esa reproducción y no se aplican las reglas de salto de Dig.

## Datos y privacidad

Los ajustes, listas e historial de FreshDig se guardan en tu navegador. FreshDig no tiene servidor de análisis propio ni envía datos con fines publicitarios. Acciones como Like, Follow, Repost y añadir a playlist operan tu cuenta de SoundCloud, por lo que se comunican con SoundCloud.

## Instalación

1. Abre `edge://extensions` o `chrome://extensions`
2. Activa el modo de desarrollador
3. Pulsa «Cargar descomprimida» y elige la carpeta de la extensión

Con Tampermonkey puedes cargar `soundcloud_fresh_station.user.js` desde el repositorio.

## Licencia

MIT License
