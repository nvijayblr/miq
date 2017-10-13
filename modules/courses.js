
exports.coursesAPI = function(app, dbConnection, validate, multer, path, nesting, async, moment, transporter, emails) {

	/*Get all courses*/
	app.get('/courses', function (req, res) {
		var userId = req.query.userId || '';
		try {
			dbConnection.query("SELECT c.*, (SELECT COUNT(*) FROM likes WHERE c.courseId = courseId) AS likesCount, (SELECT COUNT(*) FROM views WHERE c.courseId = courseId) AS viewsCount, (SELECT COUNT(*) FROM subjects WHERE c.courseId = courseId) AS lecturesCount, (SELECT SUM(minutes) FROM subjects WHERE c.courseId = courseId) AS courseMinutes, (SELECT name FROM instructor WHERE c.instructorId = instructorId) AS instructorName, (SELECT COUNT(*) FROM comments WHERE c.courseId = courseId) AS commentsCount, (SELECT COUNT(*) FROM favourites WHERE c.courseId = courseId AND userId='"+userId+"') AS favCount, (SELECT COUNT(*) FROM subscriptions WHERE c.courseId = courseId AND userId='"+userId+"' AND (subscribedOn+INTERVAL c.duration DAY) > CURRENT_TIMESTAMP()) AS subscribed FROM courses c WHERE c.status='ACTIVE'", function (error, results, fields) {
				if (error) {
					res.status(500).send("Internal Server Error.");
					return;
				}
				res.status(200).send(results);
			});
		} catch(e) {
			console.log(e);
			res.status(500).send(e);
		}
	});
	
	/*Get Specific courses by courseId*/
	app.get('/views/courses/:coursesId', function (req, res) {
		var coursesId = req.params.coursesId;
		var userId = req.query.userId || '';
		if(!coursesId) {
			res.status(500).send("Course Id should not be empty.");
			return;
		}
		try {
			dbConnection.query({sql: "SELECT *, (SELECT COUNT(*) FROM likes WHERE courses.courseId = courseId) AS likesCount, \
			(SELECT COUNT(*) from likes where courses.courseId = courseId AND userId='"+userId+"') AS alreadyLiked, \
			(SELECT COUNT(*) FROM views WHERE courses.courseId = courseId) AS viewsCount, \
			(SELECT COUNT(*) FROM subjects WHERE courses.courseId = courseId) AS lecturesCount, \
			(SELECT SUM(minutes) FROM subjects WHERE courses.courseId = courseId) AS courseMinutes, \
			(SELECT name FROM instructor WHERE courses.instructorId = instructorId) AS instructorName, \
			(SELECT COUNT(*) FROM comments WHERE courses.courseId = courseId) AS commentsCount, \
			(SELECT COUNT(*) FROM subscriptions WHERE courses.courseId = courseId) AS subscriptionsCount, \
			(SELECT COUNT(*) FROM favourites WHERE courses.courseId = courseId AND userId='"+userId+"') AS favCount, \
			(SELECT COUNT(*) FROM subscriptions WHERE courses.courseId = courseId AND userId='"+userId+"' AND (subscribedOn+INTERVAL courses.duration DAY) > CURRENT_TIMESTAMP()) AS subscribed \
			FROM courses \
			LEFT JOIN subjects ON courses.courseId = subjects.courseId \
			LEFT JOIN instructor ON courses.instructorId = instructor.instructorId \
			WHERE courses.status='ACTIVE' AND (courses.courseId=? || courses.code=?)", nestTables: true}, [coursesId, coursesId], function (error, results, fields) {
				var nestingOptions = [
					{ tableName : 'courses', pkey: 'courseId', fkeys:[
						{table:'subjects',col:'courseId'},
						{table:'instructor',col:'instructorId'},
						{table:'social',col:'courseId'}
					]},
					{ tableName : 'subjects', pkey: 'subjectId'},
					{ tableName : 'instructor', pkey: 'instructorId'},
					{ tableName : 'social', pkey: 'socialId'}
				];
				var nestedRows = nesting.convertToNested(results, nestingOptions);
				if (error) {
					res.status(500).send(error);
					return;
				}
				res.status(200).send(nestedRows);
			});
		} catch(e) {
			console.log(e);
			res.status(500).send(e);
		}
	});
	
	/*Get Specific courses/test by courseId*/
	app.get('/views/tests/:coursesId', function (req, res) {
		var coursesId = req.params.coursesId;
		var userId = req.query.userId || '';
		if(!coursesId) {
			res.status(500).send("Test Id should not be empty.");
			return;
		}
		//tests/question/answer
		try {
			dbConnection.query({sql: "SELECT *, (SELECT COUNT(*) FROM likes WHERE courses.courseId = courseId) AS likesCount, \
			(SELECT COUNT(*) from likes where courses.courseId = courseId AND userId='"+userId+"') AS alreadyLiked, \
			(SELECT COUNT(*) FROM views WHERE courses.courseId = courseId) AS viewsCount, \
			(SELECT COUNT(*) FROM questions WHERE courses.courseId = courseId) AS questionsCount, \
			(SELECT name FROM instructor WHERE courses.instructorId = instructorId) AS instructorName, \
			(SELECT COUNT(*) FROM comments WHERE courses.courseId = courseId) AS commentsCount, \
			(SELECT COUNT(*) FROM subscriptions WHERE courses.courseId = courseId) AS subscriptionsCount, \
			(SELECT COUNT(*) FROM favourites WHERE courses.courseId = courseId AND userId='"+userId+"') AS favCount, \
			(SELECT COUNT(*) FROM subscriptions WHERE courses.courseId = courseId AND userId='"+userId+"' AND (subscribedOn+INTERVAL courses.duration DAY) > CURRENT_TIMESTAMP()) AS subscribed \
			FROM courses \
			LEFT JOIN tests ON courses.courseId = tests.courseId \
			LEFT JOIN instructor ON courses.instructorId = instructor.instructorId \
			WHERE courses.status='ACTIVE' AND (courses.courseId=? || courses.code=?)", nestTables: true}, [coursesId, coursesId], function (error, results, fields) {
				var nestingOptions = [
					{ tableName : 'courses', pkey: 'courseId', fkeys:[
						{table:'tests',col:'courseId'},
						{table:'instructor',col:'instructorId'},
						{table:'social',col:'courseId'}
					]},
					{ tableName : 'tests', pkey: 'testId'},
					{ tableName : 'instructor', pkey: 'instructorId'},
					{ tableName : 'social', pkey: 'socialId'}
				];
				var nestedRows = nesting.convertToNested(results, nestingOptions);
				if (error) {
					res.status(500).send(error);
					return;
				}
				res.status(200).send(nestedRows);
			});
		} catch(e) {
			console.log(e);
			res.status(500).send(e);
		}
	});
	
	/*Get Specific subscribed courses by courseId*/
	app.get('/subscribed/course/:coursesId', function (req, res) {
		var coursesId = req.params.coursesId;
		var userId = req.query.userId || '';
		if(!coursesId) {
			res.status(500).send("Course Id should not be empty.");
			return;
		}
		try {
			dbConnection.query({sql: "SELECT *, (SELECT COUNT(*) FROM likes WHERE courses.courseId = courseId) AS likesCount, \
			(SELECT COUNT(*) from likes where courses.courseId = courseId AND userId='"+userId+"') AS alreadyLiked, \
			(SELECT COUNT(*) FROM views WHERE courses.courseId = courseId) AS viewsCount, \
			(SELECT COUNT(*) FROM subjects WHERE courses.courseId = courseId) AS lecturesCount, \
			(SELECT SUM(minutes) FROM subjects WHERE courses.courseId = courseId) AS courseMinutes, \
			(SELECT name FROM instructor WHERE courses.instructorId = instructorId) AS instructorName, \
			(SELECT COUNT(*) FROM comments WHERE courses.courseId = courseId) AS commentsCount, \
			(SELECT COUNT(*) FROM subscriptions WHERE courses.courseId = courseId) AS subscriptionsCount, \
			(SELECT COUNT(*) FROM favourites WHERE courses.courseId = courseId AND userId='"+userId+"') AS favCount, \
			(SELECT COUNT(*) FROM subscriptions WHERE courses.courseId = courseId AND userId='"+userId+"' AND (subscribedOn+INTERVAL courses.duration DAY) > CURRENT_TIMESTAMP()) AS subscribed \
			FROM courses \
			LEFT JOIN instructor ON courses.instructorId = instructor.instructorId \
			LEFT JOIN subjects ON courses.courseId = subjects.courseId \
			LEFT JOIN videos ON subjects.subjectId = videos.subjectId \
			LEFT JOIN coursehistory ON videos.videoId = coursehistory.videoId AND coursehistory.userId='"+userId+"' \
			WHERE courses.status='ACTIVE' AND courses.type='COURSE' AND (courses.courseId=? || courses.code=?) AND (SELECT COUNT(*) from subscriptions s where s.courseId=courses.courseId AND s.userId='"+userId+"')", nestTables: true}, [coursesId, coursesId], function (error, results, fields) {
				var nestingOptions = [
					{tableName : 'courses', pkey: 'courseId', fkeys:[
						{table:'subjects',col:'courseId'},
						{table:'instructor',col:'instructorId'},
						{table:'social',col:'courseId'}
					]},
					{tableName : 'subjects', pkey: 'subjectId', fkeys:[
						{table:'videos',col:'subjectId'}
					]},
					{tableName : 'videos', pkey: 'videoId', fkeys:[
						{table:'coursehistory',col:'videoId'}
					]},
					{ tableName : 'instructor', pkey: 'instructorId'},
					/*{ tableName : 'videos', pkey: 'videoId'},*/
					{ tableName : 'coursehistory', pkey: 'chId'},
					{ tableName : 'social', pkey: 'socialId'}
				];
				var nestedRows = nesting.convertToNested(results, nestingOptions);
				if (error) {
					res.status(500).send(error);
					return;
				}
				res.status(200).send(nestedRows);
			});
		} catch(e) {
			console.log(e);
			res.status(500).send(e);
		}
	});
	
	/*
	Course
	- tests
	---- questions
	------- answers
	*/

	/*Get Specific subscribed test by testId*/
	//SELECT *, (SELECT status FROM assigntests WHERE testId=tests.testId) as testStatus FROM tests WHERE courseId = '6'
	app.get('/subscribed/tests/:coursesId', function (req, res) {
		var coursesId = req.params.coursesId;
		var nestedRows;
		var userId = req.query.userId || '';
		if(!coursesId) {
			res.status(500).send("Test Id should not be empty.");
			return;
		}
		try {
			dbConnection.query({sql: "SELECT *, (SELECT COUNT(*) FROM likes WHERE courses.courseId = courseId) AS likesCount, \
			(SELECT COUNT(*) from likes where courses.courseId = courseId AND userId='"+userId+"') AS alreadyLiked, \
			(SELECT COUNT(*) FROM views WHERE courses.courseId = courseId) AS viewsCount, \
			(SELECT COUNT(*) FROM subjects WHERE courses.courseId = courseId) AS lecturesCount, \
			(SELECT SUM(minutes) FROM subjects WHERE courses.courseId = courseId) AS courseMinutes, \
			(SELECT name FROM instructor WHERE courses.instructorId = instructorId) AS instructorName, \
			(SELECT COUNT(*) FROM comments WHERE courses.courseId = courseId) AS commentsCount, \
			(SELECT COUNT(*) FROM subscriptions WHERE courses.courseId = courseId) AS subscriptionsCount, \
			(SELECT COUNT(*) FROM favourites WHERE courses.courseId = courseId AND userId='"+userId+"') AS favCount, \
			(SELECT COUNT(*) FROM subscriptions WHERE courses.courseId = courseId AND userId='"+userId+"' AND (subscribedOn+INTERVAL courses.duration DAY) > CURRENT_TIMESTAMP()) AS subscribed \
			FROM courses \
			LEFT JOIN instructor ON courses.instructorId = instructor.instructorId \
			WHERE courses.status='ACTIVE' AND courses.type='TEST' AND (courses.courseId=? || courses.code=?) AND (SELECT COUNT(*) from subscriptions s where s.courseId=courses.courseId AND s.userId='"+userId+"')", nestTables: true}, [coursesId, coursesId], function (error, results, fields) {
				var nestingOptions = [
					{tableName : 'courses', pkey: 'courseId', fkeys:[
						{table:'instructor',col:'instructorId'},
						{table:'social',col:'courseId'}
					]},
					{ tableName : 'instructor', pkey: 'instructorId'},
					{ tableName : 'social', pkey: 'socialId'}
				];
				nestedRows = nesting.convertToNested(results, nestingOptions);
				if (error) {
					res.status(500).send(error);
					return;
				}
				//Get the test status whether it is started/completed/pending/yet to start
				
				if(nestedRows.length) {
					dbConnection.query('SELECT *, (SELECT status FROM assigntests WHERE testId=tests.testId AND status!="COMPLETED" LIMIT 1) as testCompletionStatus FROM tests WHERE courseId = ?', [nestedRows[0].courseId], function (error, results, fields) {
						if (error) {
							res.status(500).send(error);
							return;
						}
						nestedRows[0].tests = results;
						res.status(200).send(nestedRows);
					});
				} else {
					res.status(200).send(nestedRows);
				}
			});
		} catch(e) {
			console.log(e);
			res.status(500).send(e);
		}
	});
	

	/*Get Specific subscribed courses by courseId*/
	app.get('/testing/tests/:coursesId', function (req, res) {
		var coursesId = req.params.coursesId;
		var userId = req.query.userId || '';
		if(!coursesId) {
			res.status(500).send("Course Id should not be empty.");
			return;
		}
		try {
			dbConnection.query({sql: "SELECT *, (SELECT COUNT(*) FROM likes WHERE courses.courseId = courseId) AS likesCount, \
			(SELECT COUNT(*) from likes where courses.courseId = courseId AND userId='"+userId+"') AS alreadyLiked, \
			(SELECT COUNT(*) FROM views WHERE courses.courseId = courseId) AS viewsCount, \
			(SELECT COUNT(*) FROM subjects WHERE courses.courseId = courseId) AS lecturesCount, \
			(SELECT SUM(minutes) FROM subjects WHERE courses.courseId = courseId) AS courseMinutes, \
			(SELECT name FROM instructor WHERE courses.instructorId = instructorId) AS instructorName, \
			(SELECT COUNT(*) FROM comments WHERE courses.courseId = courseId) AS commentsCount, \
			(SELECT COUNT(*) FROM subscriptions WHERE courses.courseId = courseId) AS subscriptionsCount, \
			(SELECT COUNT(*) FROM favourites WHERE courses.courseId = courseId AND userId='"+userId+"') AS favCount, \
			(SELECT COUNT(*) FROM subscriptions WHERE courses.courseId = courseId AND userId='"+userId+"' AND (subscribedOn+INTERVAL courses.duration DAY) > CURRENT_TIMESTAMP()) AS subscribed \
			FROM courses \
			LEFT JOIN instructor ON courses.instructorId = instructor.instructorId \
			LEFT JOIN tests ON tests.courseId = courses.courseId \
			LEFT JOIN questions ON questions.testId = tests.testId \
			LEFT JOIN answers ON answers.questionId = questions.questionId \
			WHERE courses.status='ACTIVE' AND courses.type='TEST' AND (courses.courseId=? || courses.code=?) AND (SELECT COUNT(*) from subscriptions s where s.courseId=courses.courseId AND s.userId='"+userId+"')", nestTables: true}, [coursesId, coursesId], function (error, results, fields) {
				var nestingOptions = [
					{tableName : 'courses', pkey: 'courseId', fkeys:[
						{table:'tests',col:'courseId'},
						{table:'instructor',col:'instructorId'},
						{table:'social',col:'courseId'}
					]},
					{tableName : 'tests', pkey: 'testId', fkeys:[
						{table:'questions',col:'testId'}
					]},
					{tableName : 'questions', pkey: 'questionId', fkeys:[
						{table:'answers',col:'questionId'}
					]},
					{ tableName : 'instructor', pkey: 'instructorId'},
					{ tableName : 'answers', pkey: 'id'},
					/*{ tableName : 'coursehistory', pkey: 'chId'},*/
					{ tableName : 'social', pkey: 'socialId'}
				];
				var nestedRows = nesting.convertToNested(results, nestingOptions);
				if (error) {
					res.status(500).send(error);
					return;
				}
				res.status(200).send(nestedRows);
			});
		} catch(e) {
			console.log(e);
			res.status(500).send(e);
		}
	});
	
	
	/* update course taken history */
	app.put('/coursehistory', function (req, res) {
		var history = req.body;
		if(!history.userId || !history.courseId || !history.subjectId || !history.videoId) {
			res.status(400).send("Bad Request. Parameters mismatched.");
			return;
		};
		try {
			dbConnection.query('INSERT INTO coursehistory (chId, userId, courseId, subjectId, videoId) VALUES (?, ?,?,?,?) ON DUPLICATE KEY UPDATE lastViewed=NOW()', [history.chId, history.userId, history.courseId, history.subjectId, history.videoId], function (error, results, fields) {
				if (error) {
					res.status(500).send('Internal Server Error.');
					return;
				}
				res.status(200).send(results);
			});
		} catch(e) {
			res.status(500).send("Internal Server Error.");
		}
	});

	/*Get course/test list for home page*/
	app.get('/all', function (req, res) {
		var q = req.query.q || '';
		var userId = req.query.userId || '';
		var limit = '';
		if(req.query.limit) {
			limit = ' LIMIT 0, ' + req.query.limit;
		}
		var courses = {
			topPaidCourses: '',
			topFreeCourses: '',
			topPaidTests: '',
			topFreeTests: ''
		}
		async.waterfall([
			function (wCB) {
				if(q=='all' || q=='' || q=='topPaidCourses') {
					var sql = "SELECT c.*, (SELECT COUNT(*) FROM likes WHERE c.courseId = courseId) AS likesCount, (SELECT COUNT(*) FROM views WHERE c.courseId = courseId) AS viewsCount, (SELECT COUNT(*) FROM subjects WHERE c.courseId = courseId) AS lecturesCount, (SELECT SUM(minutes) FROM subjects WHERE c.courseId = courseId) AS courseMinutes, (SELECT name FROM instructor WHERE c.instructorId = instructorId) AS instructorName, (SELECT COUNT(*) FROM comments WHERE c.courseId = courseId) AS commentsCount, (SELECT COUNT(*) FROM favourites WHERE c.courseId = courseId AND userId='"+userId+"') AS favCount, (SELECT COUNT(*) FROM subscriptions WHERE c.courseId = courseId AND userId='"+userId+"' AND (subscribedOn+INTERVAL c.duration DAY) > CURRENT_TIMESTAMP()) AS subscribed FROM courses c WHERE c.status='ACTIVE' AND c.price='PAID' AND c.type='COURSE'"+ limit;
					dbConnection.query(sql, function (error, results, fields) {
						if (error) {
							return wCB(error);
						}
						courses.topPaidCourses = results;
						wCB();
					});
				} else {
					wCB();
				}
			},
			function (wCB) {
				if(q=='all' || q=='' || q=='topFreeCourses') {
					var sql = "SELECT c.*, (SELECT COUNT(*) FROM likes WHERE c.courseId = courseId) AS likesCount, (SELECT COUNT(*) FROM views WHERE c.courseId = courseId) AS viewsCount, (SELECT COUNT(*) FROM subjects WHERE c.courseId = courseId) AS lecturesCount, (SELECT SUM(minutes) FROM subjects WHERE c.courseId = courseId) AS courseMinutes, (SELECT name FROM instructor WHERE c.instructorId = instructorId) AS instructorName, (SELECT COUNT(*) FROM comments WHERE c.courseId = courseId) AS commentsCount, (SELECT COUNT(*) FROM favourites WHERE c.courseId = courseId AND userId='"+userId+"') AS favCount, (SELECT COUNT(*) FROM subscriptions WHERE c.courseId = courseId AND userId='"+userId+"' AND (subscribedOn+INTERVAL c.duration DAY) > CURRENT_TIMESTAMP()) AS subscribed FROM courses c WHERE c.status='ACTIVE' AND c.price='FREE' AND c.type='COURSE'"+ limit;
					dbConnection.query(sql, function (error, results, fields) {
						if (error) {
							return wCB(error);
						}
						courses.topFreeCourses = results;
						wCB();
					});
				} else {
					wCB();
				}
			},
			function (wCB) {
				if(q=='all' || q=='' || q=='topPaidTests') {
					var sql = "SELECT c.*, (SELECT COUNT(*) FROM likes WHERE c.courseId = courseId) AS likesCount, (SELECT COUNT(*) FROM views WHERE c.courseId = courseId) AS viewsCount, (SELECT COUNT(*) FROM subjects WHERE c.courseId = courseId) AS lecturesCount, (SELECT SUM(minutes) FROM subjects WHERE c.courseId = courseId) AS courseMinutes, (SELECT name FROM instructor WHERE c.instructorId = instructorId) AS instructorName, (SELECT COUNT(*) FROM comments WHERE c.courseId = courseId) AS commentsCount, (SELECT COUNT(*) FROM favourites WHERE c.courseId = courseId AND userId='"+userId+"') AS favCount, (SELECT COUNT(*) FROM subscriptions WHERE c.courseId = courseId AND userId='"+userId+"' AND (subscribedOn+INTERVAL c.duration DAY) > CURRENT_TIMESTAMP()) AS subscribed FROM courses c WHERE c.status='ACTIVE' AND c.price='PAID' AND c.type='TEST'"+ limit;
					dbConnection.query(sql, function (error, results, fields) {
						if (error) {
							return wCB(error);
						}
						courses.topPaidTests = results;
						wCB();
					});
				} else {
					wCB();
				}
			},
			function (wCB) {
				if(q=='all' || q=='' || q=='topFreeTests') {
					var sql = "SELECT c.*, (SELECT COUNT(*) FROM likes WHERE c.courseId = courseId) AS likesCount, (SELECT COUNT(*) FROM views WHERE c.courseId = courseId) AS viewsCount, (SELECT COUNT(*) FROM subjects WHERE c.courseId = courseId) AS lecturesCount, (SELECT SUM(minutes) FROM subjects WHERE c.courseId = courseId) AS courseMinutes, (SELECT name FROM instructor WHERE c.instructorId = instructorId) AS instructorName, (SELECT COUNT(*) FROM comments WHERE c.courseId = courseId) AS commentsCount, (SELECT COUNT(*) FROM favourites WHERE c.courseId = courseId AND userId='"+userId+"') AS favCount, (SELECT COUNT(*) FROM subscriptions WHERE c.courseId = courseId AND userId='"+userId+"' AND (subscribedOn+INTERVAL c.duration DAY) > CURRENT_TIMESTAMP()) AS subscribed FROM courses c WHERE c.status='ACTIVE' AND c.price='FREE' AND c.type='TEST'"+ limit;
					dbConnection.query(sql, function (error, results, fields) {
						if (error) {
							return wCB(error);
						}
						courses.topFreeTests = results;
						wCB();
					});
				} else {
					wCB();
				}
			},
			function (wCB) {
				res.status(200).send(courses);
			}
		], function (err) {
			// If we pass first paramenter as error this function will execute.
			res.status(500).send(err);
		});
		
	});

	/*Get courses/tests list based on keywords*/
	app.get('/search', function (req, res) {
		var query = '%';
		var userId = req.query.userId || '';
		var sql = "SELECT c.*, (SELECT COUNT(*) FROM likes WHERE c.courseId = courseId) AS likesCount, (SELECT COUNT(*) FROM views WHERE c.courseId = courseId) AS viewsCount, (SELECT COUNT(*) FROM subjects WHERE c.courseId = courseId) AS lecturesCount, (SELECT SUM(minutes) FROM subjects WHERE c.courseId = courseId) AS courseMinutes, (SELECT name FROM instructor WHERE c.instructorId = instructorId) AS instructorName, (SELECT COUNT(*) FROM comments WHERE c.courseId = courseId) AS commentsCount, (SELECT COUNT(*) FROM favourites WHERE c.courseId = courseId AND userId='"+userId+"') AS favCount, (SELECT COUNT(*) FROM subscriptions WHERE c.courseId = courseId AND userId='"+userId+"' AND (subscribedOn+INTERVAL c.duration DAY) > CURRENT_TIMESTAMP()) AS subscribed FROM courses c WHERE c.status='ACTIVE' AND ("
		var q = req.query.q.split('|');
		for(var i=0; i<q.length; i++) {
			sql = sql + " c.title LIKE '%"+q[i]+"%'  OR";
			sql = sql + " c.category LIKE '%"+q[i]+"%'  OR";
			sql = sql + " c.type LIKE '%"+q[i]+"%'  OR";
			sql = sql + " c.description LIKE '%"+q[i]+"%'  OR";
		}
		sql = sql.substring(0, sql.length-3);
		sql = sql + ")";
		try {
			dbConnection.query(sql, function (error, results, fields) {
				if (error) {
					console.log(error);
					res.status(500).send("Internal Server Error.");
					return;
				}
				res.status(200).send(results);
			});				
		} catch(e) {
			res.status(500).send("Internal Server Error.");
		}
	});

	/*Get favourites courses list*/
	app.get('/favourites', function (req, res) {
		var userId = req.query.userId;
		if(!userId) {
			res.status(400).send("Bad Request. UserId should not be empty.");
		}
		var sql = "SELECT c.*, (SELECT COUNT(*) FROM likes WHERE c.courseId = courseId) AS likesCount, (SELECT COUNT(*) FROM views WHERE c.courseId = courseId) AS viewsCount, (SELECT COUNT(*) FROM subjects WHERE c.courseId = courseId) AS lecturesCount, (SELECT SUM(minutes) FROM subjects WHERE c.courseId = courseId) AS courseMinutes, (SELECT name FROM instructor WHERE c.instructorId = instructorId) AS instructorName, (SELECT COUNT(*) FROM comments WHERE c.courseId = courseId) AS commentsCount, (SELECT COUNT(*) FROM favourites WHERE c.courseId = courseId) AS favCount, (SELECT COUNT(*) FROM subscriptions WHERE c.courseId = courseId AND userId='"+userId+"' AND (subscribedOn+INTERVAL c.duration DAY) > CURRENT_TIMESTAMP()) AS subscribed FROM courses c WHERE c.status='ACTIVE' AND (SELECT COUNT(*) from favourites f where f.courseId=c.courseId AND f.userId=?)";
		try {
			dbConnection.query(sql, [userId], function (error, results, fields) {
				if (error) {
					console.log(error);
					res.status(500).send("Internal Server Error.");
					return;
				}
				res.status(200).send(results);
			});				
		} catch(e) {
			res.status(500).send("Internal Server Error.");
		}
	});

	/* Create favourites */
	app.put('/favourites', function (req, res) {
		var favourite = req.body;
		if(!favourite.userId || !favourite.courseId) {
			res.status(400).send("Bad Request. Parameters mismatched.");
			return;
		};
		try {
			dbConnection.query('INSERT INTO favourites SET ?', favourite, function (error, results, fields) {
				if (error) {
					res.status(500).send('Internal Server Error.');
					return;
				}
				res.status(200).send(results);
			});
		} catch(e) {
			res.status(500).send("Internal Server Error.");
		}
	});
	
	/* delete favourite based on favouriteId */
	app.delete('/favourites', function (req, res) {
		var favourite = req.body;
		if(!favourite.userId || !favourite.courseId) {
			res.status(400).send("Bad Request. Parameters mismatched.");
			return;
		};
		try {
			dbConnection.query('DELETE FROM favourites WHERE userId = ? AND courseId = ?', [favourite.userId, favourite.courseId], function (error, results, fields) {
				if (error) {
					res.status(500).send('Internal Server Error.');
					return;
				}
				res.status(200).send(results);
			});

		} catch(e) {
			res.status(500).send("Internal Server Error.");
		}
	});
	
	/*Get cart courses list*/
	app.get('/cart', function (req, res) {
		var userId = req.query.userId;
		if(!userId) {
			res.status(400).send("Bad Request. UserId should not be empty.");
		}
		try {
			dbConnection.query("SELECT c.*, ct.* FROM courses c, cart ct WHERE c.courseId=ct.courseId AND c.status='ACTIVE' AND ct.userId=? GROUP BY ct.courseId", [userId], function (error, results, fields) {
				if (error) {
					console.log(error);
					res.status(500).send(error);
					return;
				}
				res.status(200).send(results);
			});				
		} catch(e) {
			res.status(500).send(e);
		}
	});
	
	/* Create cart */
	app.put('/cart', function (req, res) {
		var cart = req.body;
		if(!cart.userId || !cart.courseId) {
			res.status(400).send("Bad Request. UserId/CourseId should not be blank.");
			return;
		};
		try {
			dbConnection.query('SELECT COUNT(*) AS cartCount FROM cart WHERE cart.userId=? AND cart.courseId=?', [cart.userId, cart.courseId], function (error, results, fields) {
				if (error) {
					res.status(500).send(error);
					return;
				}
				if(results[0].cartCount) {
					res.status(200).send({res:'ALREADYADDED'});
					return;
				}
				dbConnection.query('INSERT INTO cart SET ?', cart, function (error, results, fields) {
					if (error) {
						res.status(500).send(error);
						return;
					}
					res.status(200).send({res:'ADDED'});
				});
			});
		} catch(e) {
			res.status(500).send(e);
		}
	});
	
	/* delete cart based on cartId */
	app.delete('/cart', function (req, res) {
		var cart = req.query;
		if(!cart.userId || !cart.courseId) {
			res.status(400).send("Bad Request. UserId/CourseId should not be blank.");
			return;
		};
		try {
			dbConnection.query('DELETE FROM cart WHERE userId = ? AND courseId = ?', [cart.userId, cart.courseId], function (error, results, fields) {
				if (error) {
					res.status(500).send(error);
					return;
				}
				res.status(200).send(results);
			});

		} catch(e) {
			res.status(500).send(e);
		}
	});
	
	/* Create free subscribtions */
	app.put('/freesubscribtions', function (req, res) {
		var subscriptions = req.body;
		if(!subscriptions.userId || !subscriptions.courseId) {
			res.status(400).send("Bad Request. UserId/CourseId should not be blank.");
			return;
		};
		try {
			//To check already the course is subscribed or not
			dbConnection.query("SELECT c.courseId, (SELECT COUNT(*) FROM subscriptions WHERE c.courseId = courseId AND userId=? AND (subscribedOn+INTERVAL c.duration DAY) > CURRENT_TIMESTAMP()) AS subscribed FROM courses c WHERE c.status='ACTIVE' AND c.courseId=?", [subscriptions.userId, subscriptions.courseId], function (error, results, fields) {
				if (error) {
					res.status(500).send(error);
					return;
				}
				if(results.length && results[0].subscribed) {
					res.status(200).send({'results':'ALREADYSUBSCRIBED'});
					return;
				}
				dbConnection.query("INSERT INTO subscriptions (courseId, userId, status) VALUES (?, ?, ?)", [subscriptions.courseId, subscriptions.userId, subscriptions.status], function (error, results, fields) {
					if (error) {
						res.status(500).send(error);
						return;
					}
					res.status(200).send(results);
				});
			});
		} catch(e) {
			res.status(500).send(e);
		}
	});

	/*Get subscribed courses list*/
	app.get('/mysubscriptions', function (req, res) {
		var q = req.query.q || '';
		var userId = req.query.userId;
		var limit = '';
		if(req.query.limit) {
			limit = ' LIMIT 0, ' + req.query.limit;
		}
		var courses = {
			topPaidCourses: '',
			topFreeCourses: '',
			topPaidTests: '',
			topFreeTests: ''
		}
		if(!userId) {
			res.status(400).send("Bad Request. UserId should not be empty.");
		}
		try {
			async.waterfall([
				function (wCB) {
					if(q=='all' || q=='' || q=='topPaidCourses') {
						dbConnection.query("SELECT c.*, (SELECT COUNT(*) FROM likes WHERE c.courseId = courseId) AS likesCount, (SELECT COUNT(*) FROM views WHERE c.courseId = courseId) AS viewsCount, (SELECT COUNT(*) FROM subjects WHERE c.courseId = courseId) AS lecturesCount, (SELECT SUM(minutes) FROM subjects WHERE c.courseId = courseId) AS courseMinutes, (SELECT name FROM instructor WHERE c.instructorId = instructorId) AS instructorName, (SELECT COUNT(*) FROM comments WHERE c.courseId = courseId) AS commentsCount, s.subscriptionId, s.subscribedOn, s.paymentId, (subscribedOn+INTERVAL 100 DAY) > CURRENT_TIMESTAMP() AS enabled FROM courses c, subscriptions s WHERE c.status='ACTIVE' AND c.price='PAID' AND c.type='COURSE' AND c.courseId=s.courseId AND s.userId=? " + limit, [userId], function (error, results, fields) {
							if (error) {
								return wCB(error);
							}
							courses.topPaidCourses = results;
							wCB();
						});
					} else {
						wCB();
					}
				},
				function (wCB) {
					if(q=='all' || q=='' || q=='topFreeCourses') {
						dbConnection.query("SELECT c.*, (SELECT COUNT(*) FROM likes WHERE c.courseId = courseId) AS likesCount, (SELECT COUNT(*) FROM views WHERE c.courseId = courseId) AS viewsCount, (SELECT COUNT(*) FROM subjects WHERE c.courseId = courseId) AS lecturesCount, (SELECT SUM(minutes) FROM subjects WHERE c.courseId = courseId) AS courseMinutes, (SELECT name FROM instructor WHERE c.instructorId = instructorId) AS instructorName, (SELECT COUNT(*) FROM comments WHERE c.courseId = courseId) AS commentsCount, s.subscriptionId, s.subscribedOn, s.paymentId, (subscribedOn+INTERVAL 100 DAY) > CURRENT_TIMESTAMP() AS enabled FROM courses c, subscriptions s WHERE c.status='ACTIVE' AND c.price='FREE' AND c.type='COURSE' AND c.courseId=s.courseId AND s.userId=? " + limit, [userId], function (error, results, fields) {
							if (error) {
								return wCB(error);
							}
							courses.topFreeCourses = results;
							wCB();
						});
					} else {
						wCB();
					}
				},
				function (wCB) {
					if(q=='all' || q=='' || q=='topPaidTests') {
						dbConnection.query("SELECT c.*, (SELECT COUNT(*) FROM likes WHERE c.courseId = courseId) AS likesCount, (SELECT COUNT(*) FROM views WHERE c.courseId = courseId) AS viewsCount, (SELECT COUNT(*) FROM subjects WHERE c.courseId = courseId) AS lecturesCount, (SELECT SUM(minutes) FROM subjects WHERE c.courseId = courseId) AS courseMinutes, (SELECT name FROM instructor WHERE c.instructorId = instructorId) AS instructorName, (SELECT COUNT(*) FROM comments WHERE c.courseId = courseId) AS commentsCount, s.subscriptionId, s.subscribedOn, s.paymentId, (subscribedOn+INTERVAL 100 DAY) > CURRENT_TIMESTAMP() AS enabled FROM courses c, subscriptions s WHERE c.status='ACTIVE' AND c.price='PAID' AND c.type='TEST' AND c.courseId=s.courseId AND s.userId=? " + limit, [userId], function (error, results, fields) {
							if (error) {
								return wCB(error);
							}
							courses.topPaidTests = results;
							wCB();
						});
					} else {
						wCB();
					}
				},
				function (wCB) {
					if(q=='all' || q=='' || q=='topFreeTests') {
						dbConnection.query("SELECT c.*, (SELECT COUNT(*) FROM likes WHERE c.courseId = courseId) AS likesCount, (SELECT COUNT(*) FROM views WHERE c.courseId = courseId) AS viewsCount, (SELECT COUNT(*) FROM subjects WHERE c.courseId = courseId) AS lecturesCount, (SELECT SUM(minutes) FROM subjects WHERE c.courseId = courseId) AS courseMinutes, (SELECT name FROM instructor WHERE c.instructorId = instructorId) AS instructorName, (SELECT COUNT(*) FROM comments WHERE c.courseId = courseId) AS commentsCount, s.subscriptionId, s.subscribedOn, s.paymentId, (subscribedOn+INTERVAL 100 DAY) > CURRENT_TIMESTAMP() AS enabled FROM courses c, subscriptions s WHERE c.status='ACTIVE' AND c.price='FREE' AND c.type='TEST' AND c.courseId=s.courseId AND s.userId=? " + limit, [userId], function (error, results, fields) {
							if (error) {
								return wCB(error);
							}
							courses.topFreeTests = results;
							wCB();
						});
					} else {
						wCB();
					}
				},
				function (wCB) {
					res.status(200).send(courses);
				}
			], function (err) {
				// If we pass first paramenter as error this function will execute.
				res.status(500).send(err);
			});
			
		} catch(e) {
			res.status(500).send("Internal Server Error.");
		}
	});

}

/*
	Test Tree
	---------------
	Course
	- tests
	---- questions
	------- answers
	
	subscriptions
	while starting tests first time:
	- assigntests
	--- answershistory
	
	course tree
	-----------------
	Course
	-- Sujects
	----- Videos
	----- attachments
	
	Subscriptions:
	--------------
		coursehistory
	
	Common:
	-------
	- users
	- admin
	- category
	- likes
	- views
	- comments
	- shreas
	- favourites
	- cart
	- instructor
	- payments
	- promotions
	- tokens
	- cities
	
	need to delete below tables:
	----------------------------
	- assigneprojects
	- banks
	- projects
	- projectsassets
	- servicerewards
	- spendmoney
	- team

	answer sates:
	------------
	C - correct 
	W - Wrong

*/
