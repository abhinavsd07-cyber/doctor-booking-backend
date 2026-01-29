import jwt from "jsonwebtoken";

export const authAdmin = async (req, res, next) => {
  try {
    // Even if you send 'aToken' from React, 
        // Express sees it as 'atoken' (all lowercase)
        const { atoken } = req.headers 

        if (!atoken) {
            return res.json({ success: false, message: 'Not Authorized' })
        }
        // ... rest of your code

    // Verify token
    const token_decode = jwt.verify(atoken, process.env.JWT_SECRET);

    // Check the payload object (email and role)
    if (token_decode.email !== process.env.ADMIN_EMAIL || token_decode.role !== "admin") {
      return res.status(401).json({ success: false, message: "Not Authorized. Login Again" });
    }

    next();
  } catch (error) {
    console.log("Auth Error:", error.message);
    return res.status(401).json({ success: false, message: "Token Invalid or Expired" });
  }
};