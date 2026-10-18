import { Injectable } from '@angular/core';
import { Pedido } from './catalogo.service';

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

  async guardarPedido(pedido: Omit<Pedido, 'id'>): Promise<number> {
    try {
      const db = await this.abrirDB();
      return new Promise<number>((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readwrite');
        const store = transaction.objectStore(this.storeName);

        const request = store.add(pedido);

        request.onsuccess = () => {
          const idGenerado = request.result as number;
          console.log('✅ Pedido estructurado guardado exitosamente en IndexedDB:', {
            id: idGenerado,
            ...pedido
          });
          resolve(idGenerado);
        };

        request.onerror = () => {
          console.error('❌ Error al insertar pedido en IndexedDB:', request.error);
          reject(new Error('No se pudo guardar el pedido en IndexedDB'));
        };

        transaction.onerror = () => {
          console.error('❌ Error en la transacción de IndexedDB:', transaction.error);
          reject(new Error('Fallo en la transacción de almacenamiento local'));
        };
      });
    } catch (error) {
      console.error('Error general al guardar en StorageService:', error);
      throw error;
    }
  }

  async listarPedidos(): Promise<Pedido[]> {
    try {
      const db = await this.abrirDB();
      return new Promise<Pedido[]>((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();

        request.onsuccess = () => {
          const resultado = (request.result as Pedido[]) || [];
          // Ordenar del más reciente al más antiguo
          resultado.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
          resolve(resultado);
        };

        request.onerror = () => {
          console.error('Error al consultar pedidos en IndexedDB:', request.error);
          reject(new Error('No se pudieron recuperar los pedidos locales'));
        };
      });
    } catch (error) {
      console.error('Error general al listar en StorageService:', error);
      return [];
    }
  }

  async obtenerPedido(id: number): Promise<Pedido | undefined> {
    try {
      const db = await this.abrirDB();
      return new Promise<Pedido | undefined>((resolve, reject) => {
        const transaction = db.transaction(this.storeName, 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result as Pedido | undefined);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error al obtener pedido por ID:', error);
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
      console.error('Error al eliminar pedido:', error);
      throw error;
    }
  }
}
