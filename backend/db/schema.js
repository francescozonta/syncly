const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const createTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      avatar_initials VARCHAR(3),
      role VARCHAR(50) DEFAULT 'member',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      color VARCHAR(20) DEFAULT '#185FA5',
      owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS project_members (
      project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      PRIMARY KEY (project_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS ideas (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
      author_id UUID REFERENCES users(id) ON DELETE SET NULL,
      text TEXT NOT NULL,
      category VARCHAR(50) DEFAULT 'Generale',
      color VARCHAR(20) DEFAULT 'yellow',
      votes INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
      title VARCHAR(200) NOT NULL,
      status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo','inprogress','done')),
      tag VARCHAR(50),
      assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
      due_date DATE,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS epics (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      color VARCHAR(20) DEFAULT '#185FA5',
      start_month INTEGER NOT NULL,
      duration_months INTEGER NOT NULL DEFAULT 2,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS idea_votes (
      idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      PRIMARY KEY (idea_id, user_id)
    );
  `);
  console.log('✅ Tabelle create / già esistenti');
};

module.exports = { pool, createTables };
