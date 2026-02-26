import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

@Injectable({
  providedIn: 'root'
})
export class SqliteService {

  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private readonly dbName = 'etnoapp.db';
  private initializing = false; //Estas variables permiten usar guard y app.component para inicializar sin conflictos
  private initialized = false;

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  // Inicia la base de datos
async initialize(): Promise<void> {

  // Si ya terminó de inicializar, no hace nada
  if (this.initialized) return;

  // Si alguien ya está inicializando, espera
  if (this.initializing) {
    while (!this.initialized) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    return;
  }

  this.initializing = true;

  try {

    const isConn = await this.sqlite.isConnection(this.dbName, false);

    if (isConn.result) {
      this.db = await this.sqlite.retrieveConnection(this.dbName, false);
    } else {
      this.db = await this.sqlite.createConnection(
        this.dbName,
        false,
        'no-encryption',
        1,
        false
      );
    }

    await this.db.open();

    console.error('SQLITE_INICIALIZADO');

    await this.createSessionTable();
    await this.createProyectoTable();
    await this.createTipoUsuarioTable();
    await this.createLocalContext();
    await this.createTipoArchivoTable();
    await this.createLocalArchivoTable();
    await this.createLocalContactoProyectoTable();
    await this.createLocalNotaTable();

    this.initialized = true;

  } catch (error) {
    console.error('ERROR_INICIALIZANDO_SQLITE', error);
    throw error;
  } finally {
    this.initializing = false;
  }
}

// Crear tabla LOCAL_SESSION si es que no existe

  async createSessionTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS LOCAL_SESSION (
      id_usuario TEXT PRIMARY KEY,
      token TEXT NOT NULL,
      last_verified_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );
  `;

  if (!this.db) throw new Error('Database not initialized');
await this.db.execute(createTableSQL);
  console.log('LOCAL_SESSION creada');
}

// Metodo para luego de login guardar los datos de sesion en la tabla LOCAL_SESSION

async saveSession(
  id_usuario: string,
  token: string,
  expires_at: string
) {
  if (!this.db) throw new Error('Database not initialized');

  const now = new Date().toISOString();

  const deleteSQL = `DELETE FROM LOCAL_SESSION;`;  //Borra primero ya que no pueden haber más de una sesión

  const insertSQL = `
    INSERT INTO LOCAL_SESSION (
      id_usuario,
      token,
      last_verified_at,
      expires_at
    ) VALUES (?, ?, ?, ?);
  `;

  await this.db.execute(deleteSQL);
  await this.db.run(insertSQL, [
    id_usuario,
    token,
    now,
    expires_at
  ]);

  console.log('LOCAL_SESSION guardada');
}

async getSessionLocal() { //Metodo para identificar sesión guardada
  if (!this.db) throw new Error('Database not initialized');

  const query = `SELECT * FROM LOCAL_SESSION LIMIT 1;`;

  const result = await this.db.query(query);

  if (!result.values || result.values.length === 0) {
    return null;
  }

  return result.values[0];
}

async clearSession() {
  if (!this.db) throw new Error('Database not initialized');

  await this.db.execute(`DELETE FROM LOCAL_SESSION;`);
  console.log('LOCAL_SESSION eliminada');
}

// Funciones PROYECTO

async createProyectoTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS LOCAL_PROYECTO (
      id_proyecto INTEGER PRIMARY KEY,
      nombre_proyecto TEXT NOT NULL,
      activo TEXT NOT NULL,
      id_ubicacion INTEGER,
      id_empresa INTEGER NOT NULL
    );
  `;

  if (!this.db) throw new Error('Database not initialized');

  await this.db.execute(createTableSQL);
  console.log('LOCAL_PROYECTO creada');
}

async insertProyecto(
  id_proyecto: number,
  nombre_proyecto: string,
  activo: string,
  id_ubicacion: number | null,
  id_empresa: number
) {
  if (!this.db) throw new Error('Database not initialized');

  const sql = `
    INSERT OR REPLACE INTO LOCAL_PROYECTO (
      id_proyecto,
      nombre_proyecto,
      activo,
      id_ubicacion,
      id_empresa
    ) VALUES (?, ?, ?, ?, ?);
  `;

  await this.db.run(sql, [
    id_proyecto,
    nombre_proyecto,
    activo,
    id_ubicacion,
    id_empresa
  ]);

  console.log('PROYECTO_INSERTADO', id_proyecto);
}

async getProyectos() {
  if (!this.db) throw new Error('Database not initialized');

  const result = await this.db.query(
    `SELECT * FROM LOCAL_PROYECTO WHERE activo = '1';`
  );

  return result.values ?? [];
}

// Funciones de TIPO_USUARIO

async createTipoUsuarioTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS LOCAL_TIPO_USUARIO (
      id_tipo_usuario INTEGER PRIMARY KEY,
      nombre_tipo TEXT NOT NULL
    );
  `;

  if (!this.db) throw new Error('Database not initialized');

  await this.db.execute(createTableSQL);
  console.log('LOCAL_TIPO_USUARIO creada');
}

async clearTipoUsuario() {
  if (!this.db) throw new Error('Database not initialized');
  await this.db.execute('DELETE FROM LOCAL_TIPO_USUARIO;');
}

async insertTipoUsuario(
  id_tipo_usuario: number,
  nombre_tipo: string
) {
  if (!this.db) throw new Error('Database not initialized');

  const sql = `
    INSERT OR REPLACE INTO LOCAL_TIPO_USUARIO (
      id_tipo_usuario,
      nombre_tipo
    ) VALUES (?, ?);
  `;

  await this.db.run(sql, [
    id_tipo_usuario,
    nombre_tipo
  ]);
}

async getTipoUsuario() {
  if (!this.db) throw new Error('Database not initialized');

  const result = await this.db.query(
    `SELECT * FROM LOCAL_TIPO_USUARIO ORDER BY id_tipo_usuario ASC;`
  );

  return result.values ?? [];
}


// Funciones de LOCAL_CONTEXT

async createLocalContext() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS LOCAL_CONTEXT  (
  id_usuario TEXT PRIMARY KEY,
  id_proyecto INTEGER NOT NULL,
  id_tipo_usuario INTEGER NOT NULL,
  context_created_at TEXT NOT NULL
  );
  `;

  if (!this.db) throw new Error('Database not initialized');

  await this.db.execute(createTableSQL);
  console.log('LOCAL_CONTEXT creada');
}

async saveContext(
  id_usuario: string,
  id_proyecto: number,
  id_tipo_usuario: number
) {
  if (!this.db) throw new Error('Database not initialized');

  const now = new Date().toISOString();

  await this.db.run(
    `
    INSERT OR REPLACE INTO LOCAL_CONTEXT (
      id_usuario,
      id_proyecto,
      id_tipo_usuario,
      context_created_at
    ) VALUES (?, ?, ?, ?);
    `,
    [id_usuario, id_proyecto, id_tipo_usuario, now]
  );

  console.log('LOCAL_CONTEXT guardado');
}

async getContext(id_usuario: string) {
  if (!this.db) throw new Error('Database not initialized');

  const result = await this.db.query(
    `SELECT * FROM LOCAL_CONTEXT WHERE id_usuario = ? LIMIT 1;`,
    [id_usuario]
  );

  return result.values?.[0] || null;
}


async clearContext(id_usuario: string) {
  if (!this.db) throw new Error('Database not initialized');

  await this.db.run(
    `DELETE FROM LOCAL_CONTEXT WHERE id_usuario = ?;`,
    [id_usuario]
  );

  console.log('LOCAL_CONTEXT eliminado');
}

// Funciones de LOCAL_TIPO_ARCHIVO

async createTipoArchivoTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS LOCAL_TIPO_ARCHIVO (
      id_tipo_archivo INTEGER PRIMARY KEY,
      nombre_tipo_archivo TEXT NOT NULL
    );
  `;

  if (!this.db) throw new Error('Database not initialized');

  await this.db.execute(createTableSQL);
  console.log('LOCAL_TIPO_ARCHIVO creada');
}

async clearTipoArchivo() {
  if (!this.db) throw new Error('Database not initialized');
  await this.db.execute('DELETE FROM LOCAL_TIPO_ARCHIVO;');
}

async insertTipoArchivo(
  id_tipo_archivo: number,
  nombre_tipo_archivo: string
) {
  if (!this.db) throw new Error('Database not initialized');

  const sql = `
    INSERT OR REPLACE INTO LOCAL_TIPO_ARCHIVO (
      id_tipo_archivo,
      nombre_tipo_archivo
    ) VALUES (?, ?);
  `;

  await this.db.run(sql, [
    id_tipo_archivo,
    nombre_tipo_archivo
  ]);
}

async getTipoArchivo() {
  if (!this.db) throw new Error('Database not initialized');

  const result = await this.db.query(
    `SELECT * FROM LOCAL_TIPO_ARCHIVO ORDER BY id_tipo_archivo ASC;`
  );

  return result.values ?? [];
}

// Funciones de LOCAL_ARCHIVO

async createLocalArchivoTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS LOCAL_ARCHIVO (
      id_archivo_local INTEGER PRIMARY KEY AUTOINCREMENT,
      id_archivo_cloud TEXT,
      estado_carga TEXT NOT NULL,
      fecha_creacion TEXT NOT NULL,
      path_local TEXT,
      id_usuario TEXT NOT NULL,
      id_tipo_archivo INTEGER NOT NULL,
      FOREIGN KEY (id_usuario) REFERENCES LOCAL_CONTEXT(id_usuario),
      FOREIGN KEY (id_tipo_archivo) REFERENCES LOCAL_TIPO_ARCHIVO(id_tipo_archivo)
    );
  `;

  if (!this.db) throw new Error('Database not initialized');

  await this.db.execute(createTableSQL);
  console.log('LOCAL_ARCHIVO creada');
}

// Funciones LOCAL_CONTACTO - CONTACTO_PROYECTO

async createLocalContactoProyectoTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS LOCAL_CONTACTO_PROYECTO (
      id_archivo_local INTEGER PRIMARY KEY,
      id_contacto TEXT NOT NULL,
      FOREIGN KEY (id_archivo_local) REFERENCES LOCAL_ARCHIVO(id_archivo_local)
    );
  `;

  if (!this.db) throw new Error('Database not initialized');

  await this.db.execute(createTableSQL);
  console.log('LOCAL_CONTACTO_PROYECTO creada');
}


// Funciones de LOCAL_NOTA

async createLocalNotaTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS LOCAL_NOTA (
      id_archivo_local INTEGER PRIMARY KEY,
      titulo TEXT NOT NULL,
      cuerpo TEXT NOT NULL,
      id_contacto_proyecto INTEGER,
      FOREIGN KEY (id_archivo_local) REFERENCES LOCAL_ARCHIVO(id_archivo_local),
      FOREIGN KEY (id_contacto_proyecto) REFERENCES LOCAL_CONTACTO_PROYECTO(id_archivo_local)
    );
  `;

  if (!this.db) throw new Error('Database not initialized');

  await this.db.execute(createTableSQL);
  console.log('LOCAL_NOTA creada');
}

async createNotaLocal(
  titulo: string,
  cuerpo: string,
  id_usuario: string,
  id_tipo_archivo: number
) {
  if (!this.db) throw new Error('Database not initialized');

  const now = new Date().toISOString();

  // 1. Insertar en LOCAL_ARCHIVO
  const insertArchivoSQL = `
    INSERT INTO LOCAL_ARCHIVO (
      id_archivo_cloud,
      estado_carga,
      fecha_creacion,
      path_local,
      id_usuario,
      id_tipo_archivo
    ) VALUES (?, ?, ?, ?, ?, ?);
  `;

  const archivoResult = await this.db.run(insertArchivoSQL, [
    null,
    'pendiente',
    now,
    null,
    id_usuario,
    id_tipo_archivo
  ]);

  const id_archivo_local = archivoResult.changes?.lastId;

  if (!id_archivo_local) {
    throw new Error('No se pudo crear LOCAL_ARCHIVO');
  }

  // 2. Insertar en LOCAL_NOTA
  const insertNotaSQL = `
    INSERT INTO LOCAL_NOTA (
      id_archivo_local,
      titulo,
      cuerpo,
      id_contacto_proyecto
    ) VALUES (?, ?, ?, ?);
  `;

  await this.db.run(insertNotaSQL, [
    id_archivo_local,
    titulo,
    cuerpo,
    null
  ]);

  console.log('NOTA_LOCAL_CREADA', id_archivo_local);

  return id_archivo_local;
}


async getNotasLocales() {  //Muestra de notas locales
  if (!this.db) throw new Error('Database not initialized');

  const sql = `
    SELECT 
      n.id_archivo_local,
      n.titulo,
      n.cuerpo,
      a.fecha_creacion,
      a.estado_carga
    FROM LOCAL_NOTA n
    INNER JOIN LOCAL_ARCHIVO a
      ON n.id_archivo_local = a.id_archivo_local
    ORDER BY a.fecha_creacion DESC;
  `;

  const result = await this.db.query(sql);

  return result.values ?? [];
}
 
}