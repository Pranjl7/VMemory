CREATE TABLE host_configuration (
  id INTEGER PRIMARY KEY,
  total_memory INTEGER NOT NULL,
  allocated_memory INTEGER NOT NULL DEFAULT 0,
  available_memory INTEGER NOT NULL
);

CREATE TABLE virtual_machines (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  initial_memory INTEGER NOT NULL,
  allocated_memory INTEGER NOT NULL DEFAULT 0,
  maximum_memory INTEGER NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  color INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE memory_blocks (
  id TEXT PRIMARY KEY,
  vm_id TEXT NOT NULL REFERENCES virtual_machines(id) ON DELETE CASCADE,
  start_address INTEGER NOT NULL,
  size INTEGER NOT NULL,
  requested INTEGER NOT NULL
);

CREATE TABLE allocation_history (
  seq BIGSERIAL PRIMARY KEY,
  id TEXT NOT NULL UNIQUE,
  vm_id TEXT,
  vm_name TEXT,
  action TEXT NOT NULL,
  requested_memory INTEGER,
  algorithm TEXT,
  allocated_memory INTEGER,
  allocation_status TEXT NOT NULL,
  block_start INTEGER,
  message TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
