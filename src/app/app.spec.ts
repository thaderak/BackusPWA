import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { App } from './app';
import { CatalogoService } from './services/catalogo.service';
import { StorageService } from './services/storage.service';

describe('Backus Ventas', () => {
  const producto = { id: 1, producto: 'Cristal 620 ml', categoria: 'Cerveza', precio: 7.5 };
  let storage: { guardarPedido: ReturnType<typeof vi.fn>; obtenerPendientes: ReturnType<typeof vi.fn> };
  beforeEach(async () => {
    storage = { guardarPedido: vi.fn().mockResolvedValue(undefined), obtenerPendientes: vi.fn().mockResolvedValue([]) };
    await TestBed.configureTestingModule({ imports: [App], providers: [
      { provide: CatalogoService, useValue: { obtenerCatalogo: () => of([producto]) } },
      { provide: StorageService, useValue: storage }
    ] }).compileComponents();
  });
  it('muestra el catálogo y la identidad de la aplicación', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Backus Ventas PWA');
    expect(fixture.nativeElement.textContent).toContain('Cristal 620 ml');
  });
  it('guarda el pedido offline con producto y cantidad', async () => {
    const app = TestBed.createComponent(App).componentInstance;
    app.ngOnInit(); app.online.set(false); app.cantidad = 3;
    await app.registrarPedido();
    expect(storage.guardarPedido).toHaveBeenCalledWith({ tipo: 'pedido', producto: producto.producto, precio: 7.5, cantidad: 3 });
    expect(app.notificacion()).toContain('PENDIENTE');
  });
  it('conserva el mensaje si falla el almacenamiento', async () => {
    const app = TestBed.createComponent(App).componentInstance;
    app.online.set(false); app.mensajeTexto = 'Visitar cliente';
    storage.guardarPedido.mockRejectedValueOnce(new Error('Sin espacio'));
    await app.guardarMensaje();
    expect(app.mensajeTexto).toBe('Visitar cliente');
    expect(app.notificacion()).toContain('No se pudo guardar');
  });
  it('rechaza cantidades inválidas', async () => {
    const app = TestBed.createComponent(App).componentInstance;
    app.ngOnInit(); app.online.set(false); app.cantidad = 0;
    await app.registrarPedido();
    expect(storage.guardarPedido).not.toHaveBeenCalled();
  });
  it('identifica el procesamiento online como simulación', async () => {
    const app = TestBed.createComponent(App).componentInstance;
    app.online.set(true); app.mensajeTexto = 'Prueba';
    await app.guardarMensaje();
    expect(app.notificacion()).toContain('simulado');
    expect(storage.guardarPedido).not.toHaveBeenCalled();
  });
  it('actualiza el indicador ante cambios de conexión', () => {
    const fixture = TestBed.createComponent(App);
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    window.dispatchEvent(new Event('offline'));
    expect(fixture.componentInstance.online()).toBe(false);
    vi.restoreAllMocks(); fixture.destroy();
  });
});
