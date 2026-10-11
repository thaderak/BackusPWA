# Backus Ventas PWA

Implementación educativa del taller App Manifest sobre el proyecto Angular existente (Angular 22).

## Ejecutar

```sh
npm ci
npm start
```

## Probar la PWA en producción

```sh
npm run build
```

Sirve `dist/BackusPWA-angular/browser` en localhost. Por ejemplo, si tienes Python:

```sh
python -m http.server 8080 --directory dist/BackusPWA-angular/browser
```

Abre http://localhost:8080. El Service Worker se habilita en producción; `npm start` es para desarrollo.
En un despliegue público se requiere HTTPS y servir la aplicación en la raíz del dominio.

1. En DevTools → Application → Manifest comprueba nombre, modo standalone, colores e iconos de 192 y 512 px.
2. En Application → Service Workers espera a que esté Activated. Recarga para que controle la página.
3. Carga el catálogo con conexión. En Cache Storage verifica `/data/catalogo.json`; usa estrategia performance, máximo 20 entradas y vigencia de un día.
4. Activa Offline en DevTools → Network y recarga: la interfaz y el catálogo previamente consultado deben estar disponibles.
5. Registra un pedido y un mensaje sin conexión. En Application → IndexedDB → backusVentasDB → pedidos verifica los registros con fecha y estado pendiente.
6. Recarga y verifica que los registros locales permanecen. Desactiva Offline y comprueba el indicador de conexión.
7. Toma capturas de Manifest, Service Worker, Cache Storage e IndexedDB como evidencias del taller.

El catálogo se sirve desde `public/data/catalogo.json`, accesible en `/data/catalogo.json`; el servicio HTTP y la caché comparten esa ruta.
Los iconos usan una B sobre el color del taller; no son el logotipo oficial.

## Alcance

Productos y precios ficticios. El procesamiento online es una simulación claramente indicada, sin API ni envío real. Pedidos y mensajes offline se guardan en IndexedDB y se muestran al volver a abrir la app. No se sincronizan automáticamente. `navigator.onLine` indica conectividad del navegador, no disponibilidad del servidor. La primera visita necesita conexión y el catálogo offline requiere una consulta previa bajo control del Service Worker; la caché del catálogo caduca al día. Los datos locales pertenecen a este navegador y pueden perderse si se borra su almacenamiento.

## Verificación

```sh
npm test -- --watch=false
npm run build
```
