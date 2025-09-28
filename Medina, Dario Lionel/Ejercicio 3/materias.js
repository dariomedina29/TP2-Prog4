import express from "express";
import { db } from "./db.js";
import { body, param, validationResult } from "express-validator";

const router = express.Router();

const validarErrores = (req, res, next) => {
  const resultado = validationResult(req);
  if (!resultado.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Error de validación",
      errores: resultado.array(),
    });
  }
  next();
};

const validarId = param("id").isInt({ min: 1 });
const validarNombre = body("nombre").isAlpha("es-ES", { ignore: " " }).isLength({ max: 50 });

router.get("/", async (req, res) => {
  const [rows] = await db.execute("SELECT * FROM materias");
  res.json({ success: true, data: rows });
});

router.get("/:id", validarId, validarErrores, async (req, res) => {
  const materiaId = Number(req.params.id);

  const [rows] = await db.execute(
    "SELECT * FROM materias WHERE id=?",
    [materiaId]
  );

  if (rows.length === 0) {
    return res
      .status(404)
      .json({success: false, message: "Materia no encontrada"});
  }

  res.json({success: true, data: rows[0]});
});

router.post("/", validarNombre, validarErrores, async (req, res) => {
  const {nombre} = req.body;

  const [resultado] = await db.execute(
    "INSERT INTO materias (nombre) VALUES (?)",
    [nombre]
  );

  res.status(201).json({
    success: true,
    data: {id: resultado.insertId, nombre},
  });
});

router.put(
  "/:id",
  validarId,
  validarNombre,
  validarErrores,
  async (req, res) => {
    const materiaId = Number(req.params.id);
    const { nombre } = req.body;

    await db.execute("UPDATE materias SET nombre=? WHERE id=?", [nombre,materiaId]);

    res.json({
      success: true,
      data: { id: materiaId, nombre },
    });
  }
);

router.delete("/:id", validarId, validarErrores, async (req, res) => {
  const materiaId = Number(req.params.id);

  await db.execute("DELETE FROM materias WHERE id=?", [materiaId]);

  res.json({success: true, data: materiaId});
});

export default router;
