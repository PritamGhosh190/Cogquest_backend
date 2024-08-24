const jwt = require("jsonwebtoken");
const constant = require("./constant");
const mongodb = require("mongodb");
const MongoClient = require("mongodb").MongoClient;
const { ObjectId } = require("mongodb");
// const verifyAsync = util.promisify(jwt.verify);

module.exports = async (req, res, next) => {
  // console.log("hiiii===}}}");
  try {
    const host = req.headers.host;
    const domainname = req.hostname;
    const token = req.headers.authorization.split(" ")[1];
    // console.log("bhxbhb",token,"gcgfcc",req.headers.authorization,host ,domainname);

    
    if (token == null) return res.sendStatus(401);
    if (
      domainname != "localhost" &&
      domainname != "192.168.12.152" &&
      host != "localhost:3005" &&
      host != "192.168.12.152:3005" &&
      domainname != "192.168.31.7" &&
      host != "192.168.31.7:3005" &&
      domainname !="10.0.2.134" &&
      host !="10.0.2.134:3005"&&
      domainname != "10.0.2.126" &&
      host != "10.0.2.126:3005" &&
      domainname!="192.168.28.152"&&
      host!="192.168.28.152:3005" &&
      domainname!="192.168.0.152"&&
      host!="192.168.0.152:3005"  
    


    ) {
      return res.sendStatus(401);
    } else {
      const decoded = await jwt.verify(token, constant.secretKey);
      req.userId = decoded.userId;
      const convertedId = new ObjectId(decoded.userId);
      const client = await MongoClient.connect(constant.url);
      const mongo = client.db(constant.dbName);

      const user = await mongo
        .collection(constant.usersCollection)
        .findOne({ _id: convertedId });
      // console.log("vvhv",user);
      if (user.status === true) {
        res.set("Connection", "close");
        next();
      } else {
        return res
          .status(403)
          .json({ code: 1, result: [], message: "User blocked" });
      }
    }
  } catch (error) {
    console.log(error, "hbhbchdbhx");
    res
      .status(401)
      .json({ code: 1, result: error, message: "Authentication failed" });
  }
};
