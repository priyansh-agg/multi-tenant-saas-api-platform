import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export const hashPassword = async(password)=>{
    return bcrypt.hash(password,12);
}

export const comparePassword = async(password,hash)=>{
    return bcrypt.compare(password,hash);
}

export const generateAccessToken = (payload)=>{
    return jwt.sign(payload,process.env.JWT_SECRET,{
        expiresIn:"15m"
    })
}

export const generateRefreshToken = (payload)=>{
    return jwt.sign(payload,process.env.JWT_REFRESH_SECRET,{
        expiresIn:"7d"
    })
}