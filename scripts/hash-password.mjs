#!/usr/bin/env bun
/**
 * Genera un hash bcrypt para guardar en usuarios.Clave.
 * Uso: bun run hash-password -- <contraseña>
 */
import bcrypt from "bcryptjs";

const pwd = process.argv[2];
if (!pwd) {
  console.error("Uso: bun run hash-password -- <contraseña>");
  process.exit(1);
}

const saltRounds = 10;
const hash = bcrypt.hashSync(pwd, saltRounds);
console.log(hash);
