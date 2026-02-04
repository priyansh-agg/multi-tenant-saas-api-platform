const windowsMs = 60 * 1000; //1min
const requests = new Map();

export const rateLimit = (req,res,next)=>{
    const key = req.apiKey._id.toString();
    const now = Date.now();

    const record = requests.get(key) || {
        count:0,
        startTime:now
    };
    if(now-record.startTime>windowsMs){
        record.count = 0;
        record.startTime = now;
    }
    record.count += 1;
    requests.set(key,record);

    if(record.count>req.apiKey.rateLimit){
        return res.status(429).json({
            message:"Rate limit exceeded"
        })
    }
    next();
}