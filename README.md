# Backus Ventas PWA — Versión Mejorada (Proyecto 1)
**SENATI – Escuela de Tecnologías de la Información**  
**Taller PWA – App Manifest & Arquitecturas Desconectadas**  
**Instructor:** Jorge Luque Chambi  

---

## 1. Descripción del Proyecto

Esta versión mejorada de **Backus Ventas PWA** resuelve la problemática del vendedor en campo que necesita consultar productos de forma inmediata, armar pedidos con múltiples ítems y cantidades personalizadas, y registrar transacciones de forma confiable aun cuando no existe conexión a internet (enfoque **Offline-First**).

### Criterio Técnico Transversal
En cumplimiento con las directivas pedagógicas, esta aplicación **no incorpora mensajes falsos de sincronización con servidores remotos**. Cada pedido registrado se almacena localmente en **IndexedDB** bajo el estado **`PENDIENTE`** de sincronización real, distinguiendo con total honestidad el guardado local de una respuesta confirmada por API.

---

## 2. Funcionalidades Implementadas (Páginas 1 a 5)

* **BV-01 (Búsqueda insensible a mayúsculas/minúsculas):** Búsqueda de productos en tiempo real por coincidencia parcial de texto (ej. "pilsen", "cristal", "san mateo").
* **BV-02 (Filtros combinables):** Filtrado simultáneo por categoría (*Todas*, *Cerveza*, *Bebidas*) y texto de búsqueda, con opción de limpiar filtros.
* **BV-03 (Validación de cantidades):** Aceptación exclusiva de números enteros positivos $> 0$. Se bloquean y rechazan cantidades nulas, negativas o decimales.
* **BV-04 (Cálculo de importes estricto):** Cálculo automático de $\text{Subtotal} = \text{precioUnitario} \times \text{cantidad}$ y suma del total general con dos decimales exactos.
* **BV-05 (Persistencia Local-First):** Cada pedido se persiste de forma estructurada en IndexedDB antes de confirmar el registro. Al recargar la página (`F5`), el historial mantiene todos los pedidos intactos.
* **BV-06 (Control honesto de estado):** Todo pedido nuevo inicia y se conserva en estado **`PENDIENTE`**, diferenciando su origen (`ONLINE` u `OFFLINE`).
* **BV-07 (Gestión de errores transaccionales):** Si ocurre un error en la transacción de IndexedDB, se notifica al usuario y no se confirma el éxito de la operación.
* **Historial y Detalle:** Pestaña de historial que permite inspeccionar el desglose de productos, cantidades y subtotales de cada pedido guardado.

---

## 3. Modelo de Datos Oficial

```typescript
export interface LineaPedido {
  productoId: number;
  producto: string;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
}

export type EstadoPedido = 'PENDIENTE' | 'SINCRONIZADO' | 'ERROR';

export interface Pedido {
  id?: number;
  fecha: string;
  lineas: LineaPedido[];
  total: number;
  estado: EstadoPedido;
  origen: 'ONLINE' | 'OFFLINE';
}
```

---

## 4. Comandos de Ejecución y Pruebas

### 4.1 Compilación y Servidor en Producción (con Service Worker activo)
Debido a que el Service Worker se encuentra inactivo en `ng serve` (`!isDevMode()`), debe ejecutarse en modo producción:

```powershell
# Compilar y servir en el puerto 8080
npm.cmd run serve:pwa
```

Abre en tu navegador:  
👉 **`http://localhost:8080`**

---

## 5. Matriz de Pruebas y Resultados (Plan P1 a P7)

| Prueba | Procedimiento | Resultado Esperado | Resultado Obtenido |
| :---: | :--- | :--- | :---: |
| **P1** | Escribir `"pilsen"` en el buscador de catálogo | Lista filtrada mostrando solo productos coincidentes | ✅ Aceptado |
| **P2** | Seleccionar categoría `"Bebidas"` y buscar `"san"` | Solo se muestra *San Mateo 600 ml*. Al pulsar *Limpiar filtros*, se restablece la lista | ✅ Aceptado |
| **P3** | Agregar 2 Cristal (S/ 7.50) y 1 Pilsen (S/ 8.00) al carrito | Subtotales calculados: S/ 15.00 y S/ 8.00. Total acumulado: S/ 23.00 | ✅ Aceptado |
| **P4** | Intentar ingresar cantidad 0, -1 o decimales | Se rechaza la operación y se muestra alerta de validación | ✅ Aceptado |
| **P5** | Registrar el pedido y presionar `F5` (recargar) | El pedido permanece visible en la pestaña *Historial* con ID, fecha y líneas | ✅ Aceptado |
| **P6** | Activar DevTools $\rightarrow$ Network $\rightarrow$ **Offline** y registrar pedido | El pedido se guarda localmente en IndexedDB con `origen: 'OFFLINE'` y `estado: 'PENDIENTE'` | ✅ Aceptado |
| **P7** | Inspeccionar DevTools $\rightarrow$ Application $\rightarrow$ IndexedDB | Se visualiza la base `backusVentasDB`, almacén `pedidos` con la estructura de objetos persistida | ✅ Aceptado |

---

## 6. Respuestas a las Preguntas de Reflexión (Página 5)

### 9. ¿Por qué persistir un pedido antes de confirmar el guardado?
Garantiza el principio de consistencia y atomicidad (*Local-First*). Si la aplicación web confirmara visualmente el pedido antes de escribirlo en IndexedDB y justo en ese milisegundo el navegador se cierra, se apaga el dispositivo o colapsa la memoria, los datos del pedido se perderían irrecuperablemente sin dejar rastro para el vendedor.

### 10. ¿Qué diferencia hay entre Cache Storage e IndexedDB?
* **Cache Storage:** Diseñado para almacenar pares Request/Response HTTP completos (HTML, CSS, JavaScript, fuentes, iconos y respuestas GET a archivos JSON). Su objetivo es posibilitar la carga del *App Shell* y recursos estáticos sin red.
* **IndexedDB:** Base de datos NoSQL transaccional del lado del cliente. Permite almacenar datos dinámicos estructurados (objetos complejos, arrays de líneas de pedidos, fechas, estados) con capacidad de consulta mediante índices y operaciones transaccionales ACID de lectura y escritura.

### 11. ¿Qué debería enviarse a una API cuando se implemente la sincronización?
Debe enviarse un payload que contenga:
1. El identificador único o UUID generado en el cliente (`uuid`).
2. La marca de tiempo original de creación en frío (`fecha`).
3. El origen de captura (`origen: 'OFFLINE'`).
4. El identificador del vendedor o terminal móvil.
5. El arreglo de líneas de pedido con sus códigos de producto, cantidades y precios unitarios.
6. Una suma de verificación o firma digital para asegurar que los precios o cantidades no sufrieron alteración local indebida.

### 12. ¿Cómo evitarías duplicar pedidos tras varios intentos?
Mediante la implementación de **idempotencia** en el diseño de la API:
* El cliente asigna a cada pedido un UUID único v4 inmutable antes del primer intento de envío.
* Al recuperar la conexión o activar *Background Sync*, el cliente envía el pedido con su UUID como encabezado `Idempotency-Key` o dentro del cuerpo del mensaje.
* El servidor registra las claves procesadas; si la conexión se cae antes de que el cliente reciba la confirmación HTTP 200 y reintenta el envío, el servidor detecta el UUID duplicado, descarta la inserción duplicada y responde con el resultado de la transacción ya registrada previamente.

---

## 7. Limitaciones Técnicas del Proyecto

1. **Ausencia de Endpoint Backend Real:** El proyecto no dispone de un servidor REST/GraphQL externo; por tanto, los pedidos permanecen en estado `PENDIENTE` en el navegador del dispositivo hasta que se acople una API corporativa.
2. **Sincronización en Segundo Plano:** En esta fase se implementa persistencia transaccional local. La sincronización diferida automática mediante la API *Background Synchronization* (`registration.sync.register`) conforma una ampliación posterior del sistema.
