import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Producto {
  id: number;
  producto: string;
  categoria: string;
  precio: number;
}

@Injectable({
  providedIn: 'root'
})
export class CatalogoService {
  private http = inject(HttpClient);
  private url = '/data/catalogo.json';

  obtenerCatalogo(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.url);
  }
}
