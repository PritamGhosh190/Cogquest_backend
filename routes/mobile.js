const checkAuth = require("../helper/check-auth");
const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const Router = express.Router();
const fs = require("fs");
const jwt = require("jsonwebtoken");
const constant = require("../helper/constant");
const mongodb = require("mongodb");
const MongoClient = require("mongodb").MongoClient;
var multer = require("multer");
const { ObjectId } = require("mongodb");
const path = require("path");
const bcrypt = require("bcrypt");
const { log } = require("console");

function calculateAge(dob) {
  const dobDate = new Date(dob);
  const now = new Date();

  // Get the difference in years
  let age = now.getFullYear() - dobDate.getFullYear();

  // Check if the birthday hasn't occurred yet this year
  const hasBirthdayPassed =
    now.getMonth() > dobDate.getMonth() ||
    (now.getMonth() === dobDate.getMonth() &&
      now.getDate() >= dobDate.getDate());

  // If birthday hasn't passed, subtract a year
  if (!hasBirthdayPassed) {
    age--;
  }

  return age;
}
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Adding 1 because January is 0-indexed
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function verifyPassword(password, hashedPassword) {
  try {
    const match = bcrypt.compare(password, hashedPassword);
    return match;
  } catch (error) {
    throw new Error("Verification failed");
  }
}

function hashPassword(password) {
  try {
    const hashedPassword = bcrypt.hash(password, 10); // 10 is the salt rounds
    return hashedPassword;
  } catch (error) {
    throw new Error("Hashing failed");
  }
}
function dateArr() {
  var currentDate = new Date();
  var daysUntilMonday = (currentDate.getDay() + 6) % 7;
  var startDate = new Date(currentDate);
  startDate.setDate(currentDate.getDate() - daysUntilMonday);

  var abc = [];
  for (let i = 0; i <= 6; i++) {
    var sDate = `${startDate.getFullYear()}-${String(
      startDate.getMonth() + 1
    ).padStart(2, "0")}-${String(startDate.getDate() + i).padStart(2, "0")}`;
    abc.push(sDate);
  }
  return abc;
}

Router.post("/signUp", async (req, res) => {
  console.log("hiii=======>>>signUP");
  var { firstName, lastname, dob, contact, email, address, gender, password } =
    req.body;
  res.set("Connection", "close");
  try {
    var client = await MongoClient.connect(constant.url);
    var mongo = await client.db(constant.dbName);
    if (
      firstName !== "" &&
      firstName !== undefined &&
      firstName !== null &&
      lastname !== "" &&
      lastname !== undefined &&
      lastname !== null &&
      email !== "" &&
      email !== undefined &&
      email !== null &&
      contact !== "" &&
      contact !== undefined &&
      contact !== null &&
      dob !== "" &&
      dob !== undefined &&
      dob !== null &&
      address !== "" &&
      address !== undefined &&
      address !== null &&
      gender !== "" &&
      gender !== undefined &&
      gender !== null &&
      password !== "" &&
      password !== undefined &&
      password !== null
    ) {
      const filter = {
        $or: [{ email: email }, { contact: contact }],
      };
      var respp = await mongo
        .collection(constant.usersCollection)
        .findOne(filter);
      if (respp !== null) {
        client.close();
        return res
          .status(201)
          .json({ status: 201, code: 1, message: "user exist" });
      } else {
        var abc = new Date(dob);
        var Dob = formatDate(abc);
        var age1 = calculateAge(Dob);
        req.body.dob = Dob;
        req.body.age = age1;
        req.body.status = true;
        dPass = await hashPassword(req.body.password);
        req.body.password = dPass;

        const resp = await mongo
          .collection(constant.usersCollection)
          .insertOne(req.body);
        console.log("the object to be saved");
        client.close();
        return res.status(200).json({
          code: 0,
          status: true,
          message: "user created !!",
        });
      }
    } else {
      client.close();
      return res.status(201).json({
        code: 1,
        status: false,
        message: "please fill the required  data properly  !!",
      });
    }
  } catch (error) {
    console.log(error);
    client.close();
    return res.status(401).json({
      code: 1,
      result: error,
      message: "Error !!",
    });
  }
});

Router.post("/login", async (req, res) => {
  console.log("login");
  const { email, password } = req.body;
  res.set("Connection", "close");
  try {
    var client = await MongoClient.connect(constant.url);
    var mongo = await client.db(constant.dbName);
    const user = await mongo
      .collection(constant.usersCollection)
      .findOne({ email });
    if (!user) {
      client.close();
      return res.status(202).json({ message: "User not found" });
    } else {
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        client.close();
        return res.status(201).json({ message: "Invalid credentials" });
      } else {
        if (user.status == true) {
          const token = jwt.sign({ userId: user._id }, constant.secretKey, {
            expiresIn: "3000000s",
          });
          client.close();
          return res.status(200).json({ token: token, status: true, code: 0,mess:"hiii" });
        } else {
          client.close();
          return res
            .status(203)
            .json({ message: "You have blocked", status: false, code: 1 });
        }
      }
    }
  } catch (err) {
    client.close();
    res.status(401).json({ message: "Internal server error" });
  }
});
Router.post("/userDetails", checkAuth, async (req, res) => {
  console.log("userDetails");
  res.set("Connection", "close");
  try {
    const convertedIdNew = new ObjectId(req.userId);

    var client = await MongoClient.connect(constant.url);
    var mongo = await client.db(constant.dbName);
    const user = await mongo
      .collection(constant.usersCollection)
      .findOne({ _id: convertedIdNew }, { projection: { password: 0 } });
console.log("jhvfcfc",user)

    if (!user) {
      client.close();
      return res.status(202).json({ message: "User not found" });
    } else {
      const cursor = await mongo
        .collection(constant.result)
        .find({ user_id: convertedIdNew })
        .sort({ timestamp: 1 })
        .toArray();
        
      var testRes = cursor[cursor.length-1];
      // var testRes = cursor[0];

      var ica_cursor = await mongo
        .collection(constant.ica_Result)
        .find({ user_id: convertedIdNew })
        .sort({ timestamp: -1 })
        .toArray();
      var ica_Res = ica_cursor[0];
      if (!cursor) {
        if (!ica_cursor) {
          client.close();
          return res.status(202).json({
            result: user,
            testResult2: ica_Res,
            status: true,
            code: 0,
          });
        } else {
          console.log("bhcbxbzbbs", user)
          
          client.close();
          return res.status(201).json({ result: user, status: true, code: 0 });
        }
      } else {
        console.log(  "result:", user,
          "testResult:" ,testRes,
          "testResult2:" ,ica_Res);
        client.close();
        return res.status(200).json({
          result: user,
          testResult: testRes,
          testResult2: ica_Res,
          status: true,
          code: 0,
        });
      }
    }
  } catch (err) {
    // client.close();

    console.error("Login error:", err);
    res.status(401).json({ message: "Internal server error" });
  }
});

var res1_files = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "Uploads/Files/Resp1/");
  },
  filename: function (req, file, cb) {
    // console.log("Filess==>", file);
    cb(null, Date.now() + "_" + file.originalname);
  },
});

var img_upload1 = multer({ storage: res1_files }).single("res1_files");

Router.post("/createTestId", checkAuth, async (req, res) => {
  console.log("createTestId");
  const convertedIdNew = new ObjectId(req.userId);
  res.set("Connection", "close");
  try {
    var toInsert = {
      _id: new ObjectId(),
      userId: convertedIdNew,
      entryTime: new Date(),
    };
    var client = await MongoClient.connect(constant.url);
    var mongo = await client.db(constant.dbName);
    const user = await mongo.collection(constant.testId).insertOne(toInsert);
    client.close();
    return res
      .status(200)
      .json({ testId: toInsert._id, status: true, code: 0 });
  } catch (err) {
    client.close();
    // console.error("Login error:", err);
    res.status(401).json({ message: "Internal server error" });
  }
});
Router.post("/checkUser", checkAuth, async (req, res) => {
  console.log("checkUser");
  const convertedIdNew = new ObjectId(req.userId);
  var testId1 = req.body.testId;
  var testData = req.body.testData;
  var testTime = req.body.testTime;
  res.set("Connection", "close");
  try {
    if (
      testTime != undefined &&
      testTime != null &&
      testTime != "" &&
      testData != undefined &&
      Array.isArray(testData) &&
      testId1 != undefined &&
      testId1 != null &&
      testId1 != ""
    ) {
      var toInsert = {
        _id: new ObjectId(),
        userId: convertedIdNew,
        testId: new ObjectId(testId1),
        testData: testData,
        testTime: testTime,
        entryTime: new Date(),
      };
      console.log("lkgfcggyfgvh",toInsert);
      
      var client = await MongoClient.connect(constant.url);
      var mongo = await client.db(constant.dbName);
      const user = await mongo.collection(constant.check).insertOne(toInsert);
      var testId2 = toInsert.testId.valueOf();

      console.log("hiii==>>>", testId2, req.userId);

      var url = `https://cogquest-model.arodek.com/${req.userId}/${testId2}`;
      // var url = `http://10.0.2.128:5000/${req.userId}/${testId2}`;

      // var url ="https://cogquest-model.arodek.com/result/659e6c7cc161a68e755c8f74/65a50af82336e1d542c163d1";

      console.log("hello", url);
      await axios
        .get(url)
        .then((response) => {
          console.log("Response:", response.data);
        })
        .catch((error) => {
          console.error("Error:", error);
        });
      console.log("hiii1111==>>>");
      var queryCode = {
        $and: [
          {
            user_id: convertedIdNew,
          },
          {
            test_id: toInsert.testId,
          },
        ],
      };
      const ica_cursor = await mongo
        .collection(constant.result)
        .findOne(queryCode)
        // .toArray();

        console.log("ica_index",ica_cursor);
      // var ica_Res = ica_cursor[0];
      // client.close();
      return res.status(200).json({
        result: "Test Submitted",
        result: ica_cursor,
        status: true,
        code: 0,
      });
    } 
    else {
      // client.close();
      return res.status(201).json({
        result: "required data missing or unmatched format",
        status: false,
        code: 1,
      });
    }
  } catch (err) {
    // client.close();
    console.error("Login error:", err);
    res.status(401).json({ message: "Internal server error" });
  }
});
Router.post("/getResponse1", checkAuth, async (req, res) => {
  console.log("getResponse1");
  var testId = req.body.testId;
  const convertedIdNew = new ObjectId(req.userId);
  res.set("Connection", "close");
  try {
    var client = await MongoClient.connect(constant.url);
    var mongo = client.db(constant.dbName);
    img_upload1(req, res, async (err) => {
      if (err) {
        console.error("Error in uploading:", err);
        return res.status(500).json(err);
      }
      if (req.file && req.file.filename !== undefined && req.file !== null) {
        // filesfullPath =
        //   constant.appBaseURL + "Uploads/Files/Resp1/" + req.file.filename;
        var filesDet = {
          name: req.file.filename,
          size: req.file.size,
          // fullPath: filesfullPath,
          filesPath: "Uploads/Files/Resp1/" + req.file.filename,
          userId: convertedIdNew,
          entryTime: new Date(),
          testId: new ObjectId(testId),
        };
        const resp = await mongo.collection(constant.qcol1).insertOne(filesDet);

        client.close();
        return res.status(200).json({
          code: 0,
          status: true,
          result: "File uploaded",
        });
      } else {
        client.close();
        return res.status(201).json({
          code: 1,
          result: "Please fill the mandatory fields !!",
          message: "Mandatory Field Missing !!",
        });
      }
    });
  } catch (err) {
    // console.error("Error:", err);
    return res.status(500).json(err);
  }
});

Router.post("/getResponse2", checkAuth, async (req, res) => {
  console.log("getResponse2");
  var testData = req.body.data;
  var testId = req.body.testId;
  const convertedIdNew = new ObjectId(req.userId);
  res.set("Connection", "close");
  try {
    if (
      testId != undefined &&
      testId != null &&
      testId != "" &&
      testData != undefined &&
      testData.length != 0
    ) {
      var toInsert = {
        userId: convertedIdNew,
        entryTime: new Date(),
        testData,
        testId: new ObjectId(testId),
      };
      var client = await MongoClient.connect(constant.url);
      var mongo = await client.db(constant.dbName);
      const user = await mongo.collection(constant.qcol2).insertOne(toInsert);
      client.close();
      return res
        .status(200)
        .json({ result: "Data posted", status: true, code: 0 });
    } else {
      client.close();
      return res
        .status(201)
        .json({ result: "required data Missing", status: false, code: 1 });
    }
  } catch (err) {
    // console.error("Login error:", err);
    client.close();
    res.status(401).json({ message: "Internal server error" });
  }
});
Router.post("/getResponse3", checkAuth, async (req, res) => {
  console.log("getResponse3");
  var testId = req.body.testId;
  var testData = req.body.data;
  const convertedIdNew = new ObjectId(req.userId);
  res.set("Connection", "close");
  try {
    if (
      testId != undefined &&
      testId != null &&
      testId != "" &&
      testData != undefined &&
      testData.length != 0
    ) {
      var toInsert = {
        userId: convertedIdNew,
        entryTime: new Date(),
        testData,
        testId: new ObjectId(testId),
      };
      var client = await MongoClient.connect(constant.url);
      var mongo = await client.db(constant.dbName);
      const user = await mongo.collection(constant.qcol3).insertOne(toInsert);
      client.close();
      return res
        .status(200)
        .json({ result: "Data posted", status: true, code: 0 });
    } else {
      client.close();
      return res
        .status(201)
        .json({ result: "required data Missing", status: false, code: 1 });
    }
  } catch (err) {
    client.close();
    // console.error("Login error:", err);
    res.status(401).json({ message: "Internal server error" });
  }
});

// Router.post("/getResponse4", checkAuth, async (req, res) => {
//   console.log("getResponse4");
//   var testId = req.body.testId;
//   var testData = req.body.data;
//   const convertedIdNew = new ObjectId(req.userId);
//   res.set("Connection", "close");
//   try {
//     if (
//       testId != undefined &&
//       testId != null &&
//       testId != "" &&
//       testData != undefined &&
//       testData != null &&
//       testData != "" &&
//       testData != {}
//     ) {
//       var toInsert = {
//         userId: convertedIdNew,
//         entryTime: new Date(),
//         testData,
//         testId: new ObjectId(testId),
//       };
//       var client = await MongoClient.connect(constant.url);
//       var mongo = await client.db(constant.dbName);
//       const user = await mongo.collection(constant.qcol4).insertOne(toInsert);
//       client.close();
//       return res
//         .status(200)
//         .json({ result: "Data posted", status: true, code: 0 });
//     } else {
//       client.close();
//       return res
//         .status(201)
//         .json({ result: "required data Missing", status: false, code: 1 });
//     }
//   } catch (err) {
//     client.close();
//     // console.error("Login error:", err);
//     res.status(401).json({ message: "Internal server error" });
//   }
// });

Router.post("/getResponse4", checkAuth, async (req, res) => {
  console.log("getResponse4");
  var testId = req.body.testId;
  var testData = req.body.data;
  const convertedIdNew = new ObjectId(req.userId);
  res.set("Connection", "close");
  try {
    if (
      testId != undefined &&
      testId != null &&
      testId != "" &&
      testData != undefined &&
      testData != null &&
      testData != "" &&
      testData != {}
    ) {
      var toInsert = {
        userId: convertedIdNew,
        entryTime: new Date(),
        testData,
        testId: new ObjectId(testId),
      };
      var client = await MongoClient.connect(constant.url);
      var mongo = await client.db(constant.dbName);
      const user = await mongo.collection(constant.qcol4).insertOne(toInsert);
      client.close();
      return res
        .status(200)
        .json({ result: "Data posted", status: true, code: 0 });
    } else {
      client.close();
      return res
        .status(201)
        .json({ result: "required data Missing", status: false, code: 1 });
    }
  } catch (err) {
    client.close();
    // console.error("Login error:", err);
    res.status(401).json({ message: "Internal server error" });
  }
});

Router.post("/getResponse7", checkAuth, async (req, res) => {
  console.log("getResponse7");
  var testId = req.body.testId;
  var testData = req.body.data;
  // var testTime = req.body.time;
  const convertedIdNew = new ObjectId(req.userId);
  res.set("Connection", "close");
  try {
    if (
      testId != undefined &&
      testId != null &&
      testId != "" &&
      testData != undefined &&
      testData.length !== 0
    ) {
      var toInsert = {
        userId: convertedIdNew,
        entryTime: new Date(),
        testData,
        testId: new ObjectId(testId),
        testTime,
      };
      var client = await MongoClient.connect(constant.url);
      var mongo = await client.db(constant.dbName);
      const user = await mongo.collection(constant.qcol7).insertOne(toInsert);
      console.log("hiii==>>>", req.body.testId);

      // client.close();
      var url = `https://cogquest-model.arodek.com/${req.userId}/${req.body.testId}`;
      // var url ="https://cogquest-model.arodek.com/result/659e6c7cc161a68e755c8f74/65a50af82336e1d542c163d1";

      console.log("hello", url);
      await axios
        .get(url)
        .then((response) => {
          console.log("Response:", response.data);
        })
        .catch((error) => {
          console.error("Error:", error);
        });

      return res
        .status(200)
        .json({ result: "Data posted", status: true, code: 0 });
    } else {
      client.close();
      return res
        .status(201)
        .json({ result: "required data Missing", status: false, code: 1 });
    }
  } catch (err) {
    // client.close();
    // console.error("Login error:", err);
    res.status(401).json({ message: "Internal server error" });
  }
});
Router.post("/getResponse5", checkAuth, async (req, res) => {
  console.log("getResponse5");
  var testId = req.body.testId;
  var testData = req.body.data;
  const convertedIdNew = new ObjectId(req.userId);
  res.set("Connection", "close");
  try {
    if (
      testId != undefined &&
      testId != null &&
      testId != "" &&
      testData != undefined
    ) {
      console.log("hiiii from 51");
      var toInsert = {
        userId: convertedIdNew,
        entryTime: new Date(),
        testData,
        testId: new ObjectId(testId),
      };
      var client = await MongoClient.connect(constant.url);
      var mongo = await client.db(constant.dbName);
      const user = await mongo.collection(constant.qcol5).insertOne(toInsert);
      client.close();
      return res
        .status(200)
        .json({ result: "Data posted", status: true, code: 0 });
    } else {
      client.close();
      return res
        .status(201)
        .json({ result: "required data Missing", status: false, code: 1 });
    }
  } catch (err) {
    // console.error("Login error:", err);
    client.close();
    res.status(401).json({ message: "Internal server error" });
  }
});

Router.post("/getResponse8", checkAuth, async (req, res) => {
  console.log("getResponse8");
  const convertedIdNew = new ObjectId(req.userId);
  var testId1 = req.body.testId;
  var testData = req.body.data;
  // var testTime = req.body.time;
  res.set("Connection", "close");
  console.log("getResponse81111",testId1,testData);

  try {
    if (
      // testTime != undefined &&
      // testTime != null &&
      // testTime != "" &&
      testData != undefined &&
      Array.isArray(testData) &&
      testId1 != undefined &&
      testId1 != null &&
      testId1 != ""
    ) {
      var toInsert = {
        _id: new ObjectId(),
        userId: convertedIdNew,
        testId: new ObjectId(testId1),
        testData: testData,
        entryTime: new Date(),
      };
      console.log("lkgfcggyfgvh",toInsert);
      
      var client = await MongoClient.connect(constant.url);
      var mongo = await client.db(constant.dbName);
      const user = await mongo.collection(constant.qcol8).insertOne(toInsert);
    
      return res.status(200).json({
        result: "Test Submitted",
        status: true,
        code: 0,
      });
    } 
    else {
      // client.close();
      return res.status(201).json({
        result: "required data missing or unmatched format",
        status: false,
        code: 1,
      });
    }
  } catch (err) {
    // client.close();
    console.error("Login error:", err);
    res.status(401).json({ message: "Internal server error" });
  }
});
Router.post("/dailyGraph", checkAuth, async (req, res) => {
  console.log("dalyGraph");
  res.set("Connection", "close");
  const convertedIdNew = new ObjectId(req.userId);
  try {
    const client = await MongoClient.connect(constant.url);
    var mongo = client.db(constant.dbName);
    const collection = mongo.collection(constant.result);
    var datArr = dateArr();
    const newDate= new Date();
    var sDate = `${newDate.getFullYear()}-${String(
      newDate.getMonth() + 1
    ).padStart(2, "0")}-${String(newDate.getDate()).padStart(2, "0")}`;
    console.log("datee", sDate);
    var queryCode = {
      $and: [
        {
          user_id: convertedIdNew,
        },
        {
          date: { $eq: sDate },
        },
      ],
    };
    const data = await collection.find(queryCode).toArray();
    console.log("datsa",data);
    var ica_ScoreArr=[];
    var testTimeArr=[];
     data.map((e)=>{
      if(e.ICA_Score>=0)
      {
      ica_ScoreArr.push(Math.round(100 -e.ICA_Score));
      }
      else{
        ica_ScoreArr.push(e.ICA_Score);
      }
      // console.log(e,e.timestamp);
      split_part = e.timestamp.slice(11, 16);
      testTimeArr.push(split_part);
      

     })

     var rtnObj=
     {
      "scoreArr":ica_ScoreArr,
      "timeArr":testTimeArr
     }
     console.log("BVFFCF",rtnObj);
    // const weeklyAverages = Array(7).fill(0);
    // const groupedData = data.reduce((acc, entry) => {
    //   const date = entry.date;
    //   acc[date] = acc[date] || [];
    //   acc[date].push(entry.ICA_Score);
    //   return acc;
    // }, {});

    // for (let i = 0; i < 7; i++) {
    //  let objval=datArr[i]
    //   if (groupedData[objval]) {
    //     const dailyAverage = groupedData[objval].reduce((sum, score) => sum + score, 0) / groupedData[objval].length;
    //     const roundedNumber = Number(dailyAverage.toFixed(2));
    //     weeklyAverages[i] = roundedNumber;
    //   } else {
    //     weeklyAverages[i] = 0;
    //   }
    // }

    // {
    //   1
    // }

    // console.log("hiiii", data);
  
    client.close();
    return res
      .status(200)
      .json({ result: rtnObj, status: true, code: 0 });
   
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

Router.post("/Reports", checkAuth, async (req, res) => {
  console.log("Reports");
  const convertedIdNew = new ObjectId(req.userId);
  res.set("Connection", "close");
  try {
    var client = await MongoClient.connect(constant.url);
    var mongo = await client.db(constant.dbName);
    const ica_cursor = await mongo
      .collection(constant.result)
      .find({ user_id: convertedIdNew })
      .sort({ timestamp: -1 })
      .toArray();
      console.log("hey==>",ica_cursor);
    // var ica_Res = ica_cursor[0];
    // client.close();
    const newArray = ica_cursor.map((object, index) => ({
      ...object,
      testNumber: index + 1, // Adding 1 to make position start from 1 instead of 0
    }));
    return res.status(200).json({
      result: "Test Submitted",
      result: newArray,
      status: true,
      code: 0,
    });
  } catch (err) {
    client.close();
    console.error("Login error:", err);
    res.status(401).json({ message: "Internal server error" });
  }
});

module.exports = Router;
