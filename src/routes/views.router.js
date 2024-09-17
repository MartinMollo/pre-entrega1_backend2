import { Router } from "express";
import passport from "passport";

const router = Router();

router.get('/', (req, res) => {
    res.render('home');
});

router.get('/realtimeproducts', (req, res) => {
    res.render('realTimeProducts');
});

router.get("/auth/login", (req, res) => {
    res.render("login");
});

router.get("/auth/register", (req, res) => {
    res.render("register");
});

router.get(
    "/auth/profile",
    passport.authenticate("jwt", { session: false }),
    (req, res) => {
        res.render("profile", { user: req.user });
    }
);

export default router;