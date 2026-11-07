# MathBlast! 2.0 · EDUmind

**Calcula · Razona · Explica.** Juego de matemáticas para el aula, de 1.º de Primaria a 2.º de ESO, con apoyos DUA, ayudas visuales graduadas y modo equipos.

Forma parte del ecosistema de apps educativas libres [EDUmind](https://edumind.es), creado por Luis Vilela Acuña.

## Qué hace

- **4 niveles** por ciclo: 1.º–2.º EP, 3.º–4.º EP, 5.º–6.º EP y 1.º–2.º ESO. Cada nivel abre sus formatos y mezcla un 30 % de repaso del nivel anterior.
- **11 formatos**, combinables entre sí:
  - Cálculo: suma, resta, multiplicación y división (de 1 a 5 cifras).
  - Siguiente nivel: problemas contextualizados, división con divisor de 2 cifras, operaciones combinadas, potencias, raíz cuadrada, m.c.d. y m.c.m.
- **Dos modos de respuesta**: opción múltiple (con distractores basados en errores típicos, como sumar sin llevar) o respuesta libre.
- **Divisiones con resto**: se responde cociente y resto por separado.
- **Modo equipos**: de 2 a 5 equipos por turnos, con marcador y podio final.
- **Resultados**: puntos con bonus por racha, precisión, tabla por formato (indicando dónde se usó ayuda) e historial completo de preguntas.

## Apoyos DUA (Diseño Universal para el Aprendizaje)

| Apoyo | Qué ofrece |
|---|---|
| Pista de estrategia | Una frase breve bajo cada pregunta |
| Caja de herramientas | Ayudas graduadas que se abren una a una: descomposición, recta numérica, puntos agrupados, modelo de área, tablas, escalera de factores primos, plan de 4 pasos para problemas… |
| Borrador | Lienzo para calcular con el dedo, ratón o lápiz digital, en tres colores |
| Temporizador | Opcional (30–120 s); los problemas tienen el doble de tiempo |
| Ver mejor | Modo de alto contraste y letra grande para baja visión |
| Fallo sin castigo | Al fallar se muestra la solución paso a paso, nunca un simple «incorrecto» |

También respeta la preferencia del sistema de **reducir movimiento**, se puede usar entero con **teclado** (teclas 1–4 para elegir respuesta, Intro para seguir) y es compatible con lectores de pantalla.

## Cómo usarlo

**Sin instalar nada:** abre `index.html` con doble clic en cualquier navegador moderno (Chrome, Edge, Firefox, Safari). Funciona en ordenador, tablet, móvil y pizarra digital.

**Publicado en una web** (recomendado para el aula): sube la carpeta completa a cualquier alojamiento estático (GitHub Pages, Netlify, el servidor del centro…). Así, además:

- se puede **instalar como app** desde el navegador (botón «Instalar» o «Añadir a pantalla de inicio»);
- funciona **sin conexión** después de la primera visita.

### Publicarlo con GitHub Pages

1. En el repositorio, ve a **Settings → Pages**.
2. En *Source* elige la rama principal y la carpeta donde esté `index.html`.
3. Guarda. En un par de minutos la app estará en `https://<organización>.github.io/<repositorio>/`.

## Privacidad

MathBlast no tiene cuentas, no recoge datos y no envía nada a ningún servidor. Solo guarda **la configuración** (nivel, formatos, apoyos elegidos) en el propio navegador, para no tener que repetirla. Los resultados de cada partida desaparecen al cerrar la página.

La única petición externa es la descarga de las tipografías (Fredoka One y Nunito) desde Google Fonts.

## Estructura del proyecto

```
mathblast/
├── index.html             Pantallas: inicio, juego y resultados
├── css/styles.css         Estilo visual «cuaderno» (Kids Sketch Mode)
├── js/app.js              Generadores de preguntas, ayudas y lógica del juego
├── manifest.webmanifest   Datos para instalarla como app
├── sw.js                  Modo sin conexión
├── icons/icon.svg         Icono de la app
└── docs/
    └── GUIA-DOCENTE.md    Guía de uso en el aula
```

No necesita compilación, dependencias ni servidor propio.

## Licencia

Código bajo doble licencia, a elección de quien lo use:

- [AGPL-3.0-or-later](https://www.gnu.org/licenses/agpl-3.0.html)
- [EUPL-1.2](https://eupl.eu/1.2/es/)

Ver [LICENSE](LICENSE). La marca EDUmind® y su identidad visual no forman parte de la licencia: ver [TRADEMARKS.md](TRADEMARKS.md).

© 2026 EDUmind® · Luis Vilela Acuña · [edumind.es](https://edumind.es) · contacto@edumind.es
