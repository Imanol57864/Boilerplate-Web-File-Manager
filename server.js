const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, "files.json");

// Crear directorio uploads si no existe
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// asegurarse de que exista el JSON de metadata
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

// función utilitaria: leer/escribir metadata
const loadDB = () => JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
const saveDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

// Configuración Multer con diskStorage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Servir estáticos
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(uploadsDir));

// subir archivo
app.post("/api/upload", upload.single("file"), (req, res) => {
  const db = loadDB();
  const fileMeta = {
    id: req.file.filename,        // nombre en disco
    originalName: req.file.originalname, 
    size: req.file.size,
    mimetype: req.file.mimetype,
    path: `/uploads/${req.file.filename}`,
    uploadDate: new Date().toISOString()
  };
  db.push(fileMeta);
  saveDB(db);

  res.json(fileMeta);
});

// listar archivos - formato simplificado para FilePond
app.get("/api/files", (req, res) => {
  const db = loadDB();
  // Simplificar el formato - FilePond solo necesita el ID para cargar
  const fileList = db.map(file => ({
    id: file.id,
    originalName: file.originalName,
    size: file.size
  }));
  res.json(fileList);
});

// eliminar archivo
app.delete("/api/upload/:id", (req, res) => {
  const db = loadDB();
  const fileId = req.params.id;
  const fileIndex = db.findIndex(f => f.id === fileId);

  if (fileIndex === -1) {
    return res.status(404).json({ error: "File not found" });
  }

  const filePath = path.join(uploadsDir, db[fileIndex].id);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error('Error deleting file:', err);
    }
  }

  db.splice(fileIndex, 1);
  saveDB(db);

  res.json({ deleted: fileId });
});

// endpoint para servir archivos con headers apropiados
app.get("/uploads/:id", (req, res) => {
  const db = loadDB();
  const fileId = req.params.id;
  const fileInfo = db.find(f => f.id === fileId);
  
  const filePath = path.join(uploadsDir, fileId);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }

  // Establecer headers apropiados si tenemos info del archivo
  if (fileInfo) {
    res.set({
      'Content-Type': fileInfo.mimetype || 'application/octet-stream',
      'Content-Disposition': `inline; filename="${fileInfo.originalName}"`
    });
  }
  
  res.sendFile(filePath);
});

// endpoint para ver archivo directamente (preview/download)
app.get("/api/view/:id", (req, res) => {
  const filePath = path.join(uploadsDir, req.params.id);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  res.status(404).send("File not found");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});