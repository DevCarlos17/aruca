import { supabase } from '../lib/supabase'
import type { Categoria, CategoriaInsert, CategoriaUpdate } from '../types/database'

export async function getCategorias(): Promise<Categoria[]> {
  const { data, error } = await supabase.from('categorias').select('*').order('nombre')
  if (error) throw error
  return (data ?? []) as Categoria[]
}

export async function createCategoria(data: CategoriaInsert): Promise<Categoria> {
  const { data: created, error } = await supabase
    .from('categorias').insert(data).select().single()
  if (error) throw error
  return created as Categoria
}

export async function updateCategoria(id: string, data: CategoriaUpdate): Promise<Categoria> {
  const { data: updated, error } = await supabase
    .from('categorias').update(data).eq('id', id).select().single()
  if (error) throw error
  return updated as Categoria
}

export async function deleteCategoria(id: string): Promise<void> {
  const { error } = await supabase.from('categorias').delete().eq('id', id)
  if (error) throw error
}
