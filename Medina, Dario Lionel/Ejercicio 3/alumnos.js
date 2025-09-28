import express from "express";
import { db } from "./db.js";
import { body, param, validationResult } from "express-validator";

const router = express.Router();

const validarErrores = (req, res, next) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Error de validación",
      errores: errores.array(),
    });
  }
  next();
};

const validarId = param("id").isInt({ min: 1 });

const validarAlumnos = [
  body("nombre_alumno").isAlpha("es-ES", { ignore: " " }).isLength({ max: 50 }),
  body("materia_id").isInt({ min: 1 }),
  body("nota1").isFloat({ min: 0 }),
  body("nota2").isFloat({ min: 0 }),
  body("nota3").isFloat({ min: 0 }),
];

router.get("/", async (req, res) => {
  const sql = `SELECT a.id, a.alumnos AS nombre_alumno, m.nombre AS materia, a.nota1, a.nota2, a.nota3 FROM alumnos a JOIN materias m ON a.materia_id = m.id ORDER BY a.alumnos`;

  const [rows] = await db.execute(sql);

  res.json({success: true, data: rows});
});

router.get("/:id", validarId, validarErrores, async (req, res) => {
  const alumnoId = Number(req.params.id);
  const [rows] = await db.execute("SELECT * FROM alumnos WHERE id=?", [
    alumnoId,
  ]);

  if (rows.length === 0) {
    return res
      .status(404)
      .json({ success: false, message: "No se encontro el alumno" });
  }

  res.json({success: true, data: registros[0]});
});

router.post("/", validarAlumnos, validarErrores, async (req, res) => {
  const { nombre_alumno, materia_id, nota1, nota2, nota3 } = req.body;

  const [result] = await db.execute(
    "INSERT INTO alumnos (alumnos, materia_id, nota1, nota2, nota3) VALUES (?,?,?,?,?)",
    [nombre_alumno, materia_id, nota1, nota2, nota3]
  );

  res.status(201).json({
    success: true,
    data: {
      id: result.insertId,
      nombre_alumno,
      materia_id,
      nota1,
      nota2,
      nota3,
    },
  });
});

router.put("/:id", validarId, validarAlumnos, validarErrores, async (req, res) => {
  const alumnoId = Number(req.params.id);
  const {nombre_alumno, materia_id, nota1, nota2, nota3} = req.body;

  await db.execute(
    "UPDATE alumnos SET alumnos=?, materia_id=?, nota1=?, nota2=?, nota3=? WHERE id=?",
    [nombre_alumno, materia_id, nota1, nota2, nota3, alumnoId]
  );

  res.json({
    success: true,
    data: {id: alumnoId, nombre_alumno, materia_id, nota1, nota2, nota3},
  });
});

router.delete("/:id", validarId, validarErrores, async (req, res) => {
  const alumnoId = Number(req.params.id);
  await db.execute("DELETE FROM alumnos WHERE id=?", [alumnoId]);
  res.json({success: true, data: alumnoId});
});

export default router;