import express from 'express'
import { UserController } from '../controllers/user.controller'

const userRouter = express.Router()

userRouter.route("/login").post(
    (req, res)=> new UserController().login(req, res)
)

userRouter.route("/register").post(
    (req, res)=> new UserController().register(req, res)
)

userRouter.route("/delete").post(
    (req, res)=> {
        console.log("route delete");
        new UserController().deleteAccount(req, res)
    }
)
userRouter.route("/admin-login").post(
    (req, res)=> new UserController().adminLogin(req, res)
)
userRouter.route("/forgot-password").post(
    (req, res)=> new UserController().forgotPassword(req, res)
)
userRouter.route("/reset-password").post(
    (req, res)=> new UserController().resetPassword(req, res)
)

export default userRouter;