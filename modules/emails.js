var route = {
	test: function () {
		console.log('your calling the function from the external file.');
	},
	testMail: function (app, dbConnection, validate, multer, path, nesting, async, moment, transporter, ejs) {
		return app.get('/sendMail', function response(req, res) {
			route.sendEmails(app, transporter, 'user-register.ejs', 'nvijay.blr@gmail.com', 'Test Subject', function(info) {
				res.status(200).send(info);
			});
		});
	},
	sendEmails: function(app, transporter, _template, _email, _subject, _callback) {
		app.render(_template, {name: 'Vijay'}, function(err, template){
			if (err) {
				console.log('error rendering email template:', err) 
				return
			}
			var mailOptions = {
				from: '"BACKME" <nvijay.ooty@gmail.com>', 
				to: _email, 
				subject: _subject,
				text: '', // plain text body
				html: template
			};

			transporter.sendMail(mailOptions, (error, info) => {
				if (error) {
					if(_callback)
						_callback(error);
					return console.log(error);
				}
				if(_callback)
					_callback(info);
				console.log('Message %s sent: %s', info.messageId, info.response);
			});
		});
	},
	sendForgotPasswordEmails: function(app, transporter, _template, _email, _password, _subject, _callback) {
		app.render(_template, {name: 'Vijay', password: _password}, function(err, template){
			if (err) {
				console.log('error rendering email template:', err) 
				return
			}
			var mailOptions = {
				from: '"BACKME" <nvijay.ooty@gmail.com>', 
				to: _email, 
				subject: _subject,
				text: '', // plain text body
				html: template
			};

			transporter.sendMail(mailOptions, (error, info) => {
				if (error) {
					if(_callback)
						_callback(error);
					return console.log(error);
				}
				if(_callback)
					_callback(info);
				console.log('Message %s sent: %s', info.messageId, info.response);
			});
		});
	},
	sendSugirEmails: function(app, transporter, _template, _fromEmail, _toEmail, _subject, _data) {
		app.render(_template, {data: _data}, function(err, template){
			if (err) {
				console.log('error rendering email template:', err) 
				return
			}
			var mailOptions = {
				from: _fromEmail, 
				to: _toEmail, 
				subject: _subject,
				text: '', // plain text body
				html: template
			};
			transporter.sendMail(mailOptions, (error, info) => {
				if (error) {
                     console.log(error);
					return;
				}
				console.log('Message %s sent: %s', info.messageId, info.response);
			});
		});
	}
	
};

module.exports = route;

/*exports.route = function(app, dbConnection, validate, multer, path, nesting, async, moment, transporter, ejs) {
	
	app.get('/sendMail', function response(req, res) {
		sendVerificationMail('nvijay.blr@gmail.com', '1', function(info) {
			res.status(200).send(info);
		});
	});

	function sendVerificationMail(_email, _link, _callback) {
		app.render('email.ejs', {name: 'Vijay'}, function(err, template){
			if (err) {
				console.log('error rendering email template:', err) 
				return
			}
			var mailOptions = {
				from: '"BACKME" <nvijay.ooty@gmail.com>', 
				to: _email, 
				subject: 'Backme Account Verification',
				text: '', // plain text body
				html: template
			};

			transporter.sendMail(mailOptions, (error, info) => {
				if (error) {
					if(_callback)
						_callback(error);
					return console.log(error);
				}
				if(_callback)
					_callback(info);
				console.log('Message %s sent: %s', info.messageId, info.response);
			});
		});

	}
}*/