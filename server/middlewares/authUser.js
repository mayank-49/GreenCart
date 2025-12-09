import jwt from "jsonwebtoken";

const authUser = async (req, res, next) => {
  const { token } = req.cookies;
  if (!token) {
    return res.json({
      success: false,
      message: "Unauthorized! No token provided",
    });
  }

  try {
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

    const userId = tokenDecode.id || tokenDecode._id; 
    
    if (!userId) {
      return res.json({
        success: false,
        message: "Unauthorized! Invalid token payload",
      });
    }

    req.userId = userId;
    next();
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};

export default authUser;
