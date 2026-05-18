-- ============================================================
-- FERRETERIA - Schema de Base de Datos
-- Ejecutar este script en: Supabase > SQL Editor > New Query
-- ============================================================

-- ============================================================
-- TABLAS
-- ============================================================

-- Categorias de productos
CREATE TABLE IF NOT EXISTS categorias (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT NOT NULL,
  descripcion TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     TEXT NOT NULL,
  telefono   TEXT,
  email      TEXT,
  direccion  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Productos / Inventario
CREATE TABLE IF NOT EXISTS productos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo       TEXT UNIQUE,
  nombre       TEXT NOT NULL,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  unidad       TEXT NOT NULL DEFAULT 'unidad',
  stock        NUMERIC NOT NULL DEFAULT 0,
  stock_minimo NUMERIC NOT NULL DEFAULT 0,
  precio       NUMERIC NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ordenes de trabajo
CREATE TABLE IF NOT EXISTS ordenes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero     INTEGER GENERATED ALWAYS AS IDENTITY,
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  estado     TEXT NOT NULL DEFAULT 'pendiente'
               CHECK (estado IN ('pendiente', 'en_proceso', 'completada', 'cancelada')),
  fecha      DATE NOT NULL DEFAULT CURRENT_DATE,
  total      NUMERIC NOT NULL DEFAULT 0,
  notas      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (numero)
);

-- Items de cada orden
CREATE TABLE IF NOT EXISTS orden_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id        UUID NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
  producto_id     UUID REFERENCES productos(id) ON DELETE SET NULL,
  cantidad        NUMERIC NOT NULL CHECK (cantidad > 0),
  precio_unitario NUMERIC NOT NULL CHECK (precio_unitario >= 0),
  subtotal        NUMERIC GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tareas del taller
CREATE TABLE IF NOT EXISTS tareas (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo           TEXT NOT NULL,
  descripcion      TEXT,
  estado           TEXT NOT NULL DEFAULT 'pendiente'
                     CHECK (estado IN ('pendiente', 'en_progreso', 'completada')),
  prioridad        TEXT NOT NULL DEFAULT 'media'
                     CHECK (prioridad IN ('alta', 'media', 'baja')),
  orden_id         UUID REFERENCES ordenes(id) ON DELETE SET NULL,
  asignado_a       TEXT,
  fecha_vencimiento DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE categorias  ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE orden_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tareas      ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICIES: usuarios autenticados tienen acceso total
-- ============================================================

-- categorias
CREATE POLICY "auth_select_categorias" ON categorias FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_categorias" ON categorias FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_categorias" ON categorias FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_categorias" ON categorias FOR DELETE TO authenticated USING (true);

-- clientes
CREATE POLICY "auth_select_clientes" ON clientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_clientes" ON clientes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_clientes" ON clientes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_clientes" ON clientes FOR DELETE TO authenticated USING (true);

-- productos
CREATE POLICY "auth_select_productos" ON productos FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_productos" ON productos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_productos" ON productos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_productos" ON productos FOR DELETE TO authenticated USING (true);

-- ordenes
CREATE POLICY "auth_select_ordenes" ON ordenes FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_ordenes" ON ordenes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_ordenes" ON ordenes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_ordenes" ON ordenes FOR DELETE TO authenticated USING (true);

-- orden_items
CREATE POLICY "auth_select_orden_items" ON orden_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_orden_items" ON orden_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_orden_items" ON orden_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_orden_items" ON orden_items FOR DELETE TO authenticated USING (true);

-- tareas
CREATE POLICY "auth_select_tareas" ON tareas FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_tareas" ON tareas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_tareas" ON tareas FOR UPDATE TO authenticated USING (true);
CREATE POLICY "auth_delete_tareas" ON tareas FOR DELETE TO authenticated USING (true);

-- ============================================================
-- DATOS DE EJEMPLO (opcional, borrar si no se necesitan)
-- ============================================================

INSERT INTO categorias (nombre, descripcion) VALUES
  ('Herramientas', 'Herramientas manuales y electricas'),
  ('Tornilleria', 'Tornillos, tuercas, arandelas y pernos'),
  ('Electricidad', 'Cables, interruptores y conectores'),
  ('Plomeria', 'Tubos, llaves y accesorios de agua'),
  ('Pinturas', 'Pinturas, barnices y selladores')
ON CONFLICT DO NOTHING;
