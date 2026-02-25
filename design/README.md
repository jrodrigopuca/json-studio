# Design Assets

Este directorio contiene los archivos fuente editables para el diseño de la extensión.

## icons-source/

Contiene los archivos SVG fuente de los iconos de la extensión. Estos archivos son **solo para edición y referencia**, no se incluyen en el paquete final de la extensión.

### Archivos:
- `icon-16.svg` - Icono 16x16 (fuente editable)
- `icon-32.svg` - Icono 32x32 (fuente editable)
- `icon-48.svg` - Icono 48x48 (fuente editable)
- `icon-128.svg` - Icono 128x128 (fuente editable)

Los iconos PNG (generados desde estos SVG) se encuentran en `public/icons/` y son los que se empaquetan con la extensión.

### Regenerar iconos:

```bash
# Generar todos los iconos desde un diseño específico
node scripts/generate-logo.mjs [1|2|3|4]

# Ejemplo:
node scripts/generate-logo.mjs 4  # Energy Ring design
```

Los SVG se guardan automáticamente aquí y los PNG se generan en `public/icons/`.
