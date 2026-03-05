import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import webpush from "web-push";
import cron from "node-cron";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize database
let db;
try {
  db = new Database(path.join(__dirname, "planner.db"));
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      due_date TEXT,
      status TEXT DEFAULT 'pending',
      priority TEXT DEFAULT 'medium'
    );
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      endpoint TEXT UNIQUE NOT NULL,
      keys TEXT NOT NULL
    );
  `);
  
  // Migration for existing databases
  try {
    db.prepare("ALTER TABLE tasks ADD COLUMN priority TEXT DEFAULT 'medium'").run();
  } catch (error) {
    // Column likely already exists, ignore
  }
} catch (error) {
  console.error("Failed to initialize database:", error);
  process.exit(1);
}

// Generate VAPID keys if not provided (in a real app, these should be persistent env vars)
// For this demo, we'll generate them on startup if not set, but this means
// subscriptions are invalid after server restart unless we persist them.
// Let's try to persist them in the DB or just use a fixed pair for this session.
// Ideally, we should read from env or a file.
const vapidKeys = webpush.generateVAPIDKeys();
const publicVapidKey = process.env.VAPID_PUBLIC_KEY || vapidKeys.publicKey;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || vapidKeys.privateKey;

webpush.setVapidDetails(
  "mailto:example@yourdomain.org",
  publicVapidKey,
  privateVapidKey
);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/tasks", (req, res) => {
    try {
      const tasks = db.prepare("SELECT * FROM tasks").all();
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/tasks", (req, res) => {
    try {
      const { title, description, due_date, priority } = req.body;
      const stmt = db.prepare("INSERT INTO tasks (title, description, due_date, status, priority) VALUES (?, ?, ?, 'todo', ?)");
      const info = stmt.run(title, description, due_date, priority || 'medium');
      res.json({ id: info.lastInsertRowid });
    } catch (error) {
      console.error("Error adding task:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.put("/api/tasks/:id", (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, due_date, status, priority } = req.body;
      
      // Build dynamic query based on provided fields
      const updates = [];
      const values = [];

      if (title !== undefined) { updates.push("title = ?"); values.push(title); }
      if (description !== undefined) { updates.push("description = ?"); values.push(description); }
      if (due_date !== undefined) { updates.push("due_date = ?"); values.push(due_date); }
      if (status !== undefined) { updates.push("status = ?"); values.push(status); }
      if (priority !== undefined) { updates.push("priority = ?"); values.push(priority); }

      if (updates.length === 0) {
        return res.json({ success: true }); // Nothing to update
      }

      values.push(id);
      const sql = `UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`;
      const stmt = db.prepare(sql);
      stmt.run(...values);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.delete("/api/tasks/:id", (req, res) => {
    try {
      const { id } = req.params;
      const stmt = db.prepare("DELETE FROM tasks WHERE id = ?");
      stmt.run(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Push Notification Routes
  app.get("/api/vapid-public-key", (req, res) => {
    res.json({ publicKey: publicVapidKey });
  });

  app.post("/api/subscribe", (req, res) => {
    try {
      const subscription = req.body;
      const stmt = db.prepare("INSERT OR IGNORE INTO subscriptions (endpoint, keys) VALUES (?, ?)");
      stmt.run(subscription.endpoint, JSON.stringify(subscription.keys));
      res.status(201).json({});
    } catch (error) {
      console.error("Error subscribing:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Check for tasks due soon every minute
  cron.schedule("* * * * *", () => {
    console.log("Checking for due tasks...");
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const tasks = db.prepare("SELECT * FROM tasks WHERE status != 'done'").all();
    const dueTasks = tasks.filter((task: any) => {
      const dueDate = new Date(task.due_date);
      return dueDate > now && dueDate <= tomorrow;
    });

    if (dueTasks.length > 0) {
      const subscriptions = db.prepare("SELECT * FROM subscriptions").all();
      
      dueTasks.forEach((task: any) => {
        const payload = JSON.stringify({
          title: "Tarefa Próxima do Prazo!",
          body: `A tarefa "${task.title}" vence em breve.`,
        });

        subscriptions.forEach((sub: any) => {
          const subscriptionConfig = {
            endpoint: sub.endpoint,
            keys: JSON.parse(sub.keys),
          };

          webpush.sendNotification(subscriptionConfig, payload).catch((err) => {
            console.error("Error sending notification, deleting subscription:", err);
            if (err.statusCode === 410 || err.statusCode === 404) {
               db.prepare("DELETE FROM subscriptions WHERE id = ?").run(sub.id);
            }
          });
        });
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
