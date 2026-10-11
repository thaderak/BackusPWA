import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogoService, Producto } from './services/catalogo.service';
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

  catalogo: Producto[] = [];
  productoSeleccionadoId: number | null = null;
  mensajeTexto: string = '';

  mensajeNotificacion: string = '';
  estadoPedidoNotif: string = '';

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

  ngOnInit(): void {
    this.cargarCatalogo();
  }

  cargarCatalogo(): void {
    this.catalogoService.obtenerCatalogo().subscribe({
      next: (data: Producto[]) => {
        this.catalogo = data;
        if (data && data.length > 0) {
          this.productoSeleccionadoId = data[0].id;
        }
        this.cdr.markForCheck();
      },
      error: (err: unknown) => {
        console.error('Error al cargar catálogo:', err);
        this.cdr.markForCheck();
      }
    });
  }

  async registrarPedido(): Promise<void> {
    if (!this.catalogo || this.catalogo.length === 0) {
      this.mensajeNotificacion = 'El catálogo aún está cargando. Espere un momento.';
      this.estadoPedidoNotif = 'ESPERA';
      this.cdr.markForCheck();
      return;
    }

    const prod =
      this.catalogo.find((p) => p.id === Number(this.productoSeleccionadoId)) ||
      this.catalogo[0];

    if (!prod) return;

    const pedido = {
      producto: prod.producto,
      precio: prod.precio,
      cantidad: 1
    };

    if (this.online) {
      this.mensajeNotificacion = 'Pedido enviado al servidor con éxito.';
      this.estadoPedidoNotif = 'ENVIADO';
    } else {
      await this.storageService.guardarPedido(pedido);
      this.mensajeNotificacion = 'Pedido guardado localmente';
      this.estadoPedidoNotif = 'PENDIENTE';
    }
    this.cdr.markForCheck();
  }

  async guardarMensaje(): Promise<void> {
    if (!this.mensajeTexto.trim()) return;

    const mensajeObj = {
      contenido: this.mensajeTexto,
      tipo: 'mensaje'
    };

    if (this.online) {
      this.mensajeNotificacion = 'Mensaje procesado correctamente.';
      this.estadoPedidoNotif = 'PROCESADO';
    } else {
      await this.storageService.guardarPedido(mensajeObj);
      this.mensajeNotificacion = 'Mensaje guardado localmente';
      this.estadoPedidoNotif = 'PENDIENTE';
    }

    this.mensajeTexto = '';
    this.cdr.markForCheck();
  }
}
