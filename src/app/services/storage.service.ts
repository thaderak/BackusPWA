import { Injectable } from '@angular/core';

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

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private dbName = 'backusVentasDB';
  private storeName = 'pedidos';

  async abrirDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, {
            keyPath: 'id',
            autoIncrement: true
          });
        }
      };

      request.onsuccess = () => resolve(request.result);

      request.onerror = () => {
        console.error('Error al abrir IndexedDB:', request.error);
        reject(new Error('No se pudo abrir la base de datos local IndexedDB'));
      };
    });
  }

  /**
   * Guarda cualquier registro en IndexedDB (conserva compatibilidad total
   * con pedidos simples, mensajes del vendedor y pedidos estructurados del nuevo reto).
   */
  async guardarPedido(registro: any): Promise<number> {
    try {
      const db = await this.abrirDB();
      return new Promise<number>((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);

        const nuevoRegistro = {
          ...registro,
          fecha: registro.fecha || new Date().toISOString(),
          estado: registro.estado || 'PENDIENTE'
        };

        const request = store.add(nuevoRegistro);

        request.onsuccess = () => {
          const id = request.result as number;
          console.log('✅ Registro guardado exitosamente en IndexedDB:', { id, ...nuevoRegistro });
          resolve(id);
        };

        request.onerror = () => {
          console.error('❌ Error al guardar registro en IndexedDB:', request.error);
          reject(request.error);
        };

        transaction.onerror = () => {
          console.error('❌ Error en transacción de IndexedDB:', transaction.error);
          reject(transaction.error);
        };
      });
    } catch (error) {
      console.error('Error general en StorageService:', error);
      throw error;
    }
  }

  /**
   * Lista todos los registros persistidos ordenados del más reciente al más antiguo.
   */
  async listarPedidos(): Promise<any[]> {
    try {
      const db = await this.abrirDB();
      return new Promise<any[]>((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();

        request.onsuccess = () => {
          const items = (request.result || []) as any[];
          items.sort((a, b) => new Date(b.fecha || 0).getTime() - new Date(a.fecha || 0).getTime());
          resolve(items);
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error al listar pedidos en StorageService:', error);
      return [];
    }
  }

  async obtenerPedido(id: number): Promise<any | undefined> {
    try {
      const db = await this.abrirDB();
      return new Promise<any | undefined>((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error al obtener pedido en StorageService:', error);
      return undefined;
    }
  }

  async eliminarPedido(id: number): Promise<void> {
    try {
      const db = await this.abrirDB();
      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error al eliminar en StorageService:', error);
      throw error;
    }
  }
}
