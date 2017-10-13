var async = require('async');
var mysql = require('mysql');
var cors = require('cors');
var path = require('path')
var multer = require('multer')
var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var moment = require('node-moment');
var ccavenue = require('ccavenue');
var nodemailer = require('nodemailer');
var ejs = require('ejs');

var app = express();

var validate = require('./modules/validation');
var projects = require('./modules/projects');
var courses = require('./modules/courses');
var admin = require('./modules/admin');
var social = require('./modules/social');
var youtube = require('./modules/youtube-upload');
var nesting = require('./modules/mysql-nesting');
var _commonFunction = require('./modules/commonFunction');

var prodEnv = false;

var dbConnection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'globalias'
});
var host = 3001;
var oAuthCredentials = {
	client_id: '47668821926-88cp2nt18qdvh525lm6gf509ug38c92d.apps.googleusercontent.com',
	client_secret: 'aEmqEAy8x4m8J3W70N0Vo1Ip',
	redirect_url: 'http://localhost:3001/auth'
};

if (prodEnv) {
	dbConnection = mysql.createConnection({
		host: 'localhost',
		user: 'root',
		password: 'Xcz?2oAffm',
		database: 'globalias',
		port: 3306,
		debug: true
	});
	host = 80;

	oAuthCredentials = {
		client_id: '1022772628270-hbpvh5ooeub8h0bdfu4nsf895vtuifp1.apps.googleusercontent.com',
		client_secret: '7KvmTlj8s-ribzsuplXbYzjH',
		redirect_url: 'http://supportmytalent.in/auth'
	};
}


/*
backme.talent@gmail.com
Support@123
Reference:
https://www.twilio.com/blog/2015/02/building-your-own-personal-assistant-with-twilio-and-google-calendar.html

*/

/*
https://accounts.google.com/o/oauth2/auth?access_type=offline&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fplus.me%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fyoutube.upload&approval_prompt=force&response_type=code&client_id=1022772628270-hbpvh5ooeub8h0bdfu4nsf895vtuifp1.apps.googleusercontent.com&redirect_uri=http%3A%2F%2Fsupportmytalent.in%2Fauth
*/

var server = app.listen(host, function (request, response) {
	var host = server.address().address,
		port = server.address().port;
	console.log("Backme Server listening at http://%s:%s", host, port);
});

/*Session validation*/
/*app.use(function(req, res, next) {
	if(req.url.indexOf('/all') == 0) {
		_commonFunction.validateUser(dbConnection, req.headers, function(){
			res.status(403).send('Invalid access');
		}, function(userId){
			next();
		})
	} else {
		next();
	} 
});*/
app.use(express.static('public'));
app.set('views', __dirname + '/modules/views');
app.set('view engine', 'ejs');
app.set('port', process.env.PORT || 8080);


app.use(cors());
app
	.use(bodyParser.urlencoded({
		extended: false
	}))
	.use(bodyParser.json());

//var upload = multer(); 
//app.use(upload.array()); // for parsing multipart/form-data

var connectDB = function () {
	dbConnection.connect(function (err) {
		if (err) {
			console.error('error connecting: ' + err.stack);
			return;
		}
	});
}
connectDB();


/* Email Settings */
// create reusable transporter object using the default SMTP transport
var transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: 'backme.talent@gmail.com',
		pass: 'Support@123'
	}
});
var emails = require('./modules/emails');

emails.testMail(app, dbConnection, validate, multer, path, nesting, async, moment, transporter, ejs);

/*emails.sendEmails(app, transporter, 'user-register.ejs', 'nvijay.blr@gmail.com', 'Test Subject', function(info) {
	console.log(info);
});*/

/*Courses related API*/
courses.coursesAPI(app, dbConnection, validate, multer, path, nesting, async, moment, transporter, emails);

/*Youtube related API*/
youtube.youtubeAPI(app, dbConnection, validate, multer, path, nesting, async, moment, request, oAuthCredentials);

/*Projects related API*/
projects.projectsAPI(app, dbConnection, validate, multer, path, nesting, async, moment, transporter, emails);

/*Social related API*/
social.socialAPI(app, dbConnection, validate, multer, path, nesting, async, moment, transporter, emails);

/*admin related API*/
admin.adminAPI(app, dbConnection, validate, multer, path, nesting, async, moment, transporter, emails);



/*Paytm Integration*/
var paytm = require('./modules/paytm');
paytm.route(app, dbConnection, validate, multer, path, nesting, async, moment, transporter, emails);


/*login user*/
app.post('/login', function (req, res) {
	var user = req.body;
	if (!user.email || !user.password) {
		res.status(400).send("Bad Request. Email/Password should not be empty.");
		return;
	};
	try {
		dbConnection.query('SELECT * FROM users WHERE email=? AND BINARY password=? AND loginType="CUSTOM" AND status="ACTIVE" limit 1', [user.email, user.password], function (error, results, fields) {
			if (error) {
				res.status(500).send("Internal Server Error.");
				return;
			}
			if (results.length == 0) {
				res.status(404).send('Invalid userId/passowrd.');
			} else {

				(function () {
					/*function to create session */
					var _ussCode = _commonFunction.generateSessonToken(),
						timeStamp = Date.now();
					results[0]._APISID = _ussCode[0];
					results[0]._BPISID = timeStamp;
					results[0]._CPISID = _ussCode[1];
					dbConnection.query('INSERT INTO user_sessions (userId, uss_code)VALUES(?,?)', [results[0].userId, (_ussCode.join('') + timeStamp)], function (error) {
						if (error) {
							res.status(500).send({
								errorCode: 500,
								errorMessage: 'Internal server error.'
							});
							throw error;
							return;
						}; /*end of the error block*/
						res.status(200).send(results);
					});
				})();
				
			}

		});
	} catch (e) {
		console.log(e);
		res.status(500).send("Internal Server Error.", e);
	}
});

/*Get All Specific users details*/
app.get('/logout', function (req, res) {
	var _headers = req.headers;
	if (!_headers._apisid || !_headers._bpisid || !_headers._cpisid) {
		res.status(400).send("Invalid Session.");
		return;
	}
	try {
		dbConnection.query('DELETE FROM user_sessions WHERE uss_code = ?', [_headers._apisid + _headers._cpisid + _headers._bpisid], function (error, result) {
			if (error) {
				res.status(400).send(error);
				return;
			} 
			res.status(200).send({errMessage: 'Logged out successfully.'});
		});
	} catch (e) {
		res.status(500).send("Internal Server Error.");
	}
});

/*singup user*/
app.post('/signup', function (req, res) {
	var user = req.body;
	var host = req.protocol + '://' + req.get('host');
	if (!user.email || !user.password) {
		res.status(400).send("Bad Request. Parameters mismatched.");
		return;
	};
	if (!validate.validateEmail(user.email)) {
		res.status(400).send("Invalid Email.");
		return;
	}
	user.status = 'ACTIVE';
	if (!user.loginType) {
		user.loginType = 'CUSTOM';
	}
	try {
		dbConnection.query('INSERT INTO users SET ?', user, function (error, results, fields) {
			if (error) {
				res.status(500).send(error.code == 'ER_DUP_ENTRY' ? 'Email already found.' : error.code);
				return;
			}
			//sendVerificationMail(user.email, host+'/verifyAccount/'+results.insertId);

			emails.sendEmails(app, transporter, 'user-register.ejs', user.email, 'Welcome to Back Me!', function (info) {
				console.log(info);
			});
			res.status(200).send(results);
		});
	} catch (e) {
		res.status(500).send("Internal Server Error.");
	}
});

app.post('/loginsocial', function (req, res) {
	var user = req.body;
	if (!user.email || !user.loginType) {
		res.status(400).send("Bad Request. Email/loginType should not be empty.");
		return;
	};
	console.log(user);
	try {
		dbConnection.query('SELECT * FROM users WHERE email=? AND loginType=? AND status="ACTIVE"', [user.email, user.loginType], function (error, results, fields) {
			if (error) {
				res.status(500).send("Internal Server Error.");
				return;
			}
			console.log(results);
			if (results.length)
				res.status(200).send(results);
			else
				res.status(404).send('Invalid userId/passowrd.');
		});
	} catch (e) {
		console.log(e);
		res.status(500).send("Internal Server Error.", e);
	}
});

/*singup user from social (google)*/
app.post('/signupsocial', function (req, res) {
	var user = req.body;
	var host = req.protocol + '://' + req.get('host');
	if (!user.email) {
		res.status(400).send("Bad Request. Email not found.");
		return;
	};
	user.status = 'ACTIVE';
	if (!user.loginType) {
		user.loginType = 'GOOGLE';
	}
	try {
		dbConnection.query('INSERT INTO users SET ?', user, function (error, results, fields) {
			if (error) {
				res.status(500).send(error.code == 'ER_DUP_ENTRY' ? 'ER_DUP_ENTRY' : error.code);
				return;
			}

			emails.sendEmails(app, transporter, 'user-register.ejs', user.email, 'Welcome to Back Me!', function (info) {
				console.log(info);
			});
			res.status(200).send(results);
		});
	} catch (e) {
		res.status(500).send("Internal Server Error.");
	}
});

/*verify email user*/
app.get('/verifyAccount/:userId', function (req, res) {
	var userId = req.params.userId;
	var host = req.protocol + '://' + req.get('host');
	if (!userId) {
		res.status(500).send('Internal Server Error. Try again.');
		return;
	};
	try {
		dbConnection.query('UPDATE users SET status="ACTIVE", loginType="CUSTOM" WHERE userId=?', userId, function (error, results, fields) {
			if (error) {
				res.status(500).send('Internal Server Error. Try again.');
				return;
			}
			res.status(200).send('Your account verified successfully. <a href="' + host + '">Click here</a> to login BACKME account.');
		});
	} catch (e) {
		res.status(500).send("Internal Server Error. Try again.");
	}
});


/*generate forgot password(randomly)*/
app.get('/forgotpassword/:emailId', function (req, res) {
	var emailId = req.params.emailId;
	if (!emailId) {
		res.status(500).send('Email is required.');
		return;
	};
	try {
		var radomPassword = Math.random().toString(36).slice(-8);
		dbConnection.query('UPDATE users SET password=? WHERE email=? AND loginType="CUSTOM"', [radomPassword, emailId], function (error, results, fields) {
			if (error) {
				res.status(500).send('Internal Server Error. Try again.');
				return;
			}
			if (results.affectedRows == 1) {
				emails.sendForgotPasswordEmails(app, transporter, 'forgot-password.ejs', emailId, radomPassword, 'Forgot Password', function (info) {
					console.log(info);
				});
				res.status(200).send(results);
			} else {
				res.status(200).send('EMAILNOTFOUND');
			}
		});
	} catch (e) {
		res.status(500).send("Internal Server Error. Try again.");
	}
});


/*changepassword password(randomly)*/
app.put('/changepassword', function (req, res) {
	var user = req.body;
	if (!user.userId || !user.password || !user.newPassword) {
		res.status(500).send('userId/password/new password is required.');
		return;
	};
	try {
		dbConnection.query('UPDATE users SET password=? WHERE userId=? AND password=?', [user.newPassword, user.userId, user.password], function (error, results, fields) {
			if (error) {
				res.status(500).send('Internal Server Error. Try again.');
				return;
			}
			if (results.affectedRows == 1) {
				/*emails.sendForgotPasswordEmails(app, transporter, 'forgot-password.ejs', emailId, radomPassword, 'Forgot Password', function(info) {
					console.log(info);
				});*/
				res.status(200).send(results);
			} else {
				res.status(200).send('INVALID');
			}
		});
	} catch (e) {
		res.status(500).send("Internal Server Error. Try again.");
	}
});


/*update users*/
app.post('/users', function (req, res) {
	var upload = multer({
		storage: storage,
		limits: {
			fileSize: MAX_USERS_FILE_SIZE
		}
	}).fields([{
		name: 'userCoverPhoto',
		maxCount: 1
	}, {
		name: 'userProfilePhoto',
		maxCount: 1
	}]);

	upload(req, res, function (err, success) {
		if (err) {
			console.log(err);
			res.status(500).send('Error Uploading file. Invalid file format/exceeded file size/Internal Server error.');
			return;
		}
		var user = req.body;
		if (req.files && req.files.userCoverPhoto) {
			user.coverPicture = req.files.userCoverPhoto[0].filename;
		}
		if (req.files && req.files.userProfilePhoto) {
			user.profilePicture = req.files.userProfilePhoto[0].filename;
		}
		if (!user.userId) {
			res.status(400).send("Bad Request. User ID should not be blank.");
			return;
		};
		if (user.email && !validate.validateEmail(user.email)) {
			res.status(400).send("Invalid Email.");
			return;
		}
		try {
			dbConnection.query('UPDATE users SET ? WHERE userId=?', [user, user.userId], function (error, results, fields) {
				if (error) {
					console.log(error);
					res.status(500).send(error.code);
					return;
				}
				results.user = user;
				res.status(200).send(results);
			});
		} catch (e) {
			console.log(e);
			res.status(500).send("Internal Server Error.");
		}
	});
});

/*update users when create project profile*/
app.post('/profile', function (req, res) {
	var user = req.body;
	if (!user.userId) {
		res.status(400).send("Bad Request. User ID should not be blank.");
		return;
	};
	if (user.email && !validate.validateEmail(user.email)) {
		res.status(400).send("Invalid Email.");
		return;
	}
	try {
		dbConnection.query('UPDATE users SET ? WHERE userId=?', [user, user.userId], function (error, results, fields) {
			if (error) {
				console.log(error);
				res.status(500).send(error.code);
				return;
			}
			results.user = user;
			res.status(200).send(results);
		});
	} catch (e) {
		console.log(e);
		res.status(500).send("Internal Server Error.");
	}
});

/*Get All users*/
app.get('/users', function (req, res) {
	try {
		dbConnection.query('SELECT * FROM users', function (error, results, fields) {
			if (error) {
				res.status(500).send("Internal Server Error.");
				return;
			}
			res.status(200).send(results);
		});
	} catch (e) {
		res.status(500).send("Internal Server Error.");
	}
});


/*Get All Specific users details*/
app.get('/users/:userId', function (req, res) {
	var userId = req.params.userId;
	try {
		if (userId) {
			dbConnection.query('SELECT * FROM users WHERE userId=?', [userId], function (error, results, fields) {
				if (error) {
					res.status(500).send("Internal Server Error.");
					return;
				}
				res.status(200).send(results);
			});
		}
	} catch (e) {
		res.status(500).send("Internal Server Error.");
	}
});



const MAX_USERS_FILE_SIZE = 10 * 1024 * 1024;

/*Begin the Image upload test*/
var storage = multer.diskStorage({
	destination: function (req, file, callback) {
		if (['.jpg', '.png', '.jpeg'].indexOf(path.extname(file.originalname)) == -1) {
			callback(new Error('FileUpload: Invalid Extension.', null));
		} else {
			callback(null, 'public/uploads');
		}
	},
	filename: function (req, file, callback) {
		callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
	}
});

app.post('/uploadTest', function (req, res) {
	var upload = multer({
		storage: storage,
		limits: {
			fileSize: 30 * 1024 * 1024
		}
	}).fields([{
		name: 'posterImg',
		maxCount: 1
	}, {
		name: 'gallery',
		maxCount: 8
	}]);

	upload(req, res, function (err, success) {
		if (err) {
			console.log(err);
			res.status(500).send(err);
			//res.status(500).send('Error Uploading file. Invalid file format/exceeded file size/Internal Server error.');
			return;
		}
		console.log(req.body.projectId);
		if (req.files && req.files.gallery) {
			var gallery = [];
			for (i in req.files.gallery) {
				console.log(req.files.gallery[i]);
				gallery.push([1, 1, req.files.gallery[i].mimetype, req.files.gallery[i].filename]);
			}
			try {
				/*dbConnection.query('INSERT INTO projectsassets (projectId, userId, type, location) VALUES ?', [gallery], function (error, results, fields) {
					if (error) {
						res.status(500).send(error.code=='ER_DUP_ENTRY'?'Email already found.':error.code);
						return;
					}
					res.status(200).send('images/videos added successfully.');
					return;
				});*/
			} catch (e) {
				res.status(500).send("Internal Server Error.");
			}
			res.status(200).send('images/videos added successfully.');
		} else if (req.files && (req.files.posterImg || req.files.gallery)) {
			res.status(200).send("File uploaded successfully.");
		} else
			res.status(404).send("Please select file to upload.");
	});
});

/*End of the Image upload test*/

app.post('/sendSugirMail', function response(req, res) {
	var __transporter = nodemailer.createTransport({
			service: 'gmail',
			auth: {
				user: 'devsugir@gmail.com',
				pass: 'Gowtham93'
			}
		}),
		fromMailId = '"SUNLIFE EMPLOYMENT SOLUTIONS" <devsugir@gmail.com>',
		copyMailId = ['info@sesjobs.ca', 'vickybill77@gmail.com', 'nadine.r.thomas1971@gmail.com'];
	emails.sendSugirEmails(app, __transporter, 'user-confirmation-email-template.ejs', fromMailId, req.body.email, 'Thanks for contacting us!', {});
	emails.sendSugirEmails(app, __transporter, 'contactDetails-emailTemplate.ejs', fromMailId, copyMailId, 'New Job Request receved!', req.body);
	res.send({
		notification: 'Email sent successfully.'
	})
});


