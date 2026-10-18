# Backus Ventas PWA — Versión Mejorada (Proyecto 1)

**Institución:** SENATI – Escuela de Tecnologías de la Información  
**Curso:** Taller PWA – App Manifest y Arquitecturas Desconectadas  
**Instructor:** Jorge Luque Chambi

---

## 1. Descripción del Proyecto

El proyecto **Backus Ventas PWA** consiste en desarrollar una aplicación web que ayude a los vendedores a consultar productos, agregar cantidades al carrito y registrar pedidos de una manera sencilla.

Una de las principales ventajas de esta aplicación es que puede seguir funcionando cuando no hay conexión a internet. Esto es importante porque un vendedor puede encontrarse en un lugar donde la señal sea débil o no tenga acceso a una red.

Para lograrlo, los pedidos se guardan en el almacenamiento local del navegador mediante IndexedDB. De esta manera, la información se mantiene incluso si se recarga la página.

Por ahora, la aplicación no cuenta con un servidor para enviar los pedidos. Por eso, los pedidos nuevos se guardan con el estado `PENDIENTE`, lo que significa que todavía falta implementar la sincronización con el servidor. Así se puede diferenciar un pedido guardado en el dispositivo de uno que ya fue enviado y confirmado.

## 2. Funcionalidades Implementadas (Páginas 1 a 5)

Durante el desarrollo del proyecto se implementaron las siguientes funcionalidades:

- **BV-01. Búsqueda de productos:** Permite buscar productos escribiendo parte de su nombre, sin importar si se utilizan mayúsculas o minúsculas. Por ejemplo, se puede buscar Pilsen, Cristal o San Mateo.

- **BV-02. Filtros de productos:** Permite filtrar los productos por categoría, como cerveza o bebidas, y combinar el filtro con el buscador. También cuenta con una opción para limpiar los filtros y volver a mostrar la lista completa.

- **BV-03. Validación de cantidades:** Solo permite ingresar cantidades enteras mayores que cero. Si se ingresa un cero, un número negativo o un decimal, la aplicación rechaza el valor.

- **BV-04. Cálculo de precios:** Calcula automáticamente el subtotal de cada producto según su precio y cantidad. También suma todos los subtotales para mostrar el total del pedido con dos decimales.

- **BV-05. Guardado de pedidos:** Los pedidos se guardan en IndexedDB. Si se actualiza la página o se presiona F5, la información continúa disponible en el historial.

- **BV-06. Estado de los pedidos:** Cada pedido nuevo se registra con el estado `PENDIENTE`. Además, se guarda si el pedido fue registrado mientras había conexión (`ONLINE`) o sin conexión (`OFFLINE`).

- **BV-07. Manejo de errores:** Si ocurre un problema al guardar un pedido en IndexedDB, la aplicación muestra un mensaje de error y no indica que el registro se realizó correctamente.

- **Historial y detalle de pedidos:** Permite revisar los pedidos guardados y consultar los productos que contiene cada uno, sus cantidades, subtotales y el total.

## 3. Modelo de Datos del Proyecto

Para organizar la información de los pedidos, se utilizaron interfaces y tipos de TypeScript. Estos permiten definir qué datos debe tener cada producto dentro de un pedido y qué información se necesita para registrar una venta.

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

La interfaz `LineaPedido` almacena los datos de cada producto, como su nombre, precio, cantidad y subtotal.

Por otro lado, la interfaz `Pedido` contiene la fecha, los productos agregados, el total, el estado y el origen del registro. El campo `id` es opcional porque puede generarse al guardar el pedido en la base de datos.

El estado `PENDIENTE` indica que el pedido todavía no se ha sincronizado con un servidor, mientras que `SINCRONIZADO` y `ERROR` permiten representar otros resultados cuando se implemente la sincronización.

## 4. Comandos para Ejecutar y Probar la Aplicación

### 4.1. Compilación y ejecución en modo producción

Para probar correctamente el funcionamiento de la PWA, es necesario ejecutar la aplicación en modo producción, ya que el Service Worker no se activa normalmente cuando se utiliza `ng serve` en modo desarrollo.

Para ello, se ejecuta el siguiente comando en PowerShell:

```powershell
npm.cmd run serve:pwa
```

Este comando permite compilar y ejecutar la aplicación utilizando el script configurado en el proyecto.

Después de ejecutarlo, se debe abrir el navegador e ingresar a la siguiente dirección:

**http://localhost:8080**

De esta manera, se puede comprobar si la aplicación carga correctamente y si sus funciones principales siguen disponibles cuando no hay conexión a internet.

## 5. Pruebas Realizadas y Resultados (P1 a P7)

Para comprobar el funcionamiento de la aplicación, se realizaron diferentes pruebas relacionadas con la búsqueda de productos, el registro de pedidos y el almacenamiento de la información.

| Prueba | Procedimiento | Resultado esperado | Resultado obtenido |
|---|---|---|---|
| **P1** | Escribir `pilsen` en el buscador. | Mostrar solamente los productos que coincidan con la búsqueda. | Aceptado |
| **P2** | Seleccionar la categoría `Bebidas` y buscar `san`. Después, limpiar los filtros. | Mostrar San Mateo 600 ml y permitir volver a la lista completa. | Aceptado |
| **P3** | Agregar 2 Cristal de S/ 7.50 y 1 Pilsen de S/ 8.00. | Calcular los subtotales de S/ 15.00 y S/ 8.00, con un total de S/ 23.00. | Aceptado |
| **P4** | Intentar ingresar cantidades como 0, -1 o números decimales. | Rechazar los valores incorrectos y mostrar una alerta. | Aceptado |
| **P5** | Registrar un pedido y recargar la página con F5. | Mantener el pedido en el historial con su ID, fecha y productos. | Aceptado |
| **P6** | Activar el modo Offline desde las herramientas del navegador y registrar un pedido. | Guardar el pedido localmente con origen `OFFLINE` y estado `PENDIENTE`. | Aceptado |
| **P7** | Revisar IndexedDB desde las herramientas del navegador. | Encontrar la base `backusVentasDB` y el almacén `pedidos` con la información guardada. | Aceptado |

Estas pruebas permiten comprobar que las funciones principales trabajan como se esperaba. También ayudan a verificar que la información de los pedidos se mantiene guardada aunque se actualice la página o se pierda la conexión.

*Nota: los resultados indicados corresponden a las pruebas reportadas en el proyecto y deben coincidir con las comprobaciones realizadas en la aplicación.*

## 6. Preguntas de Reflexión (Página 5)

### 9. ¿Por qué es importante guardar un pedido antes de confirmar que se registró?

Es importante porque primero debemos asegurarnos de que el pedido se haya guardado correctamente. Si la aplicación muestra un mensaje de éxito antes de almacenar la información y ocurre un error, el vendedor podría pensar que su pedido está registrado cuando en realidad no lo está.

Por eso, se utiliza IndexedDB para guardar los datos antes de confirmar el registro. De esta manera, se reduce el riesgo de perder la información si se cierra el navegador, se actualiza la página o se interrumpe el funcionamiento del dispositivo.

### 10. ¿Cuál es la diferencia entre Cache Storage e IndexedDB?

Aunque los dos permiten guardar información en el navegador, cada uno tiene una función diferente.

- **Cache Storage:** Se utiliza principalmente para guardar archivos y recursos de la aplicación, como HTML, CSS, JavaScript, imágenes e incluso respuestas de solicitudes HTTP. Esto ayuda a que la PWA pueda cargar algunos de sus recursos sin conexión a internet.

- **IndexedDB:** Se utiliza para guardar información organizada, como los productos de un pedido, las cantidades, los precios, las fechas y los estados. En este proyecto, permite conservar los pedidos registrados aunque el usuario cierre o actualice la página.

En resumen, Cache Storage ayuda a mantener disponibles los recursos de la aplicación, mientras que IndexedDB permite almacenar los datos que se generan durante su uso.

### 11. ¿Qué información se debería enviar a una API cuando se implemente la sincronización?

Cuando se implemente un servidor, será necesario enviar la información de los pedidos guardados localmente para que también quede registrada en el sistema central.

Entre los datos que se deberían enviar están:

1. **Identificador único del pedido:** Permite reconocer cada pedido y evitar confusiones.
2. **Fecha de creación:** Indica cuándo se registró originalmente el pedido.
3. **Origen del pedido:** Permite identificar si se creó sin conexión o mientras había internet.
4. **Identificador del vendedor:** Ayuda a reconocer quién realizó el registro.
5. **Lista de productos:** Incluye los códigos de los productos, las cantidades y los precios unitarios.
6. **Total del pedido:** Permite conocer el importe total de la venta.

También sería importante validar los datos en el servidor para evitar que se registren precios o cantidades incorrectos. Si el sistema necesita mayor seguridad, se pueden implementar mecanismos adicionales para comprobar la integridad de la información.

### 12. ¿Cómo se podría evitar que un pedido se registre varias veces al intentar sincronizarlo?

Una forma de evitar este problema es utilizar un mecanismo llamado **idempotencia**. Su función es impedir que una misma operación se registre varias veces cuando se realizan varios intentos de envío.

Por ejemplo, si un vendedor registra un pedido sin internet, este queda guardado en IndexedDB. Cuando recupera la conexión, la aplicación intenta enviarlo al servidor. Sin embargo, puede ocurrir que el servidor reciba el pedido, pero que la respuesta no llegue al dispositivo.

Si la aplicación vuelve a enviarlo sin ningún control, existe el riesgo de que se registre dos veces.

Para evitarlo, se puede seguir este
