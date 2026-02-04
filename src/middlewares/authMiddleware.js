import jwt from 'jsonwebtoken'

export const requireAuth = (req,res,next) => {
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(401).json({messgae:"Unauthorized"})
    }

    const token = authHeader.split(" ")[1]

    try{
        const payload = jwt.verify(token,process.env.JWT_SECRET);
        req.user = payload;
        next();
    }catch(err){
        console.error(err);
        res.status(401).json({message:"Invalid or expired token"})
    }
}