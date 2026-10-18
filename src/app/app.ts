import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CatalogoService,
  Producto,
  LineaPedido,
  Pedido
} from './services/catalogo.service';
import { StorageService } from './services/storage.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  title = 'backus-ventas-pwa';
  online: boolean = navigator.onLine;

  private catalogoService = inject(CatalogoService);
  private storageService = inject(StorageService);
  private cdr = inject(ChangeDetectorRef);

  // Navegación de pestañas (Integra las vistas del reto conservando el proyecto base)
  pestanaActiva: 'catalogo' | 'carrito' | 'historial' | 'mensaje' = 'catalogo';

  // --- PROPIEDADES DEL PROYECTO BASE (Páginas 26-27 del primer PDF) ---
  catalogo: Producto[] = [];
  productoSeleccionadoId: number | null = null;
  mensajeTexto: string = '';
  mensajeNotificacion: string = '';
  estadoPedidoNotif: string = '';

  // --- PROPIEDADES DE LA MEJORA INCREMENTAL (Páginas 3-5 del segundo PDF) ---
  cargandoCatalogo: boolean = true;
  terminoBusqueda: string = '';
  categoriaSeleccionada: string = 'Todas';
  categoriasDisponibles: string[] = ['Todas', 'Cerveza', 'Bebidas'];
  cantidadesCatalogo: { [productoId: number]: number } = {};
  carrito: LineaPedido[] = [];
  historialPedidos: any[] = [];
  pedidoDetalle: any | null = null;
  tipoNotificacion: 'exito' | 'error' | 'info' = 'info';

  constructor() {
    window.addEventListener('online', () => {
      this.online = true;
      this.cdr.markForCheck();
    });
    window.addEventListener('offline', () => {
      this.online = false;
      this.cdr.markForCheck();
    });
  }

  async ngOnInit(): Promise<void> {
    this.cargarCatalogo();
    await this.cargarHistorial();
  }

  // --- CARGA DE CATÁLOGO BASE ---
  cargarCatalogo(): void {
    this.cargandoCatalogo = true;
    this.catalogoService.obtenerCatalogo().subscribe({
      next: (data: Producto[]) => {
        this.catalogo = data;
        if (data && data.length > 0) {
          this.productoSeleccionadoId = data[0].id;
        }
        data.forEach((p) => {
          if (!this.cantidadesCatalogo[p.id]) {
            this.cantidadesCatalogo[p.id] = 1;
          }
        });
        this.cargandoCatalogo = false;
        this.cdr.markForCheck();
      },
      error: (err: unknown) => {
        console.error('Error al cargar catálogo:', err);
        this.cargandoCatalogo = false;
        this.cdr.markForCheck();
      }
    });
  }

  // --- FUNCIONALIDADES DEL PROYECTO BASE (CONSERVADAS AL 100%) ---

  /**
   * Registro de pedido simple del proyecto base (Fase 8, pág. 27).
   */
  async registrarPedido(): Promise<void> {
    if (!this.catalogo || this.catalogo.length === 0) {
      this.mostrarNotificacion('El catálogo aún está cargando.', 'ESPERA', 'info');
      return;
    }

    const prod =
      this.catalogo.find((p) => p.id === Number(this.productoSeleccionadoId)) ||
      this.catalogo[0];

    if (!prod) return;

    const pedido = {
      tipo: 'pedido_simple',
      producto: prod.producto,
      precio: prod.precio,
      cantidad: 1,
      total: prod.precio,
      origen: this.online ? 'ONLINE' : 'OFFLINE'
    };

    if (this.online) {
      this.mostrarNotificacion('Pedido registrado exitosamente en modo local.', 'ENVIADO', 'exito');
    } else {
      await this.storageService.guardarPedido(pedido);
      this.mostrarNotificacion('Pedido guardado localmente en IndexedDB.', 'PENDIENTE', 'exito');
    }

    await this.cargarHistorial();
    this.cdr.markForCheck();
  }

  /**
   * Guardado de mensaje del vendedor del proyecto base (Fase 8, pág. 27).
   */
  async guardarMensaje(): Promise<void> {
    if (!this.mensajeTexto.trim()) return;

    const mensajeObj = {
      tipo: 'mensaje',
      contenido: this.mensajeTexto,
      origen: this.online ? 'ONLINE' : 'OFFLINE'
    };

    if (this.online) {
      this.mostrarNotificacion('Mensaje procesado correctamente.', 'PROCESADO', 'exito');
    } else {
      await this.storageService.guardarPedido(mensajeObj);
      this.mostrarNotificacion('Mensaje guardado localmente en IndexedDB.', 'PENDIENTE', 'exito');
    }

    this.mensajeTexto = '';
    await this.cargarHistorial();
    this.cdr.markForCheck();
  }

  // --- FUNCIONALIDADES DE LA MEJORA INCREMENTAL (PÁGINAS 1-5) ---

  get productosFiltrados(): Producto[] {
    const busqueda = this.terminoBusqueda.trim().toLowerCase();
    return this.catalogo.filter((p) => {
      const coincideNombre = p.producto.toLowerCase().includes(busqueda);
      const coincideCategoria =
        this.categoriaSeleccionada === 'Todas' ||
        p.categoria.toLowerCase() === this.categoriaSeleccionada.toLowerCase();
      return coincideNombre && coincideCategoria;
    });
  }

  limpiarFiltros(): void {
    this.terminoBusqueda = '';
    this.categoriaSeleccionada = 'Todas';
    this.cdr.markForCheck();
  }

  incrementarCantidadCatalogo(productoId: number): void {
    const actual = this.cantidadesCatalogo[productoId] || 1;
    this.cantidadesCatalogo[productoId] = actual + 1;
    this.cdr.markForCheck();
  }

  decrementarCantidadCatalogo(productoId: number): void {
    const actual = this.cantidadesCatalogo[productoId] || 1;
    if (actual > 1) {
      this.cantidadesCatalogo[productoId] = actual - 1;
      this.cdr.markForCheck();
    }
  }

  // Carrito multi-producto (Reglas BV-03 y BV-04)
  agregarAlCarrito(producto: Producto): void {
    const cantidad = Number(this.cantidadesCatalogo[producto.id]);

    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      this.mostrarNotificacion('La cantidad debe ser un entero mayor a cero.', 'ERROR', 'error');
      return;
    }

    const itemExistente = this.carrito.find((item) => item.productoId === producto.id);

    if (itemExistente) {
      itemExistente.cantidad += cantidad;
      itemExistente.subtotal = Number((itemExistente.cantidad * itemExistente.precioUnitario).toFixed(2));
    } else {
      const subtotal = Number((producto.precio * cantidad).toFixed(2));
      this.carrito.push({
        productoId: producto.id,
        producto: producto.producto,
        precioUnitario: producto.precio,
        cantidad: cantidad,
        subtotal: subtotal
      });
    }

    this.cantidadesCatalogo[producto.id] = 1;
    this.mostrarNotificacion(`Agregadas ${cantidad} unidad(es) de ${producto.producto} al carrito.`, 'INFO', 'info');
    this.cdr.markForCheck();
  }

  modificarCantidadCarrito(productoId: number, delta: number): void {
    const item = this.carrito.find((i) => i.productoId === productoId);
    if (!item) return;

    const nuevaCantidad = item.cantidad + delta;
    if (nuevaCantidad <= 0) {
      this.eliminarLineaCarrito(productoId);
    } else {
      item.cantidad = nuevaCantidad;
      item.subtotal = Number((item.cantidad * item.precioUnitario).toFixed(2));
    }
    this.cdr.markForCheck();
  }

  eliminarLineaCarrito(productoId: number): void {
    this.carrito = this.carrito.filter((i) => i.productoId !== productoId);
    this.cdr.markForCheck();
  }

  vaciarCarrito(): void {
    this.carrito = [];
    this.cdr.markForCheck();
  }

  get totalArticulos(): number {
    return this.carrito.reduce((acc, item) => acc + item.cantidad, 0);
  }

  get totalCarrito(): number {
    const total = this.carrito.reduce((acc, item) => acc + item.subtotal, 0);
    return Number(total.toFixed(2));
  }

  // Confirmar pedido estructurado (Reglas BV-05, BV-06 y BV-07)
  async confirmarPedido(): Promise<void> {
    if (this.carrito.length === 0) {
      this.mostrarNotificacion('El carrito está vacío. Agregue productos.', 'ERROR', 'error');
      return;
    }

    for (const item of this.carrito) {
      if (!Number.isInteger(item.cantidad) || item.cantidad <= 0) {
        this.mostrarNotificacion(`Cantidad inválida en ${item.producto}.`, 'ERROR', 'error');
        return;
      }
    }

    const nuevoPedido: Omit<Pedido, 'id'> = {
      fecha: new Date().toISOString(),
      lineas: JSON.parse(JSON.stringify(this.carrito)),
      total: this.totalCarrito,
      estado: 'PENDIENTE',
      origen: this.online ? 'ONLINE' : 'OFFLINE'
    };

    try {
      const idGenerado = await this.storageService.guardarPedido(nuevoPedido);
      this.carrito = [];
      await this.cargarHistorial();

      const modoTexto = this.online
        ? 'Registrado con conexión'
        : 'Registrado fuera de línea';

      this.mostrarNotificacion(
        `Pedido #${idGenerado} registrado con éxito en IndexedDB. Estado: PENDIENTE de sincronización (${modoTexto}).`,
        'PENDIENTE',
        'exito'
      );

      this.pestanaActiva = 'historial';
      this.cdr.markForCheck();
    } catch (error) {
      console.error('Error al persistir pedido:', error);
      this.mostrarNotificacion(
        'Error de persistencia: No se pudo guardar el pedido en IndexedDB.',
        'ERROR',
        'error'
      );
      this.cdr.markForCheck();
    }
  }

  // --- HISTORIAL Y CONSULTA DE DETALLES ---
  async cargarHistorial(): Promise<void> {
    try {
      this.historialPedidos = await this.storageService.listarPedidos();
      this.cdr.markForCheck();
    } catch (error) {
      console.error('Error al listar historial:', error);
    }
  }

  verDetalle(pedido: any): void {
    this.pedidoDetalle = pedido;
    this.cdr.markForCheck();
  }

  cerrarDetalle(): void {
    this.pedidoDetalle = null;
    this.cdr.markForCheck();
  }

  async eliminarPedido(id?: number): Promise<void> {
    if (!id) return;
    if (confirm(`¿Confirma eliminar el registro #${id} del almacenamiento local?`)) {
      try {
        await this.storageService.eliminarPedido(id);
        if (this.pedidoDetalle?.id === id) {
          this.pedidoDetalle = null;
        }
        await this.cargarHistorial();
        this.mostrarNotificacion(`Registro #${id} eliminado de IndexedDB.`, 'ELIMINADO', 'info');
      } catch (error) {
        console.error('Error al eliminar:', error);
      }
    }
  }

  mostrarNotificacion(texto: string, estadoTag: string = '', tipo: 'exito' | 'error' | 'info' = 'info'): void {
    this.mensajeNotificacion = texto;
    this.estadoPedidoNotif = estadoTag;
    this.tipoNotificacion = tipo;
    this.cdr.markForCheck();
  }
}
