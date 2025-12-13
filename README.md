# Coche Rebelde - Minigames Server

Servidor dedicado para minijuegos del juego principal Coche Rebelde 3D. Los jugadores son redirigidos desde el servidor del juego principal a este servidor para jugar los minijuegos.

## 🎮 Características

- 6 vistas de minijuegos listas para implementar
- Estilo pixel art retro con tema de gaming
- Canvas HTML5 para renderizado de juegos
- Navegación basada en parámetros URL
- Diseño responsive con estilos CSS personalizados

## 📋 Requisitos Previos

- Node.js (versión 18 o superior)
- npm o yarn

## 🚀 Instalación

1. Clona o navega al directorio del proyecto:
```bash
cd MJ
```

2. Instala las dependencias:
```bash
npm install
```

## ▶️ Ejecutar en Desarrollo

Para iniciar el servidor de desarrollo:

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:5173` (puerto por defecto de Vite).

### Acceder a los Minijuegos

Una vez que el servidor esté corriendo, puedes acceder a los minijuegos de las siguientes formas:

1. **Página principal (selector de minijuegos)**:
   - `http://localhost:5173/`
   - Muestra una lista de todos los minijuegos disponibles

2. **Acceso directo a un minijuego específico**:
   - `http://localhost:5173/?game=1` - Minigame 1
   - `http://localhost:5173/?game=2` - Minigame 2
   - `http://localhost:5173/?game=3` - Minigame 3
   - `http://localhost:5173/?game=4` - Minigame 4
   - `http://localhost:5173/?game=5` - Minigame 5
   - `http://localhost:5173/?game=6` - Minigame 6

3. **Desde el juego principal**:
   - El juego principal puede redirigir a este servidor usando los parámetros URL arriba mencionados

## 🏗️ Construir para Producción

Para crear una build optimizada para producción:

```bash
npm run build
```

Los archivos de producción se generarán en la carpeta `dist/`.

Para previsualizar la build de producción localmente:

```bash
npm run preview
```

## 📁 Estructura del Proyecto

```
MJ/
├── src/
│   ├── components/
│   │   └── layout/
│   │       ├── Minigame1.jsx    # Vista del minijuego 1
│   │       ├── Minigame2.jsx    # Vista del minijuego 2
│   │       ├── Minigame3.jsx    # Vista del minijuego 3
│   │       ├── Minigame4.jsx    # Vista del minijuego 4
│   │       ├── Minigame5.jsx    # Vista del minijuego 5
│   │       ├── Minigame6.jsx    # Vista del minijuego 6
│   │       ├── Lobby.jsx        # Componente de lobby (no usado actualmente)
│   │       └── index.js         # Exportaciones
│   ├── styles/
│   │   └── game.css             # Estilos pixel art del juego
│   ├── App.jsx                  # Componente principal con navegación
│   ├── main.jsx                 # Punto de entrada
│   └── index.css                # Estilos base
├── public/                      # Archivos estáticos
├── index.html                   # HTML principal
├── package.json                 # Dependencias y scripts
└── vite.config.js              # Configuración de Vite
```

## 🎨 Estilos

Los estilos utilizan un tema pixel art retro con:
- Fuente: "Press Start 2P"
- Paleta de colores oscura con acentos brillantes
- Efectos 3D en botones y paneles
- Canvas con renderizado pixelado

Todos los estilos están en `src/styles/game.css`.

## 📝 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo con hot reload
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la build de producción
- `npm run lint` - Ejecuta ESLint para verificar el código

## 🔧 Desarrollo

Cada minijuego está en su propio componente en `src/components/layout/`. Actualmente, todos muestran contenido placeholder ("Coming Soon..."). Para implementar un minijuego:

1. Edita el componente correspondiente (ej: `Minigame1.jsx`)
2. Agrega la lógica del juego en el canvas
3. Implementa los handlers de eventos necesarios

Los componentes reciben props `gameData` y `onGameUpdate` que puedes usar para comunicarte con el servidor del juego principal.

## 🌐 Integración con el Juego Principal

Para redirigir desde el juego principal a este servidor, usa URLs con el parámetro `game`:

```javascript
// Ejemplo de redirección desde el juego principal
window.location.href = 'http://minigames-server.com/?game=1';
```

El servidor de minijuegos detectará el parámetro y mostrará el minijuego correspondiente.
