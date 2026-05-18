import { supabase } from '../lib/supabase'
import type { Producto, ProductoInsert, ProductoUpdate } from '../types/database'
import type { Categoria } from '../types/database'

// Tipo enriquecido con la categoria unida
export type ProductoConCategoria = Omit<Producto, 'categoria'> & {
  categorias: Pick<Categoria, 'id' | 'nombre'> | null
}

export async function getProductos(
  search      = '',
  categoriaId = '',
): Promise<ProductoConCategoria[]> {
  let query = supabase
    .from('productos')
    .select('*, categorias(id, nombre)')
    .order('nombre')

  if (search.trim()) {
    query = query.or(
      `nombre.ilike.%${search.trim()}%,codigo.ilike.%${search.trim()}%`,
    )
  }

  if (categoriaId) {
    query = query.eq('categoria_id', categoriaId)
  }

  const { data, error } = await query
  if (error) throw error
  return (data as unknown as ProductoConCategoria[]) ?? []
}

export async function createProducto(data: ProductoInsert): Promise<Producto> {
  const { data: created, error } = await supabase
    .from('productos').insert(data).select().single()
  if (error) throw error
  return created as Producto
}

export async function updateProducto(id: string, data: ProductoUpdate): Promise<Producto> {
  const { data: updated, error } = await supabase
    .from('productos').update(data).eq('id', id).select().single()
  if (error) throw error
  return updated as Producto
}

export async function deleteProducto(id: string): Promise<void> {
  const { error } = await supabase.from('productos').delete().eq('id', id)
  if (error) throw error
}

export async function ajustarStock(
  id:      string,
  cantidad: number,
  tipo:    'entrada' | 'salida',
): Promise<void> {
  const { data: prod, error: fetchErr } = await supabase
    .from('productos').select('stock').eq('id', id).single()
  if (fetchErr) throw fetchErr

  const nuevoStock =
    tipo === 'entrada'
      ? Number(prod.stock) + cantidad
      : Math.max(0, Number(prod.stock) - cantidad)

  const { error } = await supabase
    .from('productos').update({ stock: nuevoStock }).eq('id', id)
  if (error) throw error
}
