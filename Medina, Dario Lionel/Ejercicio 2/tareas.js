import express from "express";
import { db } from "./db.js"
import {body, param, query, validationResult} from "express-validator"

const router = express.Router();

const validarId = [
    param("id").isInt({min:1}).withMessage("Id invalido").toInt(),
];

const validarTarea = [
    body("nombre").isString().withMessage("El nombre debe ser un string").trim().isLength({min:1, max:50}),
    body("completada").isBoolean().toBoolean(),
];

const validarFiltros = [
    query("completada").optional().isBoolean().withMessage("El dato ingresado debe ser un booleano").toBoolean(),
];

const validacionTareas = (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()){
        return res
        .status(400)
        .json({success: false, message: "Falla de validacion", errores: errores.array(),});
    }
    next();
};

router.get("/", validarFiltros, validacionTareas, async (req,res) => {
  const filtros = [];
  const parametros = [];
  const { completada } = req.query;

  let sql = "SELECT * FROM tareas";
  
  if (completada === "true") {
    filtros.push("completada = ?");
    parametros.push(1);
  } else if (completada === "false") {
    filtros.push("completada = ?");
    parametros.push(0);
  }

  if (filtros.length > 0) {
    sql += " WHERE " + filtros.join(" AND ");
  }

  const [rows] = await db.execute(sql, parametros);
  res.json({ success: true, data: rows });
});

router.put("/:id", validarId, validarTarea, validacionTareas, async (req,res) => {
    const id = req.params.id;
    const {nombre, completada} = req.body;

    const [rows] = await db.execute("SELECT * FROM tareas WHERE id = ?", [id]);
    if (rows.length === 0){
        return res
        .status(404)
        .json({success: false, message: "La tarea no existe"});
    }

    const [existe] = await db.execute("SELECT id FROM tareas WHERE nombre =? AND id <> ?", [nombre, id]);
    if (existe.length > 0){
        return res 
        .status(400)
        .json({success: false, message: "Ya hay otra tarea con este mismo nombre"});
    }

    await db.execute("UPDATE tareas SET nombre =?, completada =? WHERE id=?", [nombre, completada ? 1:0, id]);
    res.json({success: true, data: {id, nombre, completada: !!completada}});
});

router.get("/:id", validarId, validacionTareas, async (req,res) =>{
    const id = req.params.id;
    const [rows] = await db.execute("SELECT * FROM tareas WHERE id = ?", [id]);

    if (rows.length === 0) {
        return res.status(404).json({success: false, message: "La tarea no existe"});
    }

    res.json({success: true, data: rows[0]});
});

router.post("/", validarTarea, validacionTareas, async (req, res)=>{
    const { nombre, completada } = req.body;

  const [existe] = await db.execute("SELECT id FROM tareas WHERE nombre = ?", [nombre]);
  if (existe.length > 0) {
    return res.status(400).json({ success: false, message: "La tarea ya existe" });
  }

  const [result] = await db.execute(
    "INSERT INTO tareas (nombre, completada) VALUES (?, ?)",
    [nombre, completada ? 1 : 0]
  );

  res.status(201).json({success: true, data: {id: result.insertId, nombre, completada: !!completada}})
});

router.delete("/:id", validarId, validacionTareas, async (req, res) => {
  const id = req.params.id;

  const [rows] = await db.execute("SELECT id FROM tareas WHERE id = ?", [id]);
  if (rows.length === 0) {
    return res
      .status(404)
      .json({ success: false, message: "La tarea no existe" });
  }

  const [result] = await db.execute("DELETE FROM tareas WHERE id = ?", [id]);

  if (result.affectedRows === 0) {
    return res
      .status(500)
      .json({ success: false, message: "No se pudo eliminar la tarea" });
  }

  res.json({success: true, data: { id }});
});

export default router;