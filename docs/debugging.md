# Debug Logging

JSON Spark incluye un sistema de logging condicional que permite activar/desactivar logs de diagnóstico.

## En Desarrollo

Durante el desarrollo (`npm run dev`), los logs están **activados automáticamente**. Verás mensajes con emojis:

- 🔵 Service Worker (background)
- 🟢 Viewer (frontend)

## En Producción

Por defecto, los logs de debugging están **desactivados** en builds de producción (`npm run build:ext`).

### Activar debugging en producción

Si necesitas diagnosticar problemas en la extensión instalada:

1. Abre DevTools en el viewer o en el Service Worker
2. En la consola, ejecuta:
   ```javascript
   __jsonSparkDebug.enable();
   ```
3. Recarga la página para ver los logs

### Desactivar debugging

```javascript
__jsonSparkDebug.disable();
```

### Verificar estado

```javascript
__jsonSparkDebug.status();
```

## Para Desarrolladores

El sistema de logging está en `src/shared/logger.ts`.

- En lugar de `console.log()`, usa `debug.log()`
- En lugar de `console.warn()`, usa `debug.warn()`
- En lugar de `console.error()`, usa `debug.error()`

`debug.error()` siempre muestra el primer argumento, pero solo muestra contexto completo cuando debugging está activado.
