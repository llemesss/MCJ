const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Criar diretório de dados se não existir
const fs = require('fs');
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'mcj-worship.db');

class SQLiteDB {
  constructor() {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Erro ao conectar com SQLite:', err.message);
      } else {
        console.log('Conectado ao banco SQLite em:', dbPath);
        this.initTables();
      }
    });
  }

  initTables() {
    // Tabela de usuários
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'member',
        ministry TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de ministérios
    this.db.run(`
      CREATE TABLE IF NOT EXISTS ministries (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        createdBy TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de músicas
    this.db.run(`
      CREATE TABLE IF NOT EXISTS songs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        artist TEXT,
        originalKey TEXT,
        bpm INTEGER,
        genre TEXT,
        difficulty TEXT,
        lyrics TEXT,
        notes TEXT,
        tags TEXT,
        instruments TEXT,
        links TEXT,
        multitrack TEXT,
        ministry TEXT,
        createdBy TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Adicionar coluna multitrack se não existir (para bancos existentes)
    this.db.run(`
      ALTER TABLE songs ADD COLUMN multitrack TEXT
    `, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error('Erro ao adicionar coluna multitrack:', err.message);
      }
    });

    console.log('Tabelas SQLite inicializadas');
  }

  // Método para inserir música
  insertSong(songData) {
    return new Promise((resolve, reject) => {
      const {
        id,
        title,
        artist,
        originalKey,
        bpm,
        genre,
        difficulty,
        lyrics,
        notes,
        tags,
        instruments,
        links,
        multitrack,
        ministry,
        createdBy
      } = songData;

      const stmt = this.db.prepare(`
        INSERT INTO songs (
          id, title, artist, originalKey, bpm, genre, difficulty,
          lyrics, notes, tags, instruments, links, multitrack, ministry, createdBy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run([
        id,
        title,
        artist,
        originalKey,
        bpm,
        genre,
        difficulty,
        lyrics,
        notes,
        JSON.stringify(tags),
        JSON.stringify(instruments),
        JSON.stringify(links),
        JSON.stringify(multitrack),
        ministry,
        createdBy
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: songData.id, ...songData });
        }
      });

      stmt.finalize();
    });
  }

  // Método para buscar todas as músicas
  getAllSongs() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM songs ORDER BY createdAt DESC', (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const songs = rows.map(row => ({
            ...row,
            tags: JSON.parse(row.tags || '[]'),
            instruments: JSON.parse(row.instruments || '[]'),
            links: JSON.parse(row.links || '{}'),
            multitrack: JSON.parse(row.multitrack || 'null')
          }));
          resolve(songs);
        }
      });
    });
  }

  // Método para buscar música por ID
  getSongById(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM songs WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          const song = {
            ...row,
            tags: JSON.parse(row.tags || '[]'),
            instruments: JSON.parse(row.instruments || '[]'),
            links: JSON.parse(row.links || '{}'),
            multitrack: JSON.parse(row.multitrack || 'null')
          };
          resolve(song);
        } else {
          resolve(null);
        }
      });
    });
  }

  // Método para atualizar música
  updateSong(id, songData) {
    return new Promise((resolve, reject) => {
      const {
        title,
        artist,
        originalKey,
        bpm,
        genre,
        difficulty,
        lyrics,
        notes,
        tags,
        instruments,
        links,
        multitrack
      } = songData;

      const stmt = this.db.prepare(`
        UPDATE songs SET
          title = ?, artist = ?, originalKey = ?, bpm = ?, genre = ?,
          difficulty = ?, lyrics = ?, notes = ?, tags = ?, instruments = ?, links = ?, multitrack = ?
        WHERE id = ?
      `);

      stmt.run([
        title,
        artist,
        originalKey,
        bpm,
        genre,
        difficulty,
        lyrics,
        notes,
        JSON.stringify(tags || []),
        JSON.stringify(instruments || []),
        JSON.stringify(links || {}),
        JSON.stringify(multitrack),
        id
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id, ...songData });
        }
      });

      stmt.finalize();
    });
  }

  close() {
    this.db.close((err) => {
      if (err) {
        console.error('Erro ao fechar banco SQLite:', err.message);
      } else {
        console.log('Conexão SQLite fechada.');
      }
    });
  }
}

module.exports = new SQLiteDB();