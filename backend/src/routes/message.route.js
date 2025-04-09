import express from 'express'
import multer from 'multer'
import { protectRoute } from '../middleware/auth.middleware.js'
import { getMessages, getUserForSidebar, sendMessage } from '../controllers/message.controller.js'

const router = express.Router()
const upload = multer()

router.get("/users", protectRoute, getUserForSidebar)
router.get("/:id", protectRoute, getMessages)

router.post("/send/:id", protectRoute, upload.single('file'), sendMessage);

export default router