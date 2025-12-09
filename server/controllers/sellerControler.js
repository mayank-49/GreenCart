import jwt from "jsonwebtoken";

//Login Seller : /api/seller/login
export const sellerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.json({
        success: false,
        message: "Email and password are required",
      });
    }
    if (
      email === process.env.SELLER_EMAIL &&
      password === process.env.SELLER_PASSWORD
    ) {
      const token = jwt.sign({ email }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      res.cookie("sellerToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        success: true,
        message: "Seller logged in successfully",
      });
    } else {
      return res.json({
        success: false,
        message: "Invalid seller credentials",
      });
    }
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};

//Seller isAuth : /api/seller/is-auth
export const isSellerAuth = async(req,res) =>{
  try {
    return res.json({success:true, message:"Seller is authenticated"});

  } catch (error) {
    console.log(error.message);
    return({success:false, message:error.message});
  }
}

//Seller User : /api/seller/logout
export const sellerLogout = async(req,res) =>{
  try {
    res.clearCookie('sellerToken',{
      httpOnly: true,  
      secure: process.env.NODE_ENV === "production", 
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    });

    return res.json({success:true, message:"Seller logged out successfully"});

  } catch (error) {
    console.log(error.message);
    return({success:false, message:error.message});
  }
}