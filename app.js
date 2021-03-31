var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var npmjsRouter = require('./api/npmjs.js');
var pushRouter = require('./api/push.js');
const ejs = require('ejs');
const { getLocalNpmConfig } =require("./utils/utils");
const { mirrorStorage, mirrorPath } = getLocalNpmConfig();

var app = express();
process.env.NPM_DOWNLOADING = false;
process.env.NPM_UPLOAD = false;

//设置跨域访问
app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
  res.header("X-Powered-By",' 3.2.1')
  next();
});

app.use(logger('dev'));

app.engine('html', ejs.__express);
app.set('views', path.join(__dirname, './dist'));
app.set('view engine', 'html');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '/dist')));
if(mirrorPath && !/^http/.test(mirrorPath)){
  app.use(mirrorPath, express.static(mirrorStorage));
}


app.get('/', function(req, res){
  res.set('Content-Type', 'text/html');
  res.render('index',{});
})

app.use('/npmjs', npmjsRouter);
app.use('/push', pushRouter);

// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });

// error handler
// app.use(function(err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });

module.exports = app;
