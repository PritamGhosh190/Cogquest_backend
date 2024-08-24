const express = require("express");
const constant = require("./helper/constant");
const bodyParser = require("body-parser");
const path = require('path');
const cors = require("cors")
const mobileRouter = require('./routes/mobile');
// const webRouterVendor = require('./routes/webvendor');
var app = express();
app.use(bodyParser.json({ limit: '20mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '20mb', extended: true }));
app.use('/Uploads', express.static(path.join(__dirname, '/Uploads')));
app.use(express.static("Uploads"));


// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
// });
const corsOptions = {
    origin: 'http://example.com', // Replace with your frontend's URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Enable credentials (cookies, authorization headers, etc.)
  };
  app.use(cors());

console.log("the port ",constant.port);
app.use((req, res, next) => {
    
    var allowedDomains = ['https://cogniquest.arodek.com/','*','http://localhost'];
    var origin = req.headers.origin;

    if(allowedDomains.indexOf(origin) > -1){
    res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PATCH, PUT, DELETE, OPTIONS"
    );
    next();
});

// app.use('/api/app', appRouter);
app.use('/api/mobile/', mobileRouter);
// app.use('/api/admin/',webRouterVendor);

 


const normalizePort = val => {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
};
const onError = error => {
    if (error.syscall !== "listen") {
        throw error;
    }
    const bind = typeof addr === "string" ? "pipe " + addr : "port " + port;
    switch (error.code) {
        case "EACCES":
            console.error(bind + " requires elevated privileges");
            process.exit(1);
            break;
        case "EADDRINUSE":
            console.error(bind + " is already in use");
            process.exit(1);
            break;
        default:
            throw error;
    }
};

const nDate = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata'
  });
    

const onListening = () => {
    const addr = server.address();
    const bind = typeof addr === "string" ? "pipe " + addr : "port " + port;
    debug("Listening on " + bind);
};

const port = normalizePort(process.env.PORT || constant.port);
// const port = normalizePort(process.env.PORT || "85");
app.set("port", port);
app.on("error", onError);
app.on("listening", onListening);
var server = app.listen(port, function() {
    console.log(`Alzimers App is listening on Port : ${constant.port} ` );
    // console.log('Rashmi App is listening on Port : 85');
});

server.timeout = 300000;
