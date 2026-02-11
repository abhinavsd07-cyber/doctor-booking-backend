import jwt from 'jsonwebtoken'

const authDoctor = async (req, res, next) => {
    try {
        const { dtoken } = req.headers
        if (!dtoken) {
            return res.json({ success: false, message: 'Not Authorized. Login Again' })
        }
        
        // Verify token
        const token_decode = jwt.verify(dtoken, process.env.JWT_SECRET)
        
        // Ensure you are attaching the ID so the controller can use it
        req.docId = token_decode.id 
        
        next()
    } catch (error) {
        console.log(error)
        // If token is invalid (e.g., an admin token sent to a doctor route), this will catch it
        res.json({ success: false, message: "Invalid Session. Please Login Again." })
    }
}

export default authDoctor