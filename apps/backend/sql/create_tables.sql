-- Table users
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firstname TEXT NOT NULL,
  lastname TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table sleeps
CREATE TABLE IF NOT EXISTS sleeps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  duration TEXT,
  duration_min INTEGER,
  mean_hr REAL,
  bedtime TEXT,
  waketime TEXT,
  score REAL,
  bedtime_full TEXT,
  waketime_full TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sleeps_user_id ON sleeps (user_id);
CREATE INDEX IF NOT EXISTS idx_sleeps_date ON sleeps (date);
CREATE INDEX IF NOT EXISTS idx_sleeps_bedtime_full ON sleeps (bedtime_full);
CREATE INDEX IF NOT EXISTS idx_sleeps_waketime_full ON sleeps (waketime_full);
