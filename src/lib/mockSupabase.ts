// ============================================================
// Mock Supabase client para testing de la PWA sin backend real
//
// Credenciales de prueba:
//   Email:      admin@ferreteria.com
//   Contraseña: admin123
// ============================================================

// ---- Tipos internos -----------------------------------------

type Row = Record<string, unknown>

interface FilterDef {
  type: 'eq' | 'neq' | 'ilike' | 'or' | 'in' | 'gte' | 'lte'
  field: string
  value: unknown
}

interface OrderDef {
  col: string
  asc: boolean
  nullsFirst: boolean
}

// ---- Store --------------------------------------------------

interface MockStore {
  categorias: Row[]
  clientes: Row[]
  productos: Row[]
  ordenes: Row[]
  orden_items: Row[]
  tareas: Row[]
}

let _store: MockStore | null = null

function getStore(): MockStore {
  if (!_store) _store = initStore()
  return _store
}

function initStore(): MockStore {
  const now = new Date().toISOString()

  function daysAgo(n: number): string {
    const d = new Date()
    d.setDate(d.getDate() - n)
    return d.toISOString().split('T')[0]
  }
  function daysAgoISO(n: number): string {
    return new Date(Date.now() - n * 86400000).toISOString()
  }
  function daysFuture(n: number): string {
    const d = new Date()
    d.setDate(d.getDate() + n)
    return d.toISOString().split('T')[0]
  }

  const categorias: Row[] = [
    { id: 'cat-1', nombre: 'Herramientas Manuales',    descripcion: 'Martillos, destornilladores, llaves', created_at: now },
    { id: 'cat-2', nombre: 'Herramientas Eléctricas',  descripcion: 'Taladros, amoladoras, sierras',       created_at: now },
    { id: 'cat-3', nombre: 'Tornillería',              descripcion: 'Tornillos, tuercas, bulones',         created_at: now },
    { id: 'cat-4', nombre: 'Plomería',                 descripcion: 'Caños, codos, llaves de paso',        created_at: now },
    { id: 'cat-5', nombre: 'Pintura',                  descripcion: 'Pinturas, rodillos, brochas',         created_at: now },
  ]

  const clientes: Row[] = [
    { id: 'cli-1', nombre: 'Juan García',       telefono: '351-555-0101', email: 'juan@gmail.com',    direccion: 'Av. Colón 1234',             created_at: now },
    { id: 'cli-2', nombre: 'María López',       telefono: '351-555-0202', email: 'maria@gmail.com',   direccion: 'Bv. San Juan 567',           created_at: now },
    { id: 'cli-3', nombre: 'Carlos Pérez',      telefono: '351-555-0303', email: null,                direccion: 'Calle Rivadavia 890',        created_at: now },
    { id: 'cli-4', nombre: 'Ana Rodríguez',     telefono: null,           email: 'ana@empresa.com',   direccion: null,                         created_at: now },
    { id: 'cli-5', nombre: 'Roberto Martínez',  telefono: '351-555-0505', email: 'roberto@gmail.com', direccion: 'Av. Vélez Sársfield 234',   created_at: now },
  ]

  const productos: Row[] = [
    { id: 'prod-1', codigo: 'HM-001',  nombre: 'Martillo de Carpintero',      categoria_id: 'cat-1', unidad: 'unidad', stock: 15, stock_minimo: 5,  precio: 2500,  created_at: now },
    { id: 'prod-2', codigo: 'HM-002',  nombre: 'Destornillador Phillips #2',  categoria_id: 'cat-1', unidad: 'unidad', stock: 30, stock_minimo: 10, precio: 850,   created_at: now },
    { id: 'prod-3', codigo: 'HE-001',  nombre: 'Taladro 13mm 750W',           categoria_id: 'cat-2', unidad: 'unidad', stock: 8,  stock_minimo: 3,  precio: 18500, created_at: now },
    { id: 'prod-4', codigo: 'HE-002',  nombre: 'Amoladora 4.5" 750W',         categoria_id: 'cat-2', unidad: 'unidad', stock: 2,  stock_minimo: 3,  precio: 22000, created_at: now }, // stock bajo
    { id: 'prod-5', codigo: 'TOR-001', nombre: 'Tornillo hexagonal M6x30',    categoria_id: 'cat-3', unidad: '100u',   stock: 50, stock_minimo: 20, precio: 350,   created_at: now },
    { id: 'prod-6', codigo: 'TOR-002', nombre: 'Tuerca hexagonal M6',         categoria_id: 'cat-3', unidad: '100u',   stock: 40, stock_minimo: 20, precio: 280,   created_at: now },
    { id: 'prod-7', codigo: 'PLO-001', nombre: 'Caño PVC 110mm x 3m',         categoria_id: 'cat-4', unidad: 'metro',  stock: 0,  stock_minimo: 10, precio: 1200,  created_at: now }, // sin stock
    { id: 'prod-8', codigo: 'PIN-001', nombre: 'Pintura Látex 20L Blanco',    categoria_id: 'cat-5', unidad: 'balde',  stock: 12, stock_minimo: 5,  precio: 15000, created_at: now },
  ]

  const ordenes: Row[] = [
    { id: 'ord-1',  numero: 1001, cliente_id: 'cli-1', estado: 'completada', fecha: daysAgo(15),  total: 21850, notas: 'Cliente habitual',  created_at: daysAgoISO(15)  },
    { id: 'ord-2',  numero: 1002, cliente_id: 'cli-2', estado: 'en_proceso', fecha: daysAgo(7),   total: 8500,  notas: null,                created_at: daysAgoISO(7)   },
    { id: 'ord-3',  numero: 1003, cliente_id: 'cli-3', estado: 'pendiente',  fecha: daysAgo(3),   total: 4000,  notas: 'Urgente',           created_at: daysAgoISO(3)   },
    { id: 'ord-4',  numero: 1004, cliente_id: null,    estado: 'pendiente',  fecha: daysAgo(1),   total: 2500,  notas: null,                created_at: daysAgoISO(1)   },
    { id: 'ord-5',  numero: 1005, cliente_id: 'cli-5', estado: 'cancelada',  fecha: daysAgo(20),  total: 0,     notas: 'Cliente canceló',   created_at: daysAgoISO(20)  },
    { id: 'ord-6',  numero: 1000, cliente_id: 'cli-4', estado: 'completada', fecha: daysAgo(45),  total: 35000, notas: null,                created_at: daysAgoISO(45)  },
    { id: 'ord-7',  numero: 999,  cliente_id: 'cli-1', estado: 'completada', fecha: daysAgo(60),  total: 12000, notas: null,                created_at: daysAgoISO(60)  },
    { id: 'ord-8',  numero: 998,  cliente_id: 'cli-2', estado: 'completada', fecha: daysAgo(90),  total: 8500,  notas: null,                created_at: daysAgoISO(90)  },
    { id: 'ord-9',  numero: 997,  cliente_id: 'cli-3', estado: 'completada', fecha: daysAgo(120), total: 15000, notas: null,                created_at: daysAgoISO(120) },
    { id: 'ord-10', numero: 996,  cliente_id: 'cli-5', estado: 'completada', fecha: daysAgo(150), total: 9000,  notas: null,                created_at: daysAgoISO(150) },
  ]

  const orden_items: Row[] = [
    { id: 'oi-1', orden_id: 'ord-1', producto_id: 'prod-3', cantidad: 1, precio_unitario: 18500, subtotal: 18500, created_at: now },
    { id: 'oi-2', orden_id: 'ord-1', producto_id: 'prod-1', cantidad: 1, precio_unitario: 2500,  subtotal: 2500,  created_at: now },
    { id: 'oi-3', orden_id: 'ord-1', producto_id: 'prod-2', cantidad: 1, precio_unitario: 850,   subtotal: 850,   created_at: now },
    { id: 'oi-4', orden_id: 'ord-2', producto_id: 'prod-4', cantidad: 1, precio_unitario: 8500,  subtotal: 8500,  created_at: now },
    { id: 'oi-5', orden_id: 'ord-3', producto_id: 'prod-5', cantidad: 5, precio_unitario: 350,   subtotal: 1750,  created_at: now },
    { id: 'oi-6', orden_id: 'ord-3', producto_id: 'prod-6', cantidad: 5, precio_unitario: 280,   subtotal: 1400,  created_at: now },
    { id: 'oi-7', orden_id: 'ord-3', producto_id: 'prod-2', cantidad: 1, precio_unitario: 850,   subtotal: 850,   created_at: now },
    { id: 'oi-8', orden_id: 'ord-4', producto_id: 'prod-1', cantidad: 1, precio_unitario: 2500,  subtotal: 2500,  created_at: now },
  ]

  const tareas: Row[] = [
    { id: 'tar-1', titulo: 'Revisar taladro averiado',       descripcion: 'Cliente trae el taladro para diagnóstico',          estado: 'en_progreso', prioridad: 'alta',  orden_id: 'ord-2', asignado_a: 'Juan Técnico',   fecha_vencimiento: daysFuture(2),  created_at: daysAgoISO(7)  },
    { id: 'tar-2', titulo: 'Reponer tornillería M6',         descripcion: 'Hacer pedido al proveedor de tornillos M6 y M8',    estado: 'pendiente',   prioridad: 'media', orden_id: null,    asignado_a: null,              fecha_vencimiento: daysFuture(5),  created_at: daysAgoISO(3)  },
    { id: 'tar-3', titulo: 'Reparar amoladora cliente',      descripcion: 'Cambio de disco y revisión general de la amoladora', estado: 'pendiente',   prioridad: 'alta',  orden_id: 'ord-3', asignado_a: 'Pedro Mecánico', fecha_vencimiento: daysFuture(1),  created_at: daysAgoISO(3)  },
    { id: 'tar-4', titulo: 'Inventario mensual',             descripcion: 'Contar y actualizar stock de todos los productos',   estado: 'pendiente',   prioridad: 'baja',  orden_id: null,    asignado_a: null,              fecha_vencimiento: daysFuture(10), created_at: daysAgoISO(1)  },
    { id: 'tar-5', titulo: 'Contactar proveedor pinturas',   descripcion: 'Solicitar cotización para el mes próximo',           estado: 'completada',  prioridad: 'media', orden_id: null,    asignado_a: 'Maria Admin',    fecha_vencimiento: daysAgo(1),     created_at: daysAgoISO(5)  },
    { id: 'tar-6', titulo: 'Mantenimiento compresor',        descripcion: 'Cambio de aceite y filtros del compresor',           estado: 'en_progreso', prioridad: 'alta',  orden_id: null,    asignado_a: 'Juan Técnico',   fecha_vencimiento: daysAgo(0),     created_at: daysAgoISO(2)  },
  ]

  return { categorias, clientes, productos, ordenes, orden_items, tareas }
}

// ---- Generador de IDs ---------------------------------------

function genId(): string {
  return `mock-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

// ---- Query Builder ------------------------------------------

class QueryBuilder {
  private _op: 'select' | 'insert' | 'update' | 'delete' = 'select'
  private _selectStr = '*'
  private _insertData: Row | Row[] | null = null
  private _updateData: Row | null = null
  private _filters: FilterDef[] = []
  private _order: OrderDef | null = null
  private _limitN: number | null = null
  private _isSingle = false
  private _isCount = false
  private _isHead = false
  private _afterMutationSelect = false

  constructor(private table: keyof MockStore) {}

  // ---- Chainable methods ------------------------------------

  select(fields = '*', opts?: { count?: 'exact'; head?: boolean }) {
    if (this._op === 'insert' || this._op === 'update') {
      this._afterMutationSelect = true
    } else {
      this._op = 'select'
      this._selectStr = fields
    }
    if (opts?.count === 'exact') this._isCount = true
    if (opts?.head)              this._isHead  = true
    return this
  }

  insert(data: Row | Row[]) {
    this._op         = 'insert'
    this._insertData = data
    return this
  }

  update(data: Row) {
    this._op         = 'update'
    this._updateData = data
    return this
  }

  delete() {
    this._op = 'delete'
    return this
  }

  eq(field: string, value: unknown)     { this._filters.push({ type: 'eq',    field, value }); return this }
  neq(field: string, value: unknown)    { this._filters.push({ type: 'neq',   field, value }); return this }
  ilike(field: string, value: string)   { this._filters.push({ type: 'ilike', field, value }); return this }
  or(conditions: string)                { this._filters.push({ type: 'or',    field: '', value: conditions }); return this }
  in(field: string, value: unknown[])   { this._filters.push({ type: 'in',    field, value }); return this }
  gte(field: string, value: unknown)    { this._filters.push({ type: 'gte',   field, value }); return this }
  lte(field: string, value: unknown)    { this._filters.push({ type: 'lte',   field, value }); return this }

  order(col: string, opts?: { ascending?: boolean; nullsFirst?: boolean }) {
    this._order = { col, asc: opts?.ascending ?? true, nullsFirst: opts?.nullsFirst ?? true }
    return this
  }

  limit(n: number)  { this._limitN = n; return this }
  single()          { this._isSingle = true; return this }

  // ---- Promise interface ------------------------------------

  then(
    resolve: (v: unknown) => unknown,
    reject?: (r: unknown) => unknown,
  ) {
    return Promise.resolve(this._execute()).then(resolve, reject)
  }

  // ---- Execution --------------------------------------------

  private _execute() {
    try {
      switch (this._op) {
        case 'select': return this._doSelect()
        case 'insert': return this._doInsert()
        case 'update': return this._doUpdate()
        case 'delete': return this._doDelete()
      }
    } catch (e) {
      return { data: null, count: null, error: { message: String(e) } }
    }
  }

  // ---- Select -----------------------------------------------

  private _doSelect() {
    const store = getStore()
    let rows = [...store[this.table]]

    rows = this._applyFilters(rows)

    if (this._isCount && this._isHead) {
      return { data: null, count: rows.length, error: null }
    }

    rows = this._resolveJoins(rows)
    rows = this._applyOrder(rows)

    if (this._limitN !== null) rows = rows.slice(0, this._limitN)

    if (this._isSingle) {
      return rows.length > 0
        ? { data: rows[0], error: null }
        : { data: null, error: { message: 'Row not found', code: 'PGRST116' } }
    }

    return { data: rows, count: this._isCount ? rows.length : null, error: null }
  }

  // ---- Insert -----------------------------------------------

  private _doInsert() {
    const store = getStore()
    const now   = new Date().toISOString()
    const arr   = Array.isArray(this._insertData) ? this._insertData : [this._insertData!]

    const inserted: Row[] = arr.map(data => {
      const row: Row = { id: genId(), created_at: now, ...data }

      // Auto-incrementar numero para ordenes
      if (this.table === 'ordenes') {
        const maxNumero = (store.ordenes as Row[]).reduce(
          (mx, o) => Math.max(mx, Number(o.numero) || 0),
          0,
        )
        row.numero = maxNumero + 1
      }

      ;(store[this.table] as Row[]).push(row)
      return row
    })

    if (this._afterMutationSelect) {
      return this._isSingle
        ? { data: inserted[0], error: null }
        : { data: inserted, error: null }
    }
    return { data: null, error: null }
  }

  // ---- Update -----------------------------------------------

  private _doUpdate() {
    const store     = getStore()
    const tableRows = store[this.table] as Row[]
    let updated: Row | null = null

    for (let i = 0; i < tableRows.length; i++) {
      if (this._matchesAll(tableRows[i])) {
        tableRows[i] = { ...tableRows[i], ...this._updateData }
        updated = tableRows[i]
      }
    }

    if (this._afterMutationSelect && this._isSingle) {
      return { data: updated, error: null }
    }
    return { data: null, error: null }
  }

  // ---- Delete -----------------------------------------------

  private _doDelete() {
    const store     = getStore()
    const tableRows = store[this.table] as Row[]
    const kept      = tableRows.filter(r => !this._matchesAll(r))
    tableRows.length = 0
    tableRows.push(...kept)
    return { data: null, error: null }
  }

  // ---- Filter helpers ---------------------------------------

  private _matchesAll(row: Row): boolean {
    return this._filters.every(f => this._matchFilter(row, f))
  }

  private _matchFilter(row: Row, f: FilterDef): boolean {
    switch (f.type) {
      case 'eq':  return row[f.field] === f.value
      case 'neq': return row[f.field] !== f.value
      case 'gte': return String(row[f.field] ?? '') >= String(f.value)
      case 'lte': return String(row[f.field] ?? '') <= String(f.value)
      case 'in':  return (f.value as unknown[]).includes(row[f.field])
      case 'ilike': {
        const haystack = String(row[f.field] ?? '').toLowerCase()
        const pattern  = String(f.value).replace(/%/g, '.*').toLowerCase()
        return new RegExp(`^${pattern}$`).test(haystack)
      }
      case 'or': {
        // e.g. "nombre.ilike.%search%,codigo.ilike.%search%"
        return String(f.value).split(',').some(cond => {
          const dot1 = cond.indexOf('.')
          const dot2 = cond.indexOf('.', dot1 + 1)
          if (dot1 === -1 || dot2 === -1) return false
          const field = cond.slice(0, dot1)
          const op    = cond.slice(dot1 + 1, dot2)
          const val   = cond.slice(dot2 + 1)
          if (op === 'ilike') {
            const haystack = String(row[field] ?? '').toLowerCase()
            const pattern  = val.replace(/%/g, '.*').toLowerCase()
            return new RegExp(`^${pattern}$`).test(haystack)
          }
          return false
        })
      }
      default: return true
    }
  }

  private _applyFilters(rows: Row[]): Row[] {
    return rows.filter(r => this._matchesAll(r))
  }

  private _applyOrder(rows: Row[]): Row[] {
    if (!this._order) return rows
    const { col, asc, nullsFirst } = this._order
    return [...rows].sort((a, b) => {
      const av = a[col]
      const bv = b[col]
      if (av == null) return nullsFirst ? -1 : 1
      if (bv == null) return nullsFirst ?  1 : -1
      if (av < bv)   return asc ? -1 : 1
      if (av > bv)   return asc ?  1 : -1
      return 0
    })
  }

  // ---- Join resolution --------------------------------------

  private _resolveJoins(rows: Row[]): Row[] {
    // Detectar joins en el select string, e.g. "clientes(nombre, telefono)"
    const pattern = /(\w+)\(([^)]+)\)/g
    const joins: { joinTable: string; rawFields: string }[] = []
    let m: RegExpExecArray | null
    while ((m = pattern.exec(this._selectStr)) !== null) {
      joins.push({ joinTable: m[1], rawFields: m[2] })
    }
    if (joins.length === 0) return rows

    return rows.map(row => {
      const enriched = { ...row }
      for (const { joinTable, rawFields } of joins) {
        enriched[joinTable] = this._resolveJoin(row, joinTable, rawFields)
      }
      return enriched
    })
  }

  private _resolveJoin(row: Row, joinTable: string, _rawFields: string): unknown {
    const store = getStore()

    // Mapa de relaciones: tabla_padre → { tabla_hija → definición }
    type JoinDef = {
      /** 'mto-arr': FK en tabla actual, devuelve array (comportamiento Supabase con clientes/ordenes) */
      kind: 'mto-arr' | 'mto-obj' | 'otm'
      fk: string
    }
    const rels: Record<string, Record<string, JoinDef>> = {
      ordenes:     { clientes:   { kind: 'mto-arr', fk: 'cliente_id'  },
                     orden_items: { kind: 'otm',     fk: 'orden_id'   } },
      orden_items: { productos:  { kind: 'mto-obj', fk: 'producto_id' } },
      tareas:      { ordenes:    { kind: 'mto-arr', fk: 'orden_id'    } },
      productos:   { categorias: { kind: 'mto-obj', fk: 'categoria_id'} },
    }

    const rel = rels[this.table]?.[joinTable]
    if (!rel) return null

    if (!(joinTable in store)) return null
    const joinStore = store[joinTable as keyof MockStore]

    if (rel.kind === 'mto-obj') {
      const fkVal = row[rel.fk]
      if (!fkVal) return null
      return joinStore.find(r => r.id === fkVal) ?? null
    }

    if (rel.kind === 'mto-arr') {
      const fkVal = row[rel.fk]
      if (!fkVal) return null
      const found = joinStore.find(r => r.id === fkVal)
      return found ? [found] : null
    }

    if (rel.kind === 'otm') {
      // One-to-many: encontrar todos los registros hijos
      const related = joinStore.filter(r => r[rel.fk] === row.id)

      // Manejar joins anidados: orden_items → productos
      if (joinTable === 'orden_items') {
        return related.map(item => ({
          ...item,
          productos: (() => {
            if (!item.producto_id) return null
            return store.productos.find(p => p.id === item.producto_id) ?? null
          })(),
        }))
      }

      return related
    }

    return null
  }
}

// ---- Mock Auth ---------------------------------------------

const MOCK_EMAIL    = 'admin@ferreteria.com'
const MOCK_PASSWORD = 'admin123'
const SESSION_KEY   = 'mock_auth_session'

type AuthListener = (event: string, session: unknown) => void
const _authListeners: AuthListener[] = []

function getMockUser() {
  return {
    id:             'mock-user-001',
    aud:            'authenticated',
    role:           'authenticated',
    email:          MOCK_EMAIL,
    email_confirmed_at: new Date().toISOString(),
    created_at:     new Date().toISOString(),
    updated_at:     new Date().toISOString(),
    app_metadata:   { provider: 'email' },
    user_metadata:  { nombre: 'Admin Ferretería' },
  }
}

function getMockSession() {
  return {
    access_token:  'mock-access-token-' + Date.now(),
    refresh_token: 'mock-refresh-token',
    token_type:    'bearer',
    expires_in:    3600,
    expires_at:    Math.floor(Date.now() / 1000) + 3600,
    user:          getMockUser(),
  }
}

function loadSession(): unknown {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveSession(session: unknown) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

function notifyListeners(event: string, session: unknown) {
  _authListeners.forEach(fn => fn(event, session))
}

const mockAuth = {
  async getSession() {
    const session = loadSession()
    return { data: { session }, error: null }
  },

  async signInWithPassword({ email, password }: { email: string; password: string }) {
    if (email === MOCK_EMAIL && password === MOCK_PASSWORD) {
      const session = getMockSession()
      saveSession(session)
      setTimeout(() => notifyListeners('SIGNED_IN', session), 0)
      return { data: { session, user: session.user }, error: null }
    }
    return {
      data:  { session: null, user: null },
      error: { message: 'Invalid login credentials', status: 400 },
    }
  },

  async signOut() {
    clearSession()
    setTimeout(() => notifyListeners('SIGNED_OUT', null), 0)
    return { error: null }
  },

  onAuthStateChange(callback: AuthListener) {
    _authListeners.push(callback)

    // Notificar estado actual de forma asíncrona
    const session = loadSession()
    setTimeout(() => {
      callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session)
    }, 0)

    return {
      data: {
        subscription: {
          unsubscribe() {
            const idx = _authListeners.indexOf(callback)
            if (idx !== -1) _authListeners.splice(idx, 1)
          },
        },
      },
    }
  },
}

// ---- Cliente mock principal ---------------------------------

export function createMockSupabaseClient() {
  return {
    auth: mockAuth,
    from(table: string) {
      return new QueryBuilder(table as keyof MockStore)
    },
  }
}
