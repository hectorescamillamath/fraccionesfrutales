# 🍎 FrutiFracciones

Aplicación web interactiva para **aprender y practicar operaciones con fracciones**
(suma, resta, multiplicación y división) usando frutas cortadas en partes iguales.
Funciona 100 % en el navegador: solo HTML, CSS y JavaScript (sin dependencias ni instalación).

## 📁 Archivos

| Archivo      | Qué contiene                                              |
|--------------|-----------------------------------------------------------|
| `index.html` | Estructura accesible de la página                         |
| `styles.css` | Estilos, colores, responsivo y animaciones                |
| `script.js`  | Matemáticas, gráficos SVG, pasos explicativos y práctica  |
| `README.md`  | Estas instrucciones                                       |

## 🚀 Publicar en GitHub Pages

1. Crea un repositorio nuevo en GitHub (por ejemplo `frutifracciones`), público.
2. Sube `index.html`, `styles.css`, `script.js` y `README.md` a la **raíz** del repositorio
   (botón **Add file → Upload files**, o con `git push`).
3. Ve a **Settings → Pages**.
4. En **Build and deployment → Source**, elige **Deploy from a branch**.
5. Selecciona la rama **main** y la carpeta **/ (root)**, y pulsa **Save**.
6. Espera 1–2 minutos. Tu app estará en:
   `https://TU-USUARIO.github.io/frutifracciones/`

### Probar en tu computador antes de publicar
Abre `index.html` con doble clic, o ejecuta un servidor local:
```bash
python -m http.server 8000
# luego visita http://localhost:8000
```

## 🎨 Personalización rápida

- **Frutas, límites, colores, mensajes y niveles:** objeto `CONFIG` y catálogo `FRUITS` al inicio de `script.js`.
- **Paleta, tipografías y bordes:** variables `:root` al inicio de `styles.css`.
- **Textos y títulos:** directamente en `index.html`.

Cada bloque de código incluye un comentario con su **propósito** y sus **puntos de edición**.

## 📚 Notas pedagógicas

- Suma/resta con distinto denominador: la app muestra la conversión al **mínimo común denominador**
  (líneas sólidas = cortes originales, punteadas = cortes nuevos).
- Multiplicación: se interpreta como «tomar una parte de otra parte».
- División: se interpreta como «¿cuántas veces cabe?» y luego se muestra el atajo de invertir y multiplicar.
- Toda fracción resultante se simplifica automáticamente con su representación visual.
