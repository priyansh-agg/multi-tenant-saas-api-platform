import User from "../../../models/User.js";
import jwt from "jsonwebtoken"
import { comparePassword, generateAccessToken, generateRefreshToken, hashPassword } from "./authService.js";


export const register = async(req,res)=>{
    const {name,email,password} = req.body;

    const exisiting = await User.findOne({email});
    if(exisiting){
        res.status(409).json({message:"User already exists"})
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({
        name,
        email,
        password:passwordHash
    })
    res.status(201).json({
        message:"User successfully created",
        userId:user._id
    });
}

export const login = async(req,res)=>{
    const {email,password} = req.body;

    const user = await User.findOne({email});
    if(!user){
        return res.status(401).json({
            message:"Invalid Credentials"
        })
    }

    const isMatch = comparePassword(password,user.password);
    if(!isMatch){
        return res.status(401).json({
            message:"Invalid Credentials"
        })
    }

    const payload = {
        userId: user._id,
        role: user.role
    }

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.json({
        accessToken,
        refreshToken
    })
}

export const refreshToken = async(req,res)=>{
    const token = req.body.refreshToken;

    if(!token){
        return res.status(401).json({message:"Missing refresh Token"})
    }

    try{
        const payload = jwt.verify(token,process.env.JWT_REFRESH_SECRET)
        const newAccessToken = generateAccessToken({
            userId:payload.userId,
            role:payload.role
        })
        res.json({accessToken:newAccessToken});
    }catch(err){
        res.status(403).json({message:"Invalid refresh Token"})
    }
}

// LOGOUT (stateless for now)
export const logout = async (req, res) => {
    res.json({ message: "Logged out successfully" });
};