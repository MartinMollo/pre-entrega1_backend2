import { Router } from "express";
import userModel from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

const router = Router();

router.post("/register", async (req, res) => {
  const { first_name, last_name, email, age, password, } = req.body;

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = new userModel({
      first_name,
      last_name,
      email,
      age,
      password: hashedPassword,
      
    });
    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("jwt", token, { httpOnly: true, secure: false });

    res.redirect("/auth/profile");
  } catch (error) {
    res.status(500).send("Redirecting");
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "la contraseña o el email son invalidos" });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "la contraseña o el email son invalidos" });
    }

    // Generamos el token JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Guardamos el token en las cookies
    res.cookie("jwt", token, { httpOnly: true, secure: false });

    // Redirigir a la página de perfil
    res.redirect("/auth/profile");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/logout", (req, res) => {
  res.clearCookie("jwt");
  res.redirect("/auth/login");
});

export default router;