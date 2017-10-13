
exports.projectsAPI = function(app, dbConnection, validate, multer, path, nesting, async, moment, transporter, emails) {
	
	const MAX_FILE_SIZE = 50*1024*1024;
	
	var storage = multer.diskStorage({
		destination: function (req, file, callback) {
			if(['.jpg','.png','.jpeg'].indexOf(path.extname(file.originalname)) == -1) {
				callback(new Error('FileUpload: Invalid Extension.', null));
			} else {
				callback(null, 'public/uploads');
			}
		},
		filename: function (req, file, callback) {
			callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
		}
	});
	
	/*create project*/
	app.put('/projects', function (req, res) {
		var upload = multer({
			storage: storage, 
			limits: {fileSize: MAX_FILE_SIZE}
		}).single('posterImg');

		upload(req, res, function (err, success) {
			if (err) {
				console.log(err);
				res.status(500).send('Error Uploading file. Invalid file format/exceeded file size/Internal Server error.');
				return;
			}
			var project = req.body;
			if(req.file) {
				project.coverImage = req.file.filename;
			}
			console.log(project);
			if(!project.title || !project.category || !project.location || !project.description || !project.userId) {
				res.status(400).send("Bad Request. PosterImage/Title/Category/Location/Description/UserId should not be empty.");
				return;
			};
			if(project.email && !validate.validateEmail(project.email)) {
				res.status(400).send("Invalid Email.");
				return;
			}
			if(project.otherCategory) {
				project.category = project.category + '|' +project.otherCategory;
				delete project.otherCategory;
			}
			if(project.location.display) {
				project.location = project.location.display;
			}
			try {
				dbConnection.query('INSERT INTO projects SET ?', project, function (error, results, fields) {
					if (error) {
						res.status(500).send(error.code);
						return;
					}
					results.coverImage = project.coverImage;
					emails.sendEmails(app, transporter, 'start-project.ejs', project.email, 'You’ve started a project on Back Me!', function(info) {
						console.log(info);
					});
					res.status(200).send(results);
				});
			} catch(e) {
				res.status(500).send("Internal Server Error.");
			}
		});
		
	});

	/* Upload team Images/details */
	app.post('/uploadTeam', function (req, res) {
		var upload = multer({
			storage: storage, 
			limits: {fileSize: MAX_FILE_SIZE}
		}).single('picture');

		upload(req, res, function (err, success) {
			if (err) {
				console.log(err);
				res.status(500).send('Error Uploading file. Invalid file format/exceeded file size/Internal Server error.');
				return;
			}
			var project = req.body;

			if(!project.projectId || !project.userId || !req.file) {
				res.status(400).send("Bad Request. Project ID/User ID/Picture should not be blank.");
				return;
			};
			var teams = {
				teamData: [],
				teamTempId: project.teamTempId
			};
			teams.teamData.push([project.projectId, project.userId, project.name, req.file.filename, project.designation, project.profileLink]);
			try {
				dbConnection.query('INSERT INTO team (projectId, userId, name, picture, designation, profileLink) VALUES ?', [teams.teamData], function (error, results, fields) {
					if (error) {
						res.status(500).send(error);
						return;
					}
					teams.teamData[0].push(results.insertId);
					res.status(200).send(teams);
					return;
				});
			} catch(e) {
				console.log(e);
				res.status(500).send("Internal Server Error.");
			}
		});
	});
	
	/* Upload project Images */
	app.post('/projectImages', function (req, res) {
		var upload = multer({
			storage: storage, 
			limits: {fileSize: MAX_FILE_SIZE}
		}).fields([{name: 'projectImages', maxCount: 8}]);

		upload(req, res, function (err, success) {
			if (err) {
				console.log(err);
				res.status(500).send('Error Uploading file. Invalid file format/exceeded file size/Internal Server error.');
				return;
			}
			var project = req.body;
			if(req.files && req.files.posterImg) {
				project.coverImage = req.files.posterImg[0].filename;
			}
			if(!project.projectId || !project.userId) {
				res.status(400).send("Bad Request. Project ID/User ID should not be blank.");
				return;
			};
			var projectAssets = [];
			if(req.files && req.files.projectImages) {
				for(i in req.files.projectImages) {
					projectAssets.push([project.projectId, project.userId, req.files.projectImages[i].mimetype, req.files.projectImages[i].filename]);
				}
			}
			try {
				dbConnection.query('INSERT INTO projectsassets (projectId, userId, type, location) VALUES ?', [projectAssets], function (error, results, fields) {
					if (error) {
						res.status(500).send(error.code=='ER_DUP_ENTRY'?'Email already found.':error.code);
						return;
					}
					projectAssets[0].push(results.insertId);
					res.status(200).send(projectAssets);
					return;
				});
			} catch(e) {
				console.log(e);
				res.status(500).send("Internal Server Error.");
			}
		});
	});
	
	/* delete project Images */
	app.delete('/deleteAssets', function (req, res) {
		var asset = req.body;
		if(!asset.length) {
			res.status(400).send("Bad Request. Asset ID should not be blank.");
			return;
		};
		//DELETE FROM projectsassets WHERE assetId = 512 OR assetId=503
		var sql = "DELETE FROM projectsassets WHERE"
		for(var i=0; i<asset.length; i++) {
			sql = sql + " assetId="+asset[i]+" OR";
		}
		sql = sql.substring(0, sql.length-3);
		try {
			dbConnection.query(sql, function (error, results, fields) {
				if (error) {
					res.status(500).send(error);
					return;
				}
				res.status(200).send(asset);
				return;
			});
		} catch(e) {
			console.log(e);
			res.status(500).send("Internal Server Error.");
		}
	});
	
	/*Update project*/
	app.post('/projects', function (req, res) {
		var upload = multer({
			storage: storage, 
			limits: {fileSize: MAX_FILE_SIZE}
		}).fields([{name: 'posterImg', maxCount: 1}, {name: 'userImg', maxCount: 1}]);

		upload(req, res, function (err, success) {
			if (err) {
				console.log(err);
				res.status(500).send('Error Uploading file. Invalid file format/exceeded file size/Internal Server error.');
				return;
			}
			var project = req.body;
			console.log(project);
			if(req.files && req.files.posterImg) {
				project.coverImage = req.files.posterImg[0].filename;
			}
			if(req.files && req.files.userImg) {
				project.userPhoto = req.files.userImg[0].filename;
			}
			if(!project.projectId) {
				res.status(400).send("Bad Request. Project ID should not be blank.");
				return;
			};
			if(project.email && !validate.validateEmail(project.email)) {
				res.status(400).send("Invalid Email.");
				return;
			}
			
			if(project.endByDate) {
				project.endByDate = moment(project.endByDate).format('YYYY-MM-DD HH:mm:ss');
			}
			try {
				var spendmoney, projectsassets,supportrewards,servicerewards,team;
				if(project.spendmoney) {
					spendmoney = project.spendmoney;
					delete project.spendmoney;
				}
				if(project.projectsassets) {
					projectsassets = project.projectsassets;
					delete project.projectsassets;	
				}
				if(project.supportrewards) {
					supportrewards = project.supportrewards;
					delete project.supportrewards;	
				}
				if(project.servicerewards) {
					servicerewards = project.servicerewards;
					delete project.servicerewards;	
				}
				if(project.team) {
					team = project.team;
					delete project.team;	
				}
				if(project.projectImages) {
					delete project.projectImages;	
				}
				if(project.remaindayshours) {
					delete project.remaindayshours;	
				}
				if(project.likes) {
					delete project.likes;	
				}
				if(project.otherCategory) {
					project.category = project.category + '|' +project.otherCategory;
					delete project.otherCategory;
				}
				if(project.location.display) {
					project.location = project.location.display;
				}
				async.waterfall([
					function (wCB) {
						if(project.status == 'ACTIVE') {
							console.log('project', project.projectId);
							var adminId = 1;
							var currentTimestamp = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
							dbConnection.query('SELECT a.adminId, COUNT(ap.assignId) as assignCount from admin a LEFT JOIN assignprojects ap ON a.adminId = ap.adminId WHERE a.role="ADMIN" GROUP BY a.adminId ORDER BY assignCount LIMIT 1', function (error, results, fields) {
								if (error) {
									return wCB(error);
								}
								console.log('results', results[0].adminId);
								if(results && results[0].adminId) {
									adminId = results[0].adminId;
								}
								dbConnection.query("INSERT INTO assignprojects (projectId, userId, adminId, status, reviewedDate, comments) VALUES (?,?,?,?,?,?)", [project.projectId, project.userId, adminId, 'ACTIVE', currentTimestamp, 'project is LIVE without the admin approval.'], function (error, results, fields) {
									if (error) {
										return wCB(error);
									}
									console.log('Project assigned to admin.')
									wCB();
								});
							});
							
						} else {
							wCB();
						}
					},
					function (wCB) {
						dbConnection.query('UPDATE projects SET ? WHERE projectId=?', [project, project.projectId], function (error, results, fields) {
							if (error) {
								return wCB(error);
							}
							if(project.status == 'ACTIVE') {
								emails.sendEmails(app, transporter, 'project-complete-pending.ejs', project.email, 'You’ve submitted a new project!', function(info) {
									console.log(info);
								});
								emails.sendEmails(app, transporter, 'project-complete-active.ejs', project.email, 'Happy, your project is live', function(info) {
									console.log(info);
								});
							}
							wCB();
						});
					},
					function (wCB) {
						if(team) {
							var teamData = [];
							for(i in team) {
								teamData.push([team[i].projectId, team[i].userId, team[i].name, team[i].picture, team[i].designation, team[i].profileLink]);
							}
							dbConnection.query('DELETE FROM team WHERE projectId=?', project.projectId, function (error, results, fields) {
								if (error) {
									return wCB(error);
								}
								dbConnection.query('INSERT INTO team (projectId, userId, name, picture, designation, profileLink) VALUES ?', [teamData], function (error, results, fields) {
									if (error) {
										return wCB(error);
									}
									wCB();
								});
							});
						} else {
							dbConnection.query('DELETE FROM team WHERE projectId=?', project.projectId, function (error, results, fields) {
								if (error) {
									return wCB(error);
								}
								wCB();
							});
						}
					},
					function (wCB) {
						if(spendmoney) {
							var spendMoneyData = [];
							for(i in spendmoney) {
								spendMoneyData.push([spendmoney[i].projectId, spendmoney[i].userId, spendmoney[i].amount, spendmoney[i].description]);
							}
							dbConnection.query('DELETE FROM spendmoney WHERE projectId=?', project.projectId, function (error, results, fields) {
								if (error) {
									return wCB(error);
								}
								dbConnection.query('INSERT INTO spendmoney (projectId, userId, amount, description) VALUES ?', [spendMoneyData], function (error, results, fields) {
									if (error) {
										return wCB(error);
									}
									wCB();
								});
							});
						} else {
							wCB();
						}				
					},
					function (wCB) {
						if(supportrewards) {
							var supportRewardsData = [];
							for(i in supportrewards) {
								supportRewardsData.push([supportrewards[i].projectId, supportrewards[i].userId, supportrewards[i].amount, supportrewards[i].title, supportrewards[i].description]);
							}
							dbConnection.query('DELETE FROM supportrewards WHERE projectId=?', project.projectId, function (error, results, fields) {
								if (error) {
									return wCB(error);
								}
								dbConnection.query('INSERT INTO supportrewards (projectId, userId, amount, title, description) VALUES ?', [supportRewardsData], function (error, results, fields) {
									if (error) {
										return wCB(error);
									}
									wCB();
								});
							});
						} else {
							wCB();
						}				
					},
					function (wCB) {
						if(servicerewards) {
							var servicerewardsData = [];
							for(i in servicerewards) {
								if(servicerewards[i].amount == 'NaN') servicerewards[i].amount = '0';
								servicerewardsData.push([servicerewards[i].projectId, servicerewards[i].userId, servicerewards[i].amount, servicerewards[i].activityName, servicerewards[i].availableDate, servicerewards[i].description]);
							}
							dbConnection.query('DELETE FROM servicerewards WHERE projectId=?', project.projectId, function (error, results, fields) {
								if (error) {
									return wCB(error);
								}
								dbConnection.query('INSERT INTO servicerewards (projectId, userId, amount, activityName, availableDate, description) VALUES ?', [servicerewardsData], function (error, results, fields) {
									if (error) {
										return wCB(error);
									}
									wCB();
								});
							});
						} else {
							wCB();
						}				
					},
					function (wCB) {
						res.status(200).send(project);
					}
				], function (err) {
					// If we pass first paramenter as error this function will execute.
					console.log(err);
					res.status(500).send(err.code?err.code:"Internal Server Error.");
				});

			} catch(e) {
				console.log(e);
				res.status(500).send("Internal Server Error.");
			}
		});
	});

	
	/*Get All projects*/
	app.get('/projects', function (req, res) {
		try {
			dbConnection.query({sql: 'SELECT *, TIMESTAMPDIFF(HOUR,CURDATE(),endByDate) as remainHours, \
					TIMESTAMPDIFF(DAY,CURDATE(),endByDate) as remainDays, TIMESTAMPDIFF(DAY,createdDate,endByDate) as totalDays, (SELECT COUNT(*) from likes l where l.projectId=projects.projectId) AS likesCount, (SELECT COUNT(*) from likes al where al.projectId=projects.projectId AND al.userId=?) AS alreadyLiked, (SELECT COUNT(*) from views v where v.projectId=projects.projectId) AS viewsCount, (SELECT COUNT(*) from payments p where p.projectId=projects.projectId AND txnStatus="TXN_SUCCESS") AS supportersCount FROM projects \
					LEFT JOIN spendmoney ON (projects.projectId = spendmoney.projectId) \
					LEFT JOIN projectsassets ON (projects.projectId = projectsassets.projectId) \
					LEFT JOIN servicerewards ON (projects.projectId = servicerewards.projectId) \
					LEFT JOIN supportrewards ON (projects.projectId = supportrewards.projectId) \
					LEFT JOIN team ON (projects.projectId = team.projectId) \
					LEFT JOIN (SELECT orderId, projectId, COALESCE(SUM(amount),0) as amount, count(orderId) as count FROM payments WHERE txnStatus="TXN_SUCCESS" GROUP BY projectId) payments ON (projects.projectId = payments.projectId) \
					WHERE projects.STATUS = "ACTIVE" AND projects.endByDate >= CURDATE()', nestTables: true}, [userId], function (error, results, fields) {
				var nestingOptions = [
					{ tableName : 'projects', pkey: 'projectId', fkeys:[{table:'spendmoney',col:'projectId'}, {table:'projectsassets',col:'projectId'}, {table:'servicerewards',col:'projectId'}, {table:'supportrewards',col:'projectId'}, {table:'team',col:'projectId'}, {table:'remaindayshours',col:'projectId'}, {table:'payments',col:'projectId'}]},
					{ tableName : 'spendmoney', pkey: 'spendId'},
					{ tableName : 'projectsassets', pkey: 'assetId'},
					{ tableName : 'servicerewards', pkey: 'serviceId'},
					{ tableName : 'supportrewards', pkey: 'supportId'},
					{ tableName : 'team', pkey: 'teamtId'},
					{ tableName : 'remaindayshours', pkey: 'remainId'},
					{ tableName : 'payments', pkey: 'orderId'}
				];
				var nestedRows = nesting.convertToNested(results, nestingOptions);
				if (error) {
					res.status(500).send("Internal Server Error.");
					return;
				}
				res.status(200).send(nestedRows);
			});
		} catch(e) {
			console.log(e);
			res.status(500).send("Internal Server Error.");
		}
	});
	
	/*Get Specific project by ACTIVE status and by userId details*/
	app.get('/projects/:projectId', function (req, res) {
		var projectId = req.params.projectId;
		var userId = 0;
		if(req.query.userId)
			userId = req.query.userId;
		try {
			if(projectId) {
				dbConnection.query({sql: 'SELECT *, TIMESTAMPDIFF(HOUR,CURDATE(),endByDate) as remainHours, \
					TIMESTAMPDIFF(DAY,CURDATE(),endByDate) as remainDays, TIMESTAMPDIFF(DAY,createdDate,endByDate) as totalDays, (SELECT COUNT(*) from likes l where l.projectId=projects.projectId) AS likesCount, (SELECT COUNT(*) from likes al where al.projectId=projects.projectId AND al.userId=?) AS alreadyLiked, (SELECT COUNT(*) from views v where v.projectId=projects.projectId) AS viewsCount, (SELECT COUNT(*) from payments p where p.projectId=projects.projectId AND txnStatus="TXN_SUCCESS") AS supportersCount FROM projects \
					LEFT JOIN spendmoney ON (projects.projectId = spendmoney.projectId) \
					LEFT JOIN projectsassets ON (projects.projectId = projectsassets.projectId) \
					LEFT JOIN servicerewards ON (projects.projectId = servicerewards.projectId) \
					LEFT JOIN supportrewards ON (projects.projectId = supportrewards.projectId) \
					LEFT JOIN team ON (projects.projectId = team.projectId) \
					LEFT JOIN (SELECT orderId, projectId, COALESCE(SUM(amount),0) as amount, count(orderId) as count FROM payments WHERE txnStatus="TXN_SUCCESS" GROUP BY projectId) payments ON (projects.projectId = payments.projectId) \
					LEFT JOIN (SELECT projectId, likeId, count(likeId) as likeCount, EXISTS(SELECT * FROM likes WHERE userId=?) as alreadyLiked  from likes WHERE projectId=?) likes ON (projects.projectId = likes.projectId) \
					WHERE projects.projectId=? AND projects.STATUS = "ACTIVE" AND projects.endByDate >= CURDATE()', nestTables: true}, [userId, userId, projectId, projectId], function (error, results, fields) {
					var nestingOptions = [
						{ tableName : 'projects', pkey: 'projectId', fkeys:[{table:'spendmoney',col:'projectId'}, {table:'projectsassets',col:'projectId'}, {table:'servicerewards',col:'projectId'}, {table:'supportrewards',col:'projectId'}, {table:'team',col:'projectId'}, {table:'remaindayshours',col:'projectId'}, {table:'payments',col:'projectId'}, {table:'likes',col:'projectId'}]},
						{ tableName : 'spendmoney', pkey: 'spendId'},
						{ tableName : 'projectsassets', pkey: 'assetId'},
						{ tableName : 'servicerewards', pkey: 'serviceId'},
						{ tableName : 'supportrewards', pkey: 'supportId'},
						{ tableName : 'team', pkey: 'teamId'},
						{ tableName : 'remaindayshours', pkey: 'remainId'},
						{ tableName : 'payments', pkey: 'orderId'},
						{ tableName : 'likes', pkey: 'likeId'}
					];
					var nestedRows = nesting.convertToNested(results, nestingOptions);
					if (error) {
						console.log(error);
						res.status(500).send("Internal Server Error.");
						return;
					}
					res.status(200).send(nestedRows.length ? nestedRows[0] : nestedRows);
				});
			}
		} catch(e) {
			console.log(e);
			res.status(500).send("Internal Server Error.");
		}
	});
	

	/*Get Specific project by projectId without any condition*/
	app.get('/getProjectDetails/:projectId', function (req, res) {
		var projectId = req.params.projectId;
		try {
			if(projectId) {
				dbConnection.query({sql: 'SELECT *, TIMESTAMPDIFF(HOUR,CURDATE(),endByDate) as remainHours, \
					TIMESTAMPDIFF(DAY,CURDATE(),endByDate) as remainDays, TIMESTAMPDIFF(DAY,createdDate,endByDate) as totalDays, (SELECT COUNT(*) from likes l where l.projectId=projects.projectId) AS likesCount, (SELECT COUNT(*) from likes al where al.projectId=projects.projectId) AS alreadyLiked, (SELECT COUNT(*) from views v where v.projectId=projects.projectId) AS viewsCount, (SELECT COUNT(*) from payments p where p.projectId=projects.projectId AND txnStatus="TXN_SUCCESS") AS supportersCount FROM projects \
					LEFT JOIN spendmoney ON (projects.projectId = spendmoney.projectId) \
					LEFT JOIN projectsassets ON (projects.projectId = projectsassets.projectId) \
					LEFT JOIN servicerewards ON (projects.projectId = servicerewards.projectId) \
					LEFT JOIN supportrewards ON (projects.projectId = supportrewards.projectId) \
					LEFT JOIN team ON (projects.projectId = team.projectId) \
					LEFT JOIN (SELECT orderId, projectId, COALESCE(SUM(amount),0) as amount, count(orderId) as count FROM payments WHERE txnStatus="TXN_SUCCESS" GROUP BY projectId) payments ON (projects.projectId = payments.projectId) \
					LEFT JOIN (SELECT projectId, likeId, count(likeId) as likeCount from likes WHERE projectId=?) likes ON (projects.projectId = likes.projectId) \
					WHERE projects.projectId=?', nestTables: true}, [projectId, projectId], function (error, results, fields) {
					var nestingOptions = [
						{ tableName : 'projects', pkey: 'projectId', fkeys:[{table:'spendmoney',col:'projectId'}, {table:'projectsassets',col:'projectId'}, {table:'servicerewards',col:'projectId'}, {table:'supportrewards',col:'projectId'}, {table:'team',col:'projectId'}, {table:'remaindayshours',col:'projectId'}, {table:'payments',col:'projectId'}, {table:'likes',col:'projectId'}]},
						{ tableName : 'spendmoney', pkey: 'spendId'},
						{ tableName : 'projectsassets', pkey: 'assetId'},
						{ tableName : 'servicerewards', pkey: 'serviceId'},
						{ tableName : 'supportrewards', pkey: 'supportId'},
						{ tableName : 'team', pkey: 'teamId'},
						{ tableName : 'remaindayshours', pkey: 'remainId'},
						{ tableName : 'payments', pkey: 'orderId'},
						{ tableName : 'likes', pkey: 'likeId'}
					];
					var nestedRows = nesting.convertToNested(results, nestingOptions);
					if (error) {
						console.log(error);
						res.status(500).send("Internal Server Error.");
						return;
					}
					res.status(200).send(nestedRows.length ? nestedRows[0] : nestedRows);
				});
			}
		} catch(e) {
			console.log(e);
			res.status(500).send("Internal Server Error.");
		}
	});

	/*Get Specific project by userId*/
/*	app.get('/projectsByUser', function (req, res) {
		var user = req.query;
		try {
			if(user.userId && user.status) {
				if(user.status == 'ALL') user.status = '%';
				dbConnection.query({sql: 'SELECT *, TIMESTAMPDIFF(HOUR,CURDATE(),endByDate) as remainHours, \
					TIMESTAMPDIFF(DAY,CURDATE(),endByDate) as remainDays, TIMESTAMPDIFF(DAY,createdDate,endByDate) as totalDays, (SELECT COUNT(*) from likes l where l.projectId=projects.projectId) AS likesCount, (SELECT COUNT(*) from likes al where al.projectId=projects.projectId AND al.userId=?) AS alreadyLiked, (SELECT COUNT(*) from views v where v.projectId=projects.projectId) AS viewsCount, (SELECT COUNT(*) from comments c where c.projectId=projects.projectId) AS commentsCount, (SELECT COUNT(*) from payments p where p.projectId=projects.projectId AND txnStatus="TXN_SUCCESS") AS supportersCount FROM projects \
					LEFT JOIN spendmoney ON projects.projectId = spendmoney.projectId \
					LEFT JOIN projectsassets ON projects.projectId = projectsassets.projectId \
					LEFT JOIN servicerewards ON projects.projectId = servicerewards.projectId \
					LEFT JOIN supportrewards ON projects.projectId = supportrewards.projectId \
					LEFT JOIN team ON (projects.projectId = team.projectId) \
					LEFT JOIN (SELECT orderId, projectId, COALESCE(SUM(amount),0) as amount, count(orderId) as count FROM payments WHERE txnStatus="TXN_SUCCESS" GROUP BY projectId) \
					payments ON (projects.projectId = payments.projectId) \
					WHERE projects.userId=? AND projects.status LIKE ? ORDER BY projects.projectId DESC', nestTables: true}, [user.userId, user.userId, user.status], function (error, results, fields) {
					var nestingOptions = [
						{ tableName : 'projects', pkey: 'projectId', fkeys:[{table:'spendmoney',col:'projectId'}, {table:'projectsassets',col:'projectId'}, {table:'servicerewards',col:'projectId'}, {table:'supportrewards',col:'projectId'}, {table:'team',col:'projectId'}, {table:'remaindayshours',col:'projectId'}, {table:'payments',col:'projectId'}]},
						{ tableName : 'spendmoney', pkey: 'spendId'},
						{ tableName : 'projectsassets', pkey: 'assetId'},
						{ tableName : 'servicerewards', pkey: 'serviceId'},
						{ tableName : 'supportrewards', pkey: 'supportId'},
						{ tableName : 'team', pkey: 'teamId'},
						{ tableName : 'remaindayshours', pkey: 'remainId'},
						{ tableName : 'payments', pkey: 'orderId'}
					];
					var nestedRows = nesting.convertToNested(results, nestingOptions);
					if (error) {
                        console.log(error)
						res.status(500).send("Internal Server Error.");
						return;
					}
					res.status(200).send(nestedRows);
				});				
			} else {
				res.status(404).send("Params mismacthed.");
			}
		} catch(e) {
            console.log(error)
			res.status(500).send("Internal Server Error.");
		}
	});*/
    

	/*Get projects list based on keywords*/
	/*app.get('/search', function (req, res) {
		var query = '%';
		var userId = req.query.userId || '';
		var sql = "SELECT p.projectId, p.title, p.category, p.coverImage, p.moneyNeeded, p.endByDate, p.createdDate, p.userId, p.name, p.userPhoto, TIMESTAMPDIFF(DAY,CURDATE(),p.endByDate) as remainDays, (SELECT COUNT(*) from likes l where l.projectId=p.projectId) AS likesCount, (SELECT COUNT(*) from views v where v.projectId=p.projectId) AS viewsCount, (SELECT COUNT(*) from shares s where s.projectId=p.projectId) AS sharesCount, (SELECT COUNT(*) from favourites f where f.projectId=p.projectId AND f.userId='"+userId+"') AS favCount, (SELECT COALESCE(SUM(amount),0) from payments pay where pay.projectId=p.projectId AND pay.txnStatus='TXN_SUCCESS') AS funded FROM projects p WHERE p.STATUS = 'ACTIVE' AND p.endByDate >= CURDATE() AND ("
		var q = req.query.q.split('|');
		for(var i=0; i<q.length; i++) {
			sql = sql + " p.title LIKE '%"+q[i]+"%'  OR";
			sql = sql + " p.category LIKE '%"+q[i]+"%'  OR";
			sql = sql + " p.name LIKE '%"+q[i]+"%'  OR";
			sql = sql + " p.location LIKE '%"+q[i]+"%'  OR";
			sql = sql + " p.description LIKE '%"+q[i]+"%'  OR";
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
	});*/
	
	/*Get favourites projects list*/
	app.get('/favProjects', function (req, res) {
		var userId = req.query.userId;
		if(!userId) {
			res.status(400).send("Bad Request. UserId should not be empty.");
		}
		var sql = "SELECT p.projectId, p.title, p.category, p.coverImage, p.moneyNeeded, p.endByDate, p.createdDate, p.userId, p.name, p.userPhoto, TIMESTAMPDIFF(DAY,CURDATE(),p.endByDate) as remainDays, (SELECT COUNT(*) from likes l where l.projectId=p.projectId) AS likesCount, (SELECT COUNT(*) from views v where v.projectId=p.projectId) AS viewsCount, (SELECT COUNT(*) from shares s where s.projectId=p.projectId) AS sharesCount, (SELECT COUNT(*) from favourites f where f.projectId=p.projectId) AS favCount, (SELECT COALESCE(SUM(amount),0) from payments pay where pay.projectId=p.projectId AND pay.txnStatus='TXN_SUCCESS') AS funded FROM projects p WHERE p.STATUS = 'ACTIVE' AND p.endByDate >= CURDATE() AND (SELECT COUNT(*) from favourites f where f.projectId=p.projectId AND f.userId=?)";
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

	/*Get Home Page Promotion projects list*/
	app.get('/homePagePromotion', function (req, res) {
		var sql = "SELECT p.projectId, p.title, p.category, p.coverImage, p.moneyNeeded, p.endByDate, p.createdDate, p.userId, p.name, p.userPhoto, p.about, TIMESTAMPDIFF(DAY,CURDATE(),p.endByDate) as remainDays, (SELECT COUNT(*) from likes l where l.projectId=p.projectId) AS likesCount, (SELECT COUNT(*) from views v where v.projectId=p.projectId) AS viewsCount, (SELECT COUNT(*) from shares s where s.projectId=p.projectId) AS sharesCount, (SELECT COUNT(*) from favourites f where f.projectId=p.projectId) AS favCount, (SELECT COALESCE(SUM(amount),0) from payments pay where pay.projectId=p.projectId AND pay.txnStatus='TXN_SUCCESS') AS funded FROM projects p WHERE p.STATUS = 'ACTIVE' AND p.endByDate >= CURDATE() AND p.projectId IN (select projectId from promotions WHERE type='HOME_PROMOTION' AND status='ACTIVE')";
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
	
	//Top donors for specific project. TODO: change the Limit value as per feedback. 
	app.get('/topDonors/:projectId', function (req, res) {
		var projectId = req.params.projectId;
		if(!projectId) {
			res.status(400).send("Bad Request: ProjectId should not be empty.");
			return;
		};
		try {
			dbConnection.query('SELECT projectId, firstName, lastName, amount, txnDate from payments WHERE projectId=? AND txnStatus="TXN_SUCCESS" AND purpose="DONATION" ORDER BY amount DESC LIMIT 5', [projectId], function (error, results, fields) {
				if (error) {
					console.log(error);
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
	
	//all the supporters for specific project
	app.get('/topSupporters/:projectId', function (req, res) {
		var projectId = req.params.projectId;
		if(!projectId) {
			res.status(400).send("Bad Request: ProjectId should not be empty.");
			return;
		};
		try {
			dbConnection.query('SELECT projectId, firstName, lastName, amount, txnDate from payments WHERE projectId=? AND txnStatus="TXN_SUCCESS" AND purpose="DONATION"', [projectId], function (error, results, fields) {
				if (error) {
					console.log(error);
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
		
	/*Get projects list for home page*/
	app.get('/bySocial', function (req, res) {
		var q = req.query.q || '';
		var limit = req.query.limit || '6';
		var userId = req.query.userId || '';
		var category = req.query.category || '';
		var projects = {
			latest: '',
			trending: '',
			popular: '',
			topfunded: '',
			hot: '',
			recommended: '',
			currentlywatched: ''
		}
		async.waterfall([
			function (wCB) {
				if(q=='all' || q=='' || q=='latest') {
					var sql = "SELECT p.projectId, p.title, p.category, p.coverImage, p.moneyNeeded, p.endByDate, p.createdDate, p.userId, p.name, p.userPhoto, TIMESTAMPDIFF(DAY,CURDATE(),p.endByDate) as remainDays, (SELECT COUNT(*) from likes l where l.projectId=p.projectId) AS likesCount, (SELECT COUNT(*) from views v where v.projectId=p.projectId) AS viewsCount, (SELECT COUNT(*) from shares s where s.projectId=p.projectId) AS sharesCount, (SELECT COALESCE(SUM(amount),0) from payments pay where pay.projectId=p.projectId AND pay.txnStatus='TXN_SUCCESS') AS funded, (SELECT COUNT(*) from favourites f where f.projectId=p.projectId AND f.userId='"+userId+"') AS favCount FROM projects p WHERE p.STATUS = 'ACTIVE' AND p.endByDate >= CURDATE() AND category LIKE '%"+category+"' ORDER BY p.projectId DESC LIMIT 0, " + limit;
					dbConnection.query(sql, function (error, results, fields) {
						if (error) {
							return wCB(error);
						}
						projects.latest = results;
						wCB();
					});
				} else {
					wCB();
				}
			},
			function (wCB) {
				if(q=='all' || q=='' || q=='trending') {
					var sql = "SELECT p.projectId, p.title, p.category, p.coverImage, p.moneyNeeded, p.endByDate, p.createdDate, p.userId, p.name, p.userPhoto, TIMESTAMPDIFF(DAY,CURDATE(),p.endByDate) as remainDays, (SELECT COUNT(*) from likes l where l.projectId=p.projectId) AS likesCount, (SELECT COUNT(*) from views v where v.projectId=p.projectId) AS viewsCount, (SELECT COUNT(*) from shares s where s.projectId=p.projectId) AS sharesCount, (SELECT COALESCE(SUM(amount),0) from payments pay where pay.projectId=p.projectId AND pay.txnStatus='TXN_SUCCESS') AS funded, (SELECT count(amount) from payments paycount where paycount.projectId=p.projectId AND paycount.txnStatus='TXN_SUCCESS') AS fundedCount, (SELECT SUM(likesCount+viewsCount)) AS socialCount, (SELECT COUNT(*) from favourites f where f.projectId=p.projectId AND f.userId='"+userId+"') AS favCount FROM projects p WHERE p.STATUS = 'ACTIVE' AND p.endByDate >= CURDATE() AND DATE(p.createdDate)<=DATE(NOW() - INTERVAL 15 DAY) AND category LIKE '%"+category+"' HAVING socialCount>0 ORDER BY socialCount DESC LIMIT 0, " + limit;
					dbConnection.query(sql, function (error, results, fields) {
						if (error) {
							return wCB(error);
						}
						projects.trending = results;
						wCB();
					});
				} else {
					wCB();
				}
			},
			function (wCB) {
				if(q=='all' || q=='' || q=='popular') {
					var sql = "SELECT p.projectId, p.title, p.category, p.coverImage, p.moneyNeeded, p.endByDate, p.createdDate, p.userId, p.name, p.userPhoto, TIMESTAMPDIFF(DAY,CURDATE(),p.endByDate) as remainDays, (SELECT COUNT(*) from likes l where l.projectId=p.projectId) AS likesCount, (SELECT COUNT(*) from views v where v.projectId=p.projectId) AS viewsCount, (SELECT COUNT(*) from shares s where s.projectId=p.projectId) AS sharesCount, (SELECT COALESCE(SUM(amount),0) from payments pay where pay.projectId=p.projectId AND pay.txnStatus='TXN_SUCCESS') AS funded, (SELECT count(amount) from payments paycount where paycount.projectId=p.projectId AND paycount.txnStatus='TXN_SUCCESS') AS fundedCount, (SELECT SUM(likesCount+viewsCount+sharesCount+fundedCount)) AS socialCount, (SELECT COUNT(*) from favourites f where f.projectId=p.projectId AND f.userId='"+userId+"') AS favCount FROM projects p WHERE p.STATUS = 'ACTIVE' AND p.endByDate >= CURDATE() AND category LIKE '%"+category+"' HAVING socialCount>0 ORDER BY socialCount DESC LIMIT 0, " + limit;
					dbConnection.query(sql, function (error, results, fields) {
						if (error) {
							return wCB(error);
						}
						projects.popular = results;
						wCB();
					});
				} else {
					wCB();
				}
			},
			function (wCB) {
				if(q=='all' || q=='' || q=='topfunded') {
					var sql = "SELECT p.projectId, p.title, p.category, p.coverImage, p.moneyNeeded, p.endByDate, p.createdDate, p.userId, p.name, p.userPhoto, TIMESTAMPDIFF(DAY,CURDATE(),p.endByDate) as remainDays, (SELECT COUNT(*) from likes l where l.projectId=p.projectId) AS likesCount, (SELECT COUNT(*) from views v where v.projectId=p.projectId) AS viewsCount, (SELECT COUNT(*) from shares s where s.projectId=p.projectId) AS sharesCount, (SELECT COALESCE(SUM(amount),0) from payments pay where pay.projectId=p.projectId AND pay.txnStatus='TXN_SUCCESS') AS funded, (SELECT count(amount) from payments paycount where paycount.projectId=p.projectId AND paycount.txnStatus='TXN_SUCCESS') AS fundedCount, (SELECT SUM(likesCount+viewsCount+sharesCount+fundedCount)) AS socialCount, (SELECT COUNT(*) from favourites f where f.projectId=p.projectId AND f.userId='"+userId+"') AS favCount FROM projects p WHERE p.STATUS = 'ACTIVE' AND p.endByDate >= CURDATE() AND category LIKE '%"+category+"' HAVING funded>0 ORDER BY funded DESC LIMIT 0, " + limit;
					dbConnection.query(sql, function (error, results, fields) {
						if (error) {
							return wCB(error);
						}
						projects.topfunded = results;
						wCB();
					});
				} else {
					wCB();
				}
			},
			function (wCB) {
				if(q=='all' || q=='' || q=='hot') {
					var sql = "SELECT p.projectId, p.title, p.category, p.coverImage, p.moneyNeeded, p.endByDate, p.createdDate, p.userId, p.name, p.userPhoto, TIMESTAMPDIFF(DAY,CURDATE(),p.endByDate) as remainDays, (SELECT COUNT(*) from likes l where l.projectId=p.projectId) AS likesCount, (SELECT COUNT(*) from views v where v.projectId=p.projectId) AS viewsCount, (SELECT COUNT(*) from shares s where s.projectId=p.projectId) AS sharesCount, (SELECT COALESCE(SUM(amount),0) from payments pay where pay.projectId=p.projectId AND pay.txnStatus='TXN_SUCCESS') AS funded, (SELECT COUNT(*) from favourites f where f.projectId=p.projectId AND f.userId='"+userId+"') AS favCount FROM projects p WHERE p.STATUS = 'ACTIVE' AND p.endByDate >= CURDATE() AND category LIKE '%"+category+"' HAVING likesCount>0 ORDER BY likesCount DESC LIMIT 0, " + limit;
					dbConnection.query(sql, function (error, results, fields) {
						if (error) {
							return wCB(error);
						}
						projects.hot = results;
						wCB();
					});
				} else {
					wCB();
				}
			},
			function (wCB) {
				if(q=='all' || q=='' || q=='recommended') {
					var sql = "SELECT p.projectId, p.title, p.category, p.coverImage, p.moneyNeeded, p.endByDate, p.createdDate, p.userId, p.name, p.userPhoto, TIMESTAMPDIFF(DAY,CURDATE(),p.endByDate) as remainDays, (SELECT COUNT(*) from likes l where l.projectId=p.projectId) AS likesCount, (SELECT COUNT(*) from views v where v.projectId=p.projectId) AS viewsCount, (SELECT COUNT(*) from shares s where s.projectId=p.projectId) AS sharesCount, (SELECT COALESCE(SUM(amount),0) from payments pay where pay.projectId=p.projectId AND pay.txnStatus='TXN_SUCCESS') AS funded, (SELECT count(amount) from payments paycount where paycount.projectId=p.projectId AND paycount.txnStatus='TXN_SUCCESS') AS fundedCount, (SELECT SUM(likesCount+viewsCount+sharesCount+fundedCount)) AS socialCount, (SELECT COUNT(*) from favourites f where f.projectId=p.projectId AND f.userId='"+userId+"') AS favCount FROM projects p WHERE p.STATUS = 'ACTIVE' AND p.endByDate >= CURDATE() AND category LIKE '%"+category+"' HAVING sharesCount>0 ORDER BY sharesCount DESC LIMIT 0, " + limit;
					dbConnection.query(sql, function (error, results, fields) {
						if (error) {
							return wCB(error);
						}
						projects.recommended = results;
						wCB();
					});
				} else {
					wCB();
				}
			},
			function (wCB) {
				if(q=='all' || q=='' || q=='currentlywatched') {
					var sql = "SELECT p.projectId, p.title, p.category, p.coverImage, p.moneyNeeded, p.endByDate, p.createdDate, p.userId, p.name, p.userPhoto, TIMESTAMPDIFF(DAY,CURDATE(),p.endByDate) as remainDays, (SELECT COUNT(*) from likes l where l.projectId=p.projectId) AS likesCount, (SELECT COUNT(*) from views v where v.projectId=p.projectId) AS viewsCount, (SELECT COUNT(*) from shares s where s.projectId=p.projectId) AS sharesCount, (SELECT COALESCE(SUM(amount),0) from payments pay where pay.projectId=p.projectId AND pay.txnStatus='TXN_SUCCESS') AS funded, (SELECT count(amount) from payments paycount where paycount.projectId=p.projectId AND paycount.txnStatus='TXN_SUCCESS') AS fundedCount, (SELECT SUM(likesCount+viewsCount+sharesCount+fundedCount)) AS socialCount, v.viewedOn, (SELECT COUNT(*) from favourites f where f.projectId=p.projectId AND f.userId='"+userId+"') AS favCount FROM projects p, views v WHERE p.STATUS = 'ACTIVE' AND p.endByDate >= CURDATE() AND category LIKE '%"+category+"' AND p.projectId = v.projectId GROUP BY p.projectId ORDER BY v.viewedOn,viewsCount DESC LIMIT 0, " + limit;
					dbConnection.query(sql, function (error, results, fields) {
						if (error) {
							return wCB(error);
						}
						projects.currentlywatched = results;
						wCB();
					});
				} else {
					wCB();
				}
			},
			function (wCB) {
				res.status(200).send(projects);
			}
		], function (err) {
			// If we pass first paramenter as error this function will execute.
			res.status(500).send(err);
		});
		
	});

	/* update project status */
	app.put('/update', function (req, res) {
		var project = req.body;
		if(!project.projectId || !project.userId) {
			res.status(500).send("ProjectId/userId/status should not be blank.");
			return;
		}
		if(project.endByDate) {
			project.endByDate = moment(project.endByDate).format('YYYY-MM-DD HH:mm:ss');
		}
		if(project.reason) {
			delete project.reason;
		}
		try {
			dbConnection.query("UPDATE projects SET ? WHERE projectId=? AND userId=?", [project, project.projectId, project.userId], function (error, results, fields) {
				if (error) {
					console.log(error);
					res.status(500).send(error);
					return;
				}
				res.status(200).send(results);
			});
		} catch(e) {
			console.log(e);
			res.status(500).send("Internal Server Error.");
		}
	});

	/*Get payment details*/
	app.get('/payments/:paymentId', function (req, res) {
		var orderId = req.params.paymentId;
		var userId = 0;
		if(!orderId) {
			res.status(500).send("OrderId should not be blank.");
		}
			
		try {
			dbConnection.query("SELECT * FROM payments WHERE OrderId = ?", [orderId], function (error, results, fields) {
				if (error) {
					console.log(error);
					res.status(500).send(error);
					return;
				}
				res.status(200).send(results);
			});
		} catch(e) {
			console.log(e);
			res.status(500).send("Internal Server Error.");
		}
	});

}
//dbConnection.query("SELECT projectId, title, category, coverImage, moneyNeeded, endByDate, createdDate, userId, name, userPhoto, TIMESTAMPDIFF(DAY,CURDATE(),endByDate) as remainDays FROM projects WHERE STATUS = 'ACTIVE' AND endByDate >= CURDATE() AND (title LIKE ? OR category LIKE ?  OR name LIKE ?  OR location LIKE ?  OR description LIKE ?)", q, function (error, results, fields) {

//CREATE TABLE `backme`.`favourites` ( `favId` INT NOT NULL AUTO_INCREMENT , `userId` INT NOT NULL , `projectId` INT NOT NULL , `createdOn` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() , `status` VARCHAR(255) NOT NULL , PRIMARY KEY (`favId`)) ENGINE = InnoDB;