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

  // Navegación de pestañas
  pestanaActiva: 'catalogo' | 'carrito' | 'historial' = 'catalogo';

  // Catálogo y filtros
  catalogo: Producto[] = [];
  cargandoCatalogo: boolean = true;
  terminoBusqueda: string = '';
  categoriaSeleccionada: string = 'Todas';
  categoriasDisponibles: string[] = ['Todas', 'Cerveza', 'Bebidas'];
  cantidadesCatalogo: { [productoId: number]: number } = {};

  // Carrito de compras
  carrito: LineaPedido[] = [];

  // Historial de pedidos
  historialPedidos: Pedido[] = [];
  pedidoDetalle: Pedido | null = null;

  // Mensajes de estado
  mensajeNotificacion: string = '';
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

  // --- GESTIÓN DEL CATÁLOGO ---
  cargarCatalogo(): void {
    this.cargandoCatalogo = true;
    this.catalogoService.obtenerCatalogo().subscribe({
      next: (data: Producto[]) => {
        this.catalogo = data;
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
        this.mostrarMensaje('No se pudo cargar el catálogo. Verifique su conexión.', 'error');
        this.cdr.markForCheck();
      }
    });
  }

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

  // --- GESTIÓN DEL CARRITO ---
  agregarAlCarrito(producto: Producto): void {
    const cantidad = Number(this.cantidadesCatalogo[producto.id]);

    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      this.mostrarMensaje('La cantidad debe ser un número entero mayor a 0.', 'error');
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
    this.mostrarMensaje(`Se agregaron ${cantidad} unidad(es) de ${producto.producto} al pedido.`, 'info');
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
    this.mostrarMensaje('Producto retirado del pedido.', 'info');
    this.cdr.markForCheck();
  }

  vaciarCarrito(): void {
    this.carrito = [];
    this.mostrarMensaje('El pedido actual ha sido vaciado.', 'info');
    this.cdr.markForCheck();
  }

  get totalArticulos(): number {
    return this.carrito.reduce((acc, item) => acc + item.cantidad, 0);
  }

  get totalCarrito(): number {
    const total = this.carrito.reduce((acc, item) => acc + item.subtotal, 0);
    return Number(total.toFixed(2));
  }

  // --- PERSISTENCIA Y REGISTRO DE PEDIDOS ---
  async confirmarPedido(): Promise<void> {
    if (this.carrito.length === 0) {
      this.mostrarMensaje('El pedido está vacío. Agregue productos antes de registrar.', 'error');
      return;
    }

    for (const item of this.carrito) {
      if (!Number.isInteger(item.cantidad) || item.cantidad <= 0) {
        this.mostrarMensaje(`Cantidad inválida detectada en ${item.producto}.`, 'error');
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

      this.mostrarMensaje(
        `Pedido #${idGenerado} registrado con éxito en almacenamiento local. ` +
        `Estado: PENDIENTE de sincronización (${modoTexto}).`,
        'exito'
      );

      this.pestanaActiva = 'historial';
      this.cdr.markForCheck();
    } catch (error) {
      console.error('Error al persistir pedido:', error);
      this.mostrarMensaje(
        'Error de persistencia: No se pudo registrar el pedido en almacenamiento local. Sus productos se mantienen en el carrito.',
        'error'
      );
      this.cdr.markForCheck();
    }
  }

  // --- HISTORIAL Y DETALLE ---
  async cargarHistorial(): Promise<void> {
    try {
      this.historialPedidos = await this.storageService.listarPedidos();
      this.cdr.markForCheck();
    } catch (error) {
      console.error('Error al recuperar historial:', error);
    }
  }

  verDetalle(pedido: Pedido): void {
    this.pedidoDetalle = pedido;
    this.cdr.markForCheck();
  }

  cerrarDetalle(): void {
    this.pedidoDetalle = null;
    this.cdr.markForCheck();
  }

  async eliminarPedido(id?: number): Promise<void> {
    if (!id) return;
    if (confirm(`¿Confirma eliminar el pedido #${id} del almacenamiento local?`)) {
      try {
        await this.storageService.eliminarPedido(id);
        if (this.pedidoDetalle?.id === id) {
          this.pedidoDetalle = null;
        }
        await this.cargarHistorial();
        this.mostrarMensaje(`Pedido #${id} eliminado del almacenamiento local.`, 'info');
      } catch (error) {
        console.error('Error al eliminar:', error);
        this.mostrarMensaje('No se pudo eliminar el pedido de IndexedDB.', 'error');
      }
    }
  }

  mostrarMensaje(texto: string, tipo: 'exito' | 'error' | 'info' = 'info'): void {
    this.mensajeNotificacion = texto;
    this.tipoNotificacion = tipo;
    this.cdr.markForCheck();
  }
}
