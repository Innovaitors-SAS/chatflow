# Chatflow — Editor visual de flujos de alarmas PEGSA

[![Manual de uso](https://img.shields.io/badge/Manual%20de%20uso-leer-2563eb?style=for-the-badge&logo=readthedocs&logoColor=white)](docs/MANUAL.md)
[![Manual en PDF](https://img.shields.io/badge/Manual-PDF-ef4444?style=for-the-badge&logo=adobeacrobatreader&logoColor=white)](docs/Manual-Chatflow.pdf)

Chatflow es una aplicación web de una sola página (SPA) para diseñar los flujos de
troubleshooting de las alarmas PEGSA y exportarlos como archivos YAML que consume el
[chatbot de soporte técnico](https://github.com/Innovaitors-SAS/chatbot-soporte-tecnico-pegsa).
El flujo se arma sobre un lienzo a partir de nodos y conexiones, se prueba con un
simulador de chat integrado y se descarga como un `.zip` desplegable que agrupa la
definición del flujo y sus archivos de apoyo (PDF, imágenes, video).

Producción: `https://chatflow.chatbotpegsa.com` (archivos estáticos servidos por Nginx).

Para construir o editar un flujo, consulta el [Manual de uso](docs/MANUAL.md)
([PDF](docs/Manual-Chatflow.pdf)). El resto de este documento describe el stack, la
arquitectura y el despliegue.

## Contenido

1. [Stack técnico](#1-stack-técnico)
2. [Arquitectura](#2-arquitectura)
3. [Formato de salida (YAML)](#3-formato-de-salida-yaml)
4. [Estructura del ZIP exportado](#4-estructura-del-zip-exportado)
5. [Datos y configuración](#5-datos-y-configuración)
6. [Cómo correr](#6-cómo-correr)
7. [Despliegue](#7-despliegue)
8. [Cambios recientes](#8-cambios-recientes)

---

## 1. Stack técnico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework UI | React | 19.1.0 |
| Build y dev server | Vite | 7.0.4 |
| Diagramación | ReactFlow (`reactflow`) | 11.11.4 |
| Resize de nodos | `@reactflow/node-resizer` | 2.2.14 |
| Layout automático | `dagre` | 0.8.5 |
| Generación y parseo de YAML | `js-yaml` | 4.1.0 |
| Empaquetado ZIP | `jszip` | 3.10.1 |
| IDs únicos | `uuid` | 11.1.0 |
| Linting | ESLint | 9.30.1 |
| Runtime de build | Node | 18 (alpine en Docker) |

La aplicación corre por completo en el cliente; no tiene backend propio. La persistencia
es `localStorage` y el intercambio de datos ocurre mediante exportación e importación de
archivos `.zip`.

---

## 2. Arquitectura

```
chatflow/
├── src/
│   ├── main.jsx                     # Punto de entrada React
│   ├── App.jsx                      # Layout, persistencia, import/export
│   ├── components/
│   │   ├── FlowDiagram.jsx          # Editor principal: estado de nodos/edges y generación de YAML
│   │   ├── Sidebar.jsx              # Panel lateral con el YAML generado (resaltado)
│   │   ├── HelpTutorial.jsx         # Modal de ayuda y tipos de nodo
│   │   ├── nodes/
│   │   │   ├── StartNode.jsx        # Inicio de alarma (código y tipo)
│   │   │   ├── ConditionActionNode.jsx  # Paso con texto, condición y acción
│   │   │   ├── DecisionNode.jsx     # Bifurcación (sí/no u opciones)
│   │   │   ├── GoToNode.jsx         # Salto a otra alarma
│   │   │   └── GoToExitNode.jsx     # Fin del flujo
│   │   ├── edges/CustomEdge.jsx     # Conexiones con etiqueta editable
│   │   └── chatbot/                 # Simulador de chat para probar el flujo
│   │       ├── Chatbot.jsx
│   │       └── ChatMessage.jsx
│   └── index.css / App.css          # Tema oscuro y estilos
├── vite.config.js                   # Configuración de Vite y middleware de escritura de index.yaml
├── Dockerfile                       # Build multi-stage que produce el bundle estático
├── index.yaml                       # Registro de alarmas de referencia
└── package.json
```

### Tipos de nodo

| Tipo | Forma | Datos | Propósito |
|------|-------|-------|-----------|
| `start` | Círculo | `alarmCode`, `alarmType` | Punto de entrada del flujo |
| `condition` | Rectángulo | `text`, `condition`, `action`, `file` | Paso del troubleshooting; puede enviar un archivo o crear un ticket |
| `decision` | Rombo | `options[]` | Bifurcación (sí/no o múltiples opciones) |
| `goto` | Rectángulo | `alarmCode` | Salta a otra alarma |
| `exit` | Círculo | `text` | Termina el flujo |

---

## 3. Formato de salida (YAML)

El diagrama se traduce a YAML en tiempo real con la siguiente estructura:

```yaml
graph:
  id: "graph_alarm_1019"
  description: "1019"
  nodes:
    - id: "1019_start"
      text: "Esta es la Alarma 1019..."
      next: "confirm_pressure"
    - id: "confirm_pressure"
      text: "Presión de agua de camisas baja"
      decision:
        condition: "¿Es correcto?"
        yes: "verify_pressure"
        no: "verify_alarm_details"
    - id: "verify_pressure"
      text: "Verifique..."
      action: "Enviar Manual de usuario ..."   # dispara el envío de un archivo
      next: "siguiente_nodo"
```

El campo `next` y las opciones de `decision` aceptan: el id de un nodo, `end`,
`goto__<CODE>` (saltar a otra alarma) y `create_ticket_in_db` (crear ticket).

---

## 4. Estructura del ZIP exportado

El botón de exportar genera `alarma<CODE>.zip` con el flujo y sus archivos de apoyo:

```
alarma1019.zip
├── alarma1019.yml              # Definición del flujo (YAML)
├── graph_layout_metadata.json  # Posiciones de los nodos y viewport (para reimportar)
└── extra_metadata/             # Archivos de apoyo (PDF, PNG, JPG, MP4, XLSX...)
    ├── manual_motor.pdf
    └── diagrama.png
```

Este `.zip` es la entrada que consume el script `deploy_alarmas.sh` del proyecto del
chatbot. También se puede reimportar en Chatflow para seguir editando un flujo existente:
la importación reconstruye nodos, posiciones y archivos.

---

## 5. Datos y configuración

Persistencia local: `localStorage` bajo la clave `chatflow-data`, que guarda nodos,
edges, viewport y estado del sidebar con auto-guardado debounced.

Variables de entorno (`.env`):

- `NODE_ENV`
- `VITE_PORT` — puerto del dev server.

Integraciones externas:

- Enlace a la carpeta de SharePoint con los manuales y archivos de alarmas (botón
  "Archivos").
- Referencia al bucket `s3://pegsa-chatbot/Flujos/`, que es el almacenamiento de
  producción. La subida real la realiza el script de deploy, no esta aplicación.

### Endpoint de desarrollo

En modo `dev`, `vite.config.js` expone un middleware:

| Método | Ruta | Propósito |
|--------|------|-----------|
| `POST` | `/api/update-index-yaml` | Escribe `index.yaml` localmente durante el desarrollo |

En producción no existen endpoints HTTP: la aplicación se sirve como archivos estáticos.

---

## 6. Cómo correr

### Desarrollo

```bash
npm install
npm run dev        # http://localhost:5173
```

Otros scripts:

```bash
npm run build      # genera dist/ (bundle estático optimizado)
npm run preview    # sirve dist/ localmente
npm run lint       # ESLint
```

### Build con Docker

El `Dockerfile` es multi-stage: compila con `node:18-alpine` y deja el bundle estático en
`dist/` para servirlo con Nginx.

```bash
docker build -t chatflow-builder .
# copiar el contenido de /app/dist al servidor estático (chatflow-dist)
```

---

## 7. Despliegue

Chatflow se sirve como archivos estáticos desde Nginx en el servidor PEGSA:

- Dominio: `chatflow.chatbotpegsa.com` (HTTPS, TLS 1.2/1.3, certificado vía AWS ACM y
  PKCS#11 en enclave).
- `root` de Nginx: `/home/ubuntu/whatsapp_bot_pegsa/chatflow-dist`. La configuración está
  en `whatsapp_bot_pegsa/nginx/sites-available/chatflow-app.conf`.
- Routing SPA: `try_files $uri $uri/ /index.html`.

Para actualizar producción: ejecuta `npm run build`, copia el contenido de `dist/` al
directorio `chatflow-dist` del servidor y recarga Nginx.

---

## 8. Cambios recientes

- El bundle se genera y se despliega como archivos estáticos detrás de Nginx (commit
  `3d74caa`).
- Validaciones del editor: los nodos `decision` requieren todas sus opciones conectadas y
  sin duplicados; los nodos `condition` admiten una sola salida hacia
  `decision`/`exit`/`goto`.
- Sanitización de nombres de archivo en `extra_metadata/`: se eliminan tildes y caracteres
  especiales.
- Resaltado del camino recorrido en el simulador de chat y deserialización correcta de
  objetos `File` desde `localStorage`.
</content>
</invoke>
