
/*begin the google login for upload video in youtube*/

var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;
var youtube = google.youtube('v3');
var googleToken;

//var Youtube = require('youtube-video-api');

exports.youtubeAPI = function(app, dbConnection, validate, multer, path, nesting, async, moment, request, oAuthCredentials) {
	
	/*var youtube = Youtube({ 
		video: {
			part: 'status,snippet' 
		}
	})

	var params = {
	  resource: {
		snippet: {
		  title: 'test video',
		  description: 'This is a test video uploaded via the YouTube API'
		},
		status: {
		  privacyStatus: 'private'
		}
	  }
	}

	youtube.authenticate(oAuthCredentials.client_id, oAuthCredentials.client_secret, function (err, tokens) {
		console.log('err', tokens);
	});*/

	
	var oauth2Client = new OAuth2(
		oAuthCredentials.client_id,
		oAuthCredentials.client_secret,
		oAuthCredentials.redirect_url
	);

	// generate a url that asks permissions for Google+ and Google Calendar scopes
	var scopes = [
	  'https://www.googleapis.com/auth/plus.me',
	  'https://www.googleapis.com/auth/youtube.upload'
	];


	var url = oauth2Client.generateAuthUrl({
	  access_type: 'offline',
	  scope: scopes,
	  approval_prompt:'force'
	});

	console.log(url);

	function getTokenFromDB() {
		try {
			dbConnection.query('SELECT * FROM tokens', function (error, results, fields) {
				if (error) {
					console.log(error)
					return;
				}
				if(results.length) {
					console.log(results)
					oauth2Client.setCredentials({
						access_token: results[0].access_token,
						refresh_token: results[0].refresh_token,
						expiry_date: results[0].expiry_date
					});
					googleToken = results[0];
					google.options({auth: oauth2Client});
					autoRefreshToen();
				} else {
					console.log('Please login to youtube to upload the video.')
					console.log(url);
				}
			});
		} catch(e) {
			console.log(e);
		}
	}
	
	function saveTokenToDB(tokens) {
		try {
			dbConnection.query('DELETE FROM tokens', function (error, results, fields) {
				if (error) {
					console.log(error)
					return;
				}
				console.log('Token Deleted successfully.');
				dbConnection.query('INSERT INTO tokens SET ?', tokens, function (error, results, fields) {
					if(error) {
						console.log(error)
						return;
					}
					console.log('Token Saved successfully.');
				});
			});
		} catch(e) {
			console.log(e);
		}
	}
	
	function autoRefreshToen() {
		/* begin the refresh access token function in 5hrs intervel */
		setInterval(function() {
			oauth2Client.refreshAccessToken(function(err, tokens) {
				oauth2Client.setCredentials({
					access_token: tokens.access_token,
					refresh_token: googleToken.refresh_token,
					expiry_date: tokens.expiry_date
				});
				googleToken = {
					access_token: tokens.access_token,
					refresh_token: googleToken.refresh_token,
					expiry_date: tokens.expiry_date
				};
				google.options({auth: oauth2Client});
				saveTokenToDB(googleToken);
				console.log('auto refresh tokens', googleToken);
			});
		}, 1000*60*60*5);
		/* end the refresh token function 1000*60*60*5 */		
	}
	
	if(!googleToken) {
		getTokenFromDB();
	}
	
	app.get('/auth', function(req, res) {
		console.log('req.query.code', req.query.code);
		oauth2Client.getToken(req.query.code, function(err, tokens) {
			if (err) {
				console.log('Error while trying to retrieve access tokens', err);
				res.status(200).send(err);
				return;
			}
			oauth2Client.setCredentials(tokens);
			googleToken = tokens;
			google.options({auth: oauth2Client});
			console.log('tokens', tokens);
			saveTokenToDB(googleToken);
			autoRefreshToen();
			res.status(200).send(tokens);
		});
	});

	app.get('/refreshOauthToken', function(req, res) {
		oauth2Client.refreshAccessToken(function(err, tokens) {
			oauth2Client.setCredentials(tokens);
			googleToken = tokens;
			google.options({auth: oauth2Client});
			console.log('refresh tokens', tokens);
			res.status(200).send(tokens);
		});
		
	});
	
	app.post('/uploadVideo', function(req, res) {
		var upload = multer({
			storage: multer.memoryStorage()
		}).fields([{name:'projectImages', maxCount:8}]);

		upload(req, res, function (err, success) {
			if (err) {
				console.log(err);
				res.status(500).send(err);
				return;
			}
			var project = req.body;
			if(!project.projectId || !project.userId) {
				res.status(400).send("Bad Request. Project ID/User ID should not be blank.");
				return;
			};

			if(req.files && req.files.projectImages) {
				console.log(project);
				var videoData = req.files.projectImages[0].buffer;
				uploadToYoutube(videoData, project.title, project.title, googleToken, function(err, data) {
					if(err) {
						console.log(err);
						res.status(500).send(err);
						return;
					}
					try {
						var projectAssets = [];
						projectAssets.push([project.projectId, project.userId, 'Video', data.snippet.thumbnails["high"].url, data.id, data.snippet.title, data.snippet.description]);
						dbConnection.query('INSERT INTO projectsassets (projectId, userId, type, location, videoId, title, description) VALUES ?', [projectAssets], function (error, results, fields) {
							if (error) {
								res.status(500).send(error.code=='ER_DUP_ENTRY'?'Email already found.':error.code);
								return;
							}
							projectAssets[0].splice(4,0, results.insertId);
							res.status(200).send(projectAssets);
							return;
						});
					} catch(e) {
						console.log(e);
						res.status(500).send("Internal Server Error.");
					}
				});
			} else {
				res.status(500).send('Video file not found.');
			}
		});
	});


	function uploadToYoutube(videoBuffered, title, description,tokens, callback){
		youtube.videos.insert({
			part: 'status,snippet',
			resource: {
				snippet: {
					title: title,
					description: description,
					tags: ['Backme']
				},
				status: { 
					privacyStatus: 'public' //if you want the video to be private
				}
			},
			media: {
				body: videoBuffered
			}
		}, function(error, data){
			console.log('youtube err ', error);
			console.log('youtube data ', data);
			
			if(error){
				callback(error, null);
			} else {
				callback(null, data);
			}
		});
	};
	
	/* Create free subscribtions */
	//https://youtu.be/fau0K92B5oA
	app.put('/updatevideostatus', function (req, res) {
		var video = req.body;
		/*if(!video.userId || !video.videoId) {
			res.status(400).send("Bad Request. UserId/CourseId should not be blank.");
			return;
		};*/
		try {
			youtube.videos.update({
				part: 'status,snippet',
				id: "fau0K92B5oA",
				status: { 
					privacyStatus: 'public' //if you want the video to be private
				}
			}, function(error, data){
				console.log('youtube err ', error);
				console.log('youtube data ', data);

				if(error){
					//callback(error, null);
					console.log('error');
					res.status(200).send(error);
				} else {
					//callback(null, data);
					console.log('data');
					res.status(200).send(data);
				}
			});
		} catch(e) {
			res.status(500).send(e);
		}
	});
	
}

/*end google login for upload video in youtube*/