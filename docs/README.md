# JSON Studio — Documentación Técnica

Documentación completa del proyecto **JSON Studio** (marca: _JSON Spark_), una extensión de Chrome (Manifest V3) para visualizar, editar y transformar JSON directamente en el navegador.

## Índice

| Documento                                          | Descripción                                                           |
| -------------------------------------------------- | --------------------------------------------------------------------- |
| [Arquitectura](./architecture.md)                  | Visión general del sistema, capas, patrones y pipeline de build       |
| [Componentes](./components.md)                     | Catálogo detallado de cada componente React, props, responsabilidades |
| [Interacción entre componentes](./interactions.md) | Flujos de datos, comunicación entre módulos, diagramas de secuencia   |
| [Known Issues](./known-issues.md)                  | Bugs confirmados, code smells, deuda técnica y mejoras pendientes     |

## Stack Tecnológico

| Tecnología | Versión | Propósito               |
| ---------- | ------- | ----------------------- |
| React      | 19.0.0  | UI declarativa          |
| Zustand    | 5.0.0   | Estado centralizado     |
| TypeScript | 5.9.3   | Tipado estático         |
| Vite       | 7.3.1   | Build tooling + HMR     |
| Vitest     | 4.0.18  | Testing unitario        |
| Chrome MV3 | —       | Plataforma de extensión |

## Métricas del Proyecto

| Métrica           | Valor   |
| ----------------- | ------- |
| Archivos fuente   | ~75+    |
| Tests unitarios   | 123     |
| Tamaño de bundle  | ~272 KB |
| Modos de vista    | 7       |
| Iconos SVG        | 27      |
| Atajos de teclado | ~15     |
| Target Chrome     | 120+    |
