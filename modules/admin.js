
exports.adminAPI = function(app, dbConnection, validate, multer, path, nesting, async, moment, transporter, emails) {
	/*Get All projects*/
	app.get('/admin/projects', function (req, res) {
		var admin = req.query;

		if(admin.role == 'ADMIN' && admin.adminId) {
			try {
				dbConnection.query('SELECT p.*, a.adminId, (SELECT COALESCE(SUM(amount),0) from payments pay where pay.projectId=p.projectId AND pay.txnStatus="TXN_SUCCESS") AS funded from projects p, assignprojects a WHERE p.projectId=a.projectId and a.adminId=? GROUP BY p.projectId ORDER BY p.projectId DESC', [admin.adminId], function (error, results, fields) {
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

		} else {
			try {
				dbConnection.query('SELECT p.*, (SELECT COALESCE(SUM(amount),0) from payments pay where pay.projectId=p.projectId AND pay.txnStatus="TXN_SUCCESS") AS funded FROM projects p ORDER BY p.projectId DESC', function (error, results, fields) {
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
		}

	});
	
	/*Get Specific project by projectId for admin*/
	app.get('/admin/projects/:projectId', function (req, res) {
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
					LEFT JOIN (SELECT projectId, likeId, count(likeId) as likeCount, EXISTS(SELECT * FROM likes) as alreadyLiked  from likes WHERE projectId=?) likes ON (projects.projectId = likes.projectId) \
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

	
	
	app.get('/admin/promotedProjects', function (req, res) {
		var admin = req.query;

		if(admin.role == 'ADMIN' && admin.adminId) {
			try {
				dbConnection.query('SELECT p.projectId, p.title, p.category, p.name, pr.type, pr.fromDate, pr.toDate, pr.status from projects p, promotions pr WHERE p.projectId=pr.projectId AND p.projectId IN (SELECT projectId from assignprojects WHERE adminId=?)', [admin.adminId], function (error, results, fields) {
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

		} else {
			try {
				dbConnection.query('SELECT p.projectId, p.title, p.category, p.name, pr.type, pr.fromDate, pr.toDate, pr.status from projects p, promotions pr WHERE p.projectId=pr.projectId', function (error, results, fields) {
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
		}
	});
	
	app.put('/admin/promotion/status', function (req, res) {
		var project = req.body;
		if(!project.projectId || !project.status || !project.type) {
			res.status(400).send("Bad Request: Promotion projectId/status should not be empty.");
			return;
		};
		try {
			dbConnection.query('UPDATE promotions SET status=? WHERE type=? AND projectId IN ('+project.projectId+')', [project.status, project.type], function (error, results, fields) {
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

	/*Admin releted apis*/
	
	/*admin login*/
	app.post('/admin/login', function (req, res) {
		var admin = req.body;
		if(!admin.email || !admin.password) {
			res.status(400).send("Bad Request. Email/Password should not be empty.");
			return;
		};
		try {
			dbConnection.query('SELECT * FROM admin WHERE email=? AND BINARY password=? AND status="ACTIVE"', [admin.email, admin.password], function (error, results, fields) {
				if (error) {
					res.status(500).send("Internal Server Error.");
					return;
				}
				if(results.length)
					res.status(200).send(results);
				else
					res.status(404).send('Invalid userId/passowrd.');
			});
		} catch(e) {
			console.log(e);
			res.status(500).send("Internal Server Error.", e);
		}
	});


	/*create admin*/
	app.post('/admin', function (req, res) {
		var admin = req.body;
		if(!admin.email || !admin.password || !admin.name) {
			res.status(400).send("Bad Request. Parameters mismatched.");
			return;
		};
		if(!validate.validateEmail(admin.email)) {
			res.status(400).send("Invalid Email.");
			return;
		}
		admin.status = 'ACTIVE';
		try {
			dbConnection.query('INSERT INTO admin SET ?', admin, function (error, results, fields) {
				if (error) {
					res.status(500).send(error.code=='ER_DUP_ENTRY'?'Email already found.':error.code);
					return;
				}

				/*emails.sendEmails(app, transporter, 'user-register.ejs', admin.email, 'Welcome to Back Me!', function(info) {
					console.log(info);
				});*/
				res.status(200).send(results);
			});
		} catch(e) {
			res.status(500).send("Internal Server Error.");
		}
	});


	/*update admin details*/
	app.put('/admin', function (req, res) {
		var admin = req.body;
		if(!admin.adminId) {
			res.status(400).send("Bad Request. Admin ID should not be blank.");
			return;
		};
		if(admin.email && !validate.validateEmail(admin.email)) {
			res.status(400).send("Invalid Email.");
			return;
		}
		try {
			dbConnection.query('UPDATE admin SET ? WHERE adminId=?', [admin, admin.adminId], function (error, results, fields) {
				if (error) {
					console.log(error);
					res.status(500).send(error);
					return;
				}
				results.admin = admin;
				res.status(200).send(results);
			});
		} catch(e) {
			console.log(e);
			res.status(500).send("Internal Server Error.");
		}
	});

	/*update admin details*/
	app.put('/admin/status', function (req, res) {
		var admin = req.body;
		if(!admin.adminId || !admin.status) {
			res.status(400).send("Bad Request. Admin ID/status should not be blank.");
			return;
		};
		try {
			dbConnection.query('UPDATE admin SET status=? WHERE adminId IN ('+admin.adminId+')', [admin.status], function (error, results, fields) {
				if (error) {
					res.status(500).send(error);
					return;
				}
				results.admin = admin;
				res.status(200).send(results);
			});
		} catch(e) {
			res.status(500).send("Internal Server Error.");
		}
	});

	/*delete specific admin details*/
	app.delete('/admin', function (req, res) {
		var admin = req.body;
		if(!admin.adminId) {
			res.status(400).send("Bad Request. Admin ID should not be blank.");
			return;
		};
		try {
			dbConnection.query('DELETE FROM admin WHERE adminId IN('+admin.adminId+')', function (error, results, fields) {
				if (error) {
					console.log(error);
					res.status(500).send(error.code);
					return;
				}
				results.admin = admin;
				res.status(200).send(results);
			});
		} catch(e) {
			console.log(e);
			res.status(500).send("Internal Server Error.");
		}
	});

	/*Get All admin*/
	app.get('/admin', function (req, res) {
		try {
			dbConnection.query('SELECT * FROM admin', function (error, results, fields) {
				if (error) {
					res.status(500).send("Internal Server Error.");
					return;
				}
				res.status(200).send(results);
			});
		} catch(e) {
			res.status(500).send("Internal Server Error.");
		}
	});


	/*Get Specific admin details*/
	app.get('/admin/:adminId', function (req, res) {
		var adminId = req.params.adminId;
		try {
			if(adminId) {
				dbConnection.query('SELECT * FROM admin WHERE adminId=?', [adminId], function (error, results, fields) {
					if (error) {
						res.status(500).send("Internal Server Error.");
						return;
					}
					res.status(200).send(results);
				});
			}
		} catch(e) {
			res.status(500).send("Internal Server Error.");
		}
	});
	
	
	/*Category releted apis*/
	
	/*create category*/
	app.post('/category', function (req, res) {
		var category = req.body;
		if(!category.name) {
			res.status(400).send("Bad Request. Category name should not be blank.");
			return;
		};
		try {
			dbConnection.query('INSERT INTO category SET ?', category, function (error, results, fields) {
				if (error) {
					res.status(500).send(error);
					return;
				}
				res.status(200).send(results);
			});
		} catch(e) {
			res.status(500).send("Internal Server Error.");
		}
	});

	
	/*update category details*/
	app.put('/category', function (req, res) {
		var category = req.body;
		if(!category.categoryId) {
			res.status(400).send("Bad Request. Category ID should not be blank.");
			return;
		};
		try {
			dbConnection.query('UPDATE category SET ? WHERE categoryId=?', [category, category.categoryId], function (error, results, fields) {
				if (error) {
					res.status(500).send(error);
					return;
				}
				results.category = category;
				res.status(200).send(results);
			});
		} catch(e) {
			console.log(e);
			res.status(500).send("Internal Server Error.");
		}
	});

	/*delete specific category details*/
	app.delete('/category', function (req, res) {
		var category = req.body;
		if(!category.categoryId) {
			res.status(400).send("Bad Request. category ID should not be blank.");
			return;
		};
		try {
			dbConnection.query('DELETE FROM category WHERE categoryId IN ('+category.categoryId+')', function (error, results, fields) {
				if (error) {
					res.status(500).send(error);
					return;
				}
				results.category = category;
				res.status(200).send(results);
			});
		} catch(e) {
			res.status(500).send("Internal Server Error.");
		}
	});

	/*Get All category*/
	app.get('/category', function (req, res) {
		try {
			dbConnection.query('SELECT * FROM category', function (error, results, fields) {
				if (error) {
					res.status(500).send("Internal Server Error.");
					return;
				}
				res.status(200).send(results);
			});
		} catch(e) {
			res.status(500).send("Internal Server Error.");
		}
	});


	/*Get Specific category details*/
	app.get('/category/:categoryId', function (req, res) {
		var categoryId = req.params.categoryId;
		try {
			if(userId) {
				dbConnection.query('SELECT * FROM category WHERE categoryId=?', [categoryId], function (error, results, fields) {
					if (error) {
						res.status(500).send("Internal Server Error.");
						return;
					}
					res.status(200).send(results);
				});
			}
		} catch(e) {
			res.status(500).send("Internal Server Error.");
		}
	});

	
	/*Banks releted apis*/
	
	/*create bank*/
	app.post('/banks', function (req, res) {
		var banks = req.body;
		if(!banks.name) {
			res.status(400).send("Bad Request. Bank name should not be blank.");
			return;
		};
		try {
			dbConnection.query('INSERT INTO banks SET ?', banks, function (error, results, fields) {
				if (error) {
					res.status(500).send(error);
					return;
				}
				res.status(200).send(results);
			});
		} catch(e) {
			res.status(500).send("Internal Server Error.");
		}
	});

	
	/*update bank details*/
	app.put('/banks', function (req, res) {
		var banks = req.body;
		if(!banks.bankId) {
			res.status(400).send("Bad Request. bank ID should not be blank.");
			return;
		};
		try {
			dbConnection.query('UPDATE banks SET ? WHERE bankId=?', [banks, banks.bankId], function (error, results, fields) {
				if (error) {
					res.status(500).send(error);
					return;
				}
				results.banks = banks;
				res.status(200).send(results);
			});
		} catch(e) {
			console.log(e);
			res.status(500).send("Internal Server Error.");
		}
	});

	/*delete specific banks details*/
	app.delete('/banks', function (req, res) {
		var banks = req.body;
		if(!banks.bankId) {
			res.status(400).send("Bad Request. bank ID should not be blank.");
			return;
		};
		try {
			dbConnection.query('DELETE FROM banks WHERE bankId IN ('+banks.bankId+')', function (error, results, fields) {
				if (error) {
					console.log(error);
					res.status(500).send(error);
					return;
				}
				results.banks = banks;
				res.status(200).send(results);
			});
		} catch(e) {
			console.log(e);
			res.status(500).send("Internal Server Error.");
		}
	});

	/*Get All bank*/
	app.get('/banks', function (req, res) {
		try {
			dbConnection.query('SELECT * FROM banks', function (error, results, fields) {
				if (error) {
					res.status(500).send("Internal Server Error.");
					return;
				}
				res.status(200).send(results);
			});
		} catch(e) {
			res.status(500).send("Internal Server Error.");
		}
	});


	/*Get Specific bank details*/
	app.get('/banks/:bankId', function (req, res) {
		var bankId = req.params.bankId;
		try {
			if(userId) {
				dbConnection.query('SELECT * FROM banks WHERE bankId=?', [bankId], function (error, results, fields) {
					if (error) {
						res.status(500).send("Internal Server Error.");
						return;
					}
					res.status(200).send(results);
				});
			}
		} catch(e) {
			res.status(500).send("Internal Server Error.");
		}
	});
	
	
	/*City releted apis*/
	
	/*create city*/
	app.post('/cities', function (req, res) {
		var cities = req.body;
		if(!cities.city) {
			res.status(400).send("Bad Request. City should not be blank.");
			return;
		};
		try {
			dbConnection.query('INSERT INTO cities SET ?', cities, function (error, results, fields) {
				if (error) {
					res.status(500).send(error);
					return;
				}
				res.status(200).send(results);
			});
		} catch(e) {
			res.status(500).send("Internal Server Error.");
		}
	});

	
	/*update cities details*/
	app.put('/cities', function (req, res) {
		var cities = req.body;
		if(!cities.cityId) {
			res.status(400).send("Bad Request. City ID should not be blank.");
			return;
		};
		try {
			dbConnection.query('UPDATE cities SET ? WHERE cityId=?', [cities, cities.cityId], function (error, results, fields) {
				if (error) {
					res.status(500).send(error);
					return;
				}
				results.cities = cities;
				res.status(200).send(results);
			});
		} catch(e) {
			console.log(e);
			res.status(500).send("Internal Server Error.");
		}
	});

	/*delete specific cities details*/
	app.delete('/cities', function (req, res) {
		var cities = req.body;
		if(!cities.cityId) {
			res.status(400).send("Bad Request. City ID should not be blank.");
			return;
		};
		try {
			dbConnection.query('DELETE FROM cities WHERE cityId IN ('+cities.cityId+')', function (error, results, fields) {
				if (error) {
					console.log(error);
					res.status(500).send(error);
					return;
				}
				results.cities = cities;
				res.status(200).send(results);
			});
		} catch(e) {
			console.log(e);
			res.status(500).send("Internal Server Error.");
		}
	});

	/*Get All cities*/
	app.get('/cities', function (req, res) {
		try {
			dbConnection.query('SELECT * FROM cities', function (error, results, fields) {
				if (error) {
					res.status(500).send("Internal Server Error.");
					return;
				}
				res.status(200).send(results);
			});
		} catch(e) {
			res.status(500).send("Internal Server Error.");
		}
	});


	/*Get Specific category details*/
	app.get('/cities/:cityId', function (req, res) {
		var cityId = req.params.cityId;
		try {
			if(userId) {
				dbConnection.query('SELECT * FROM cities WHERE cityId=?', [cityId], function (error, results, fields) {
					if (error) {
						res.status(500).send("Internal Server Error.");
						return;
					}
					res.status(200).send(results);
				});
			}
		} catch(e) {
			res.status(500).send("Internal Server Error.");
		}
	});

	/*Get All abused comments */
	app.get('/admin/comments/abused', function (req, res) {
		try {
			dbConnection.query('SELECT c.*, (SELECT name from users WHERE users.userId=c.userId) as createdBy, (SELECT name from users WHERE users.userId=c.abusedBy) as reportedBy FROM comments c WHERE abused="true"', function (error, results, fields) {
				if (error) {
					console.log(error);
					res.status(500).send("Internal Server Error.");
					return;
				}
				res.status(200).send(results);
			});
		} catch(e) {
			console.log(e);
			res.status(500).send("Internal Server Error.");
		}
	});
	
	/*update abused comment details*/
	app.put('/admin/comments/abused', function (req, res) {
		var abusedCmt = req.body;
		if(!abusedCmt.commentId) {
			res.status(400).send("Bad Request. commentId should not be blank.");
			return;
		};
		try {
			dbConnection.query('UPDATE comments SET ? WHERE commentId=?', [abusedCmt, abusedCmt.commentId], function (error, results, fields) {
				if (error) {
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

	
	app.put('/admin/comments/abused/status', function (req, res) {
		var abusedCmt = req.body;
		if(!abusedCmt.commentId) {
			res.status(400).send("Bad Request. commentId should not be blank.");
			return;
		};
		try {
			dbConnection.query('UPDATE comments SET abused = ? WHERE commentId IN ('+abusedCmt.commentId+')', [abusedCmt.abused], function (error, results, fields) {
				if (error) {
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

	
	/*delete specific abused comments details*/
	app.delete('/admin/comments/abused', function (req, res) {
		var abusedCmt = req.body;
		if(!abusedCmt.commentId) {
			res.status(400).send("Bad Request. commentId should not be blank.");
			return;
		};
		try {
			dbConnection.query('DELETE FROM comments WHERE commentId IN ('+abusedCmt.commentId+')', function (error, results, fields) {
				if (error) {
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


	
	/*update project details*/
	app.put('/admin/projects', function (req, res) {
		var project = req.body;
		if(!project.projectId) {
			res.status(400).send("Bad Request: ProjectId should not be empty.");
			return;
		};
		try {
			dbConnection.query('UPDATE projects SET status=? WHERE projectId IN ('+project.projectId+')', [project.status], function (error, results, fields) {
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

	/*Get All payments*/
	app.get('/pay/history', function (req, res) {
		try {
			dbConnection.query('SELECT * FROM payments', function (error, results, fields) {
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


	/*Get Specific payments details*/
	app.get('/pay/history/:paymentId', function (req, res) {
		var paymentId = req.params.paymentId;
		try {
			if(paymentId) {
				dbConnection.query('SELECT * FROM payments WHERE orderId=?', [paymentId], function (error, results, fields) {
					if (error) {
						res.status(500).send(error);
						return;
					}
					res.status(200).send(results);
				});
			}
		} catch(e) {
			res.status(500).send(e);
		}
	});
		
	/*update user details*/
	app.put('/admin/users', function (req, res) {
		var user = req.body;
		if(!user.userId) {
			res.status(400).send("Bad Request: UserId should not be empty.");
			return;
		};
		try {
			dbConnection.query('UPDATE users SET ? WHERE userId=?', [user, user.userId], function (error, results, fields) {
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
	
	/*update user details*/
	app.put('/admin/users/status', function (req, res) {
		var user = req.body;
		if(!user.userId) {
			res.status(400).send("Bad Request: UserId should not be empty.");
			return;
		};
		try {
			dbConnection.query('UPDATE users SET status=? WHERE userId IN ('+user.userId+')', [user.status], function (error, results, fields) {
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
	
	/*Statistics: Get project by location */
	app.get('/admin/statistics/projectCountByLocation', function (req, res) {
		var admin = req.query;
		if(!admin.fromDate || !admin.toDate) {
			res.status(400).send("Bad Request: From Date / To Date should not be empty.");
			return;
		};
		if(admin.role == 'ADMIN' && admin.adminId) {
			try {
				dbConnection.query('SELECT COUNT(p.projectId) as projectCount, p.location, a.adminId FROM projects p, assignprojects a WHERE (DATE(p.createdDate) BETWEEN ? AND ?) AND p.projectId=a.projectId AND a.adminId=? GROUP BY p.location', [admin.fromDate, admin.toDate, admin.adminId], function (error, results, fields) {
					if (error) {
						res.status(500).send(error);
						return;
					}
					res.status(200).send(results);
				});
			} catch(e) {
				res.status(500).send(e);
			}
		} else {
			try {
				dbConnection.query('SELECT COUNT(*) as projectCount, location FROM projects WHERE DATE(createdDate) BETWEEN ? AND ? GROUP BY location', [admin.fromDate, admin.toDate], function (error, results, fields) {
					if (error) {
						res.status(500).send(error);
						return;
					}
					res.status(200).send(results);
				});
			} catch(e) {
				res.status(500).send(e);
			}
		}
	});

	app.get('/admin/statistics/trending', function (req, res) {
		var admin = req.query;
		if(!admin.fromDate || !admin.toDate) {
			res.status(400).send("Bad Request: From Date / To Date should not be empty.");
			return;
		};
		if(admin.role == 'ADMIN' && admin.adminId) {
			try {
				dbConnection.query("SELECT DATE_FORMAT(viewedOn, '%Y %b') as monthYear, COUNT(viewId) as viewCount, (SELECT COUNT(likeId) from likes WHERE DATE_FORMAT(likedOn, '%Y%m') = DATE_FORMAT(viewedOn, '%Y%m') AND projectId IN(SELECT projectId FROM assignprojects WHERE adminId=?)) AS likesCount, (SELECT COUNT(shareId) from shares WHERE DATE_FORMAT(sharedOn, '%Y%m') = DATE_FORMAT(viewedOn, '%Y%m') AND projectId IN(SELECT projectId FROM assignprojects WHERE adminId=?)) AS sharesCount, (SELECT COUNT(amount) from payments WHERE txnStatus='TXN_SUCCESS' AND DATE_FORMAT(txnDate, '%Y%m') = DATE_FORMAT(viewedOn, '%Y%m') AND projectId IN(SELECT projectId FROM assignprojects WHERE adminId=?)) AS supportersCount from views WHERE DATE(viewedOn) BETWEEN ? AND ?  AND projectId IN(SELECT projectId FROM assignprojects WHERE adminId=?) GROUP BY DATE_FORMAT(viewedOn, '%Y%m')", [admin.adminId, admin.adminId, admin.adminId, admin.fromDate, admin.toDate, admin.adminId], function (error, results, fields) {
					if (error) {
						res.status(500).send(error);
						return;
					}
					res.status(200).send(results);
				});
			} catch(e) {
				res.status(500).send(e);
			}
		} else {
			try {
				dbConnection.query("SELECT DATE_FORMAT(viewedOn, '%Y %b') as monthYear, COUNT(viewId) as viewCount, (SELECT COUNT(likeId) from likes WHERE DATE_FORMAT(likedOn, '%Y%m') = DATE_FORMAT(viewedOn, '%Y%m')) AS likesCount, (SELECT COUNT(shareId) from shares WHERE DATE_FORMAT(sharedOn, '%Y%m') = DATE_FORMAT(viewedOn, '%Y%m')) AS sharesCount, (SELECT COUNT(amount) from payments WHERE txnStatus='TXN_SUCCESS' AND DATE_FORMAT(txnDate, '%Y%m') = DATE_FORMAT(viewedOn, '%Y%m')) AS supportersCount from views WHERE DATE(viewedOn) BETWEEN ? AND ? GROUP BY DATE_FORMAT(viewedOn, '%Y%m')", [admin.fromDate, admin.toDate], function (error, results, fields) {
					if (error) {
						res.status(500).send(error);
						return;
					}
					res.status(200).send(results);
				});
			} catch(e) {
				res.status(500).send(e);
			}
		}
		
	});


	app.get('/admin/statistics/projectscount', function (req, res) {
		var admin = req.query;
		if(!admin.fromDate || !admin.toDate) {
			res.status(400).send("Bad Request: From Date / To Date should not be empty.");
			return;
		};
		if(admin.role == 'ADMIN' && admin.adminId) {
			try {
				dbConnection.query("SELECT COUNT(p.projectId) as projectCount, DATE_FORMAT(createdDate, '%Y %b') as monthYear, a.adminId FROM projects p, assignprojects a WHERE (DATE(p.createdDate) BETWEEN ? AND ?) AND p.projectId=a.projectId AND a.adminId=? GROUP BY DATE_FORMAT(createdDate, '%Y%m')", [admin.fromDate, admin.toDate, admin.adminId], function (error, results, fields) {
					if (error) {
						res.status(500).send(error);
						return;
					}
					res.status(200).send(results);
				});
			} catch(e) {
				res.status(500).send(e);
			}
		} else {
			try {
				dbConnection.query("SELECT COUNT(*) as projectCount, DATE_FORMAT(createdDate, '%Y %b') as monthYear FROM projects WHERE DATE(createdDate) BETWEEN ? AND ? GROUP BY DATE_FORMAT(createdDate, '%Y%m')", [admin.fromDate, admin.toDate], function (error, results, fields) {
					if (error) {
						res.status(500).send(error);
						return;
					}
					res.status(200).send(results);
				});
			} catch(e) {
				res.status(500).send(e);
			}
		}

	});
	
	/*Get All projects statistics*/
	app.get('/admin/report/statistics', function (req, res) {
		var admin = req.query;
		var response = {
			totalProjects: 0,
			totalFunded: 0,
			projectsTopLocation: '',
			fundedTopLocation: ''
		};
		
		if(admin.role == 'ADMIN' && admin.adminId) {
			try {
				dbConnection.query('SELECT COUNT(*) as totalProjects, p.location, a.adminId, (SELECT COALESCE(SUM(amount),0) from payments pay where pay.projectId=p.projectId AND pay.txnStatus="TXN_SUCCESS") AS totalFunded FROM projects p, assignprojects a WHERE p.projectId=a.projectId AND a.adminId=? AND DATE(p.createdDate) BETWEEN ? AND ?', [admin.adminId, admin.fromDate, admin.toDate], function (error, results, fields) {
					if (error) {
						console.log(error);
						res.status(500).send("Internal Server Error.");
						return;
					}
					response.totalProjects = results.length?results[0].totalProjects:'';
					response.totalProjects = results.length?results[0].totalProjects:'';
					dbConnection.query('SELECT COALESCE(SUM(amount),0) AS totalFunded from payments WHERE txnStatus="TXN_SUCCESS" AND DATE(txnDate) BETWEEN ? AND ? AND projectId IN(SELECT projectId FROM assignprojects WHERE adminId=?)',[admin.fromDate, admin.toDate, admin.adminId], function (error, results, fields) {
						if (error) {
							console.log(error);
							res.status(500).send("Internal Server Error.");
							return;
						}
						response.totalFunded = results.length?results[0].totalFunded:'';
						dbConnection.query('SELECT COUNT(*) as pcount, p.location, a.adminId FROM projects p, assignprojects a WHERE p.projectId=a.projectId AND a.adminId=? AND DATE(p.createdDate) BETWEEN ? AND ? GROUP BY p.location ORDER BY pcount DESC LIMIT 1', [admin.adminId, admin.fromDate, admin.toDate], function (error, results, fields) {
							if (error) {
								console.log(error);
								res.status(500).send("Internal Server Error.");
								return;
							}
							response.projectsTopLocation = results.length?results[0].location:'';
							dbConnection.query('SELECT p.location, (SELECT COALESCE(SUM(amount),0) from payments pay where pay.projectId=p.projectId AND pay.txnStatus="TXN_SUCCESS" AND DATE(pay.txnDate) BETWEEN ? AND ?) AS totalFunded, a.adminId FROM projects p, assignprojects a WHERE p.projectId=a.projectId AND a.adminId=? GROUP BY p.location ORDER BY totalFunded DESC LIMIT 1', [admin.fromDate, admin.toDate, admin.adminId], function (error, results, fields) {
								if (error) {
									console.log(error);
									res.status(500).send("Internal Server Error.");
									return;
								}
								response.fundedTopLocation = results.length?results[0].location:'';
								res.status(200).send(response);
							});					
						});					
					});
				});
			} catch(e) {
				console.log(e);
				res.status(500).send(e);
			}

		} else {
			try {
				dbConnection.query('SELECT COUNT(*) as totalProjects, p.location, (SELECT COALESCE(SUM(amount),0) from payments pay where pay.projectId=p.projectId AND pay.txnStatus="TXN_SUCCESS") AS totalFunded FROM projects p WHERE DATE(p.createdDate) BETWEEN ? AND ?',[admin.fromDate, admin.toDate], function (error, results, fields) {
					if (error) {
						console.log(error);
						res.status(500).send("Internal Server Error.");
						return;
					}
					response.totalProjects = results.length?results[0].totalProjects:'';
					dbConnection.query('SELECT COALESCE(SUM(amount),0) AS totalFunded from payments WHERE txnStatus="TXN_SUCCESS" AND DATE(txnDate) BETWEEN ? AND ?',[admin.fromDate, admin.toDate], function (error, results, fields) {
						if (error) {
							console.log(error);
							res.status(500).send("Internal Server Error.");
							return;
						}
						response.totalFunded = results.length?results[0].totalFunded:'';
						dbConnection.query('SELECT COUNT(*) as pcount, location FROM projects WHERE DATE(createdDate) BETWEEN ? AND ? GROUP BY location ORDER BY pcount DESC LIMIT 1',[admin.fromDate, admin.toDate], function (error, results, fields) {
							if (error) {
								console.log(error);
								res.status(500).send("Internal Server Error.");
								return;
							}
							response.projectsTopLocation = results.length?results[0].location:'';
							dbConnection.query('SELECT p.location, (SELECT COALESCE(SUM(amount),0) from payments pay where pay.projectId=p.projectId AND pay.txnStatus="TXN_SUCCESS" AND DATE(pay.txnDate) BETWEEN ? AND ? ) AS totalFunded FROM projects p GROUP BY p.location ORDER BY totalFunded DESC LIMIT 1',[admin.fromDate, admin.toDate], function (error, results, fields) {
								if (error) {
									console.log(error);
									res.status(500).send("Internal Server Error.");
									return;
								}
								response.fundedTopLocation = results.length?results[0].location:'';
								res.status(200).send(response);
							});
						});
					});
				});
			} catch(e) {
				console.log(e);
				res.status(500).send(e);
			}
		}
	});

	
	/*Get top 10 projects based on likes and comments*/
	app.get('/admin/report/topProjects', function (req, res) {
		var admin = req.query;
		if(admin.role == 'ADMIN' && admin.adminId) {
			try {
				dbConnection.query('SELECT p.projectId, p.title, p.coverImage, a.adminId, (SELECT COUNT(*) FROM likes WHERE p.projectId=likes.projectId AND DATE(likes.likedOn) BETWEEN ? AND ?) as likesCount, (SELECT COUNT(*) FROM comments WHERE p.projectId=comments.projectId AND DATE(comments.commentedOn) BETWEEN ? AND ?) as commentsCount, (SELECT SUM(likesCount+commentsCount)) AS totalCount FROM projects p, assignprojects a WHERE p.projectId=a.projectId AND a.adminId=? GROUP BY p.projectId HAVING totalCount>0 ORDER BY totalCount DESC', [admin.fromDate, admin.toDate, admin.fromDate, admin.toDate, admin.adminId], function (error, results, fields) {
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

		} else {
			try {
				dbConnection.query('SELECT projectId, title, coverImage, (SELECT COUNT(*) FROM likes WHERE projects.projectId=likes.projectId AND DATE(likes.likedOn) BETWEEN ? AND ?) as likesCount, (SELECT COUNT(*) FROM comments WHERE projects.projectId=comments.projectId AND DATE(comments.commentedOn) BETWEEN ? AND ?) as commentsCount, (SELECT SUM(likesCount+commentsCount)) AS totalCount FROM projects HAVING totalCount>0 ORDER BY totalCount DESC',[admin.fromDate, admin.toDate, admin.fromDate, admin.toDate], function (error, results, fields) {
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
		}
	});
	
	/*Get top 10 funded projects based payments received*/
	app.get('/admin/report/topFunded', function (req, res) {
		var admin = req.query;

		if(admin.role == 'ADMIN' && admin.adminId) {
			try {
				dbConnection.query('SELECT p.projectId, p.title, p.coverImage, a.adminId, (SELECT COALESCE(SUM(amount),0) from payments pay where pay.projectId=p.projectId AND pay.txnStatus="TXN_SUCCESS" AND DATE(pay.txnDate) BETWEEN ? AND ?) AS funded FROM projects p, assignprojects a WHERE p.projectId=a.projectId AND a.adminId=? GROUP BY p.projectId HAVING funded>0 ORDER BY funded DESC', [admin.fromDate, admin.toDate, admin.adminId], function (error, results, fields) {
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

		} else {
			try {
				dbConnection.query('SELECT p.projectId, p.title, p.coverImage, a.adminId, (SELECT COALESCE(SUM(amount),0) from payments pay where pay.projectId=p.projectId AND pay.txnStatus="TXN_SUCCESS" AND DATE(pay.txnDate) BETWEEN ? AND ?) AS funded FROM projects p, assignprojects a GROUP BY p.projectId HAVING funded>0 ORDER BY funded DESC',[admin.fromDate, admin.toDate], function (error, results, fields) {
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
		}
	});
	
	/*Get Over funded projects based payments received*/
	app.get('/admin/report/overFunded', function (req, res) {
		var admin = req.query;

		if(admin.role == 'ADMIN' && admin.adminId) {
			try {
				dbConnection.query('SELECT p.projectId, p.title, p.coverImage, p.moneyNeeded, a.adminId, (SELECT COALESCE(SUM(amount),0) from payments pay where pay.projectId=p.projectId AND pay.txnStatus="TXN_SUCCESS" AND DATE(pay.txnDate) BETWEEN ? AND ?) AS funded FROM projects p, assignprojects a WHERE p.projectId=a.projectId AND a.adminId=? GROUP BY p.projectId HAVING funded>p.moneyNeeded ORDER BY funded DESC', [admin.fromDate, admin.toDate, admin.adminId], function (error, results, fields) {
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

		} else {
			try {
				dbConnection.query('SELECT p.projectId, p.title, p.coverImage, p.moneyNeeded, a.adminId, (SELECT COALESCE(SUM(amount),0) from payments pay where pay.projectId=p.projectId AND pay.txnStatus="TXN_SUCCESS" AND DATE(pay.txnDate) BETWEEN ? AND ?) AS funded FROM projects p, assignprojects a GROUP BY p.projectId HAVING funded>=p.moneyNeeded ORDER BY funded DESC',[admin.fromDate, admin.toDate], function (error, results, fields) {
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
		}
	});
	
	/*Get Less funded projects based payments received*/
	app.get('/admin/report/lessFunded', function (req, res) {
		var admin = req.query;

		if(admin.role == 'ADMIN' && admin.adminId) {
			try {
				dbConnection.query('SELECT p.projectId, p.title, p.coverImage, p.moneyNeeded, a.adminId, (SELECT COALESCE(SUM(amount),0) from payments pay where pay.projectId=p.projectId AND pay.txnStatus="TXN_SUCCESS" AND DATE(pay.txnDate) BETWEEN ? AND ?) AS funded, (SELECT(funded/p.moneyNeeded)*100)AS percent FROM projects p, assignprojects a WHERE a.adminId=? GROUP BY p.projectId HAVING funded<p.moneyNeeded AND funded>0 AND percent<=50 ORDER BY funded DESC', [admin.fromDate, admin.toDate, admin.adminId], function (error, results, fields) {
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

		} else {
			try {
				dbConnection.query('SELECT p.projectId, p.title, p.coverImage, p.moneyNeeded, (SELECT COALESCE(SUM(amount),0) from payments pay where pay.projectId=p.projectId AND pay.txnStatus="TXN_SUCCESS" AND DATE(pay.txnDate) BETWEEN ? AND ?) AS funded, (SELECT(funded/p.moneyNeeded)*100)AS percent FROM projects p GROUP BY p.projectId HAVING funded<p.moneyNeeded AND funded>0 AND percent<=50 ORDER BY funded DESC',[admin.fromDate, admin.toDate], function (error, results, fields) {
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
		}
	});
	
	
	/*Get top donors based payments received*/
	app.get('/admin/report/topDonors', function (req, res) {
		var admin = req.query;

		if(admin.role == 'ADMIN' && admin.adminId) {
			try {
				dbConnection.query('SELECT pay.projectId, pay.firstName, pay.amount, a.adminId from payments pay, assignprojects a WHERE pay.projectId=a.projectId AND a.adminId=? AND pay.txnStatus="TXN_SUCCESS" AND DATE(pay.txnDate) BETWEEN ? AND ? ORDER BY pay.amount DESC', [admin.adminId, admin.fromDate, admin.toDate], function (error, results, fields) {
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

		} else {
			try {
				dbConnection.query('SELECT projectId, firstName, amount from payments WHERE txnStatus="TXN_SUCCESS" AND DATE(txnDate) BETWEEN ? AND ? ORDER BY amount DESC',[admin.fromDate, admin.toDate], function (error, results, fields) {
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
		}
	});
	
	
	/*Get top location based payments received*/
	app.get('/admin/report/topCities', function (req, res) {
		var admin = req.query;

		if(admin.role == 'ADMIN' && admin.adminId) {
			try {
				dbConnection.query('SELECT p.projectId, p.location, a.adminId, (SELECT COALESCE(SUM(amount),0) from payments pay where pay.projectId=p.projectId AND pay.txnStatus="TXN_SUCCESS" AND DATE(pay.txnDate) BETWEEN ? AND ?) AS totalFunded FROM projects p, assignprojects a WHERE p.projectId=a.projectId AND a.adminId=? GROUP BY p.location HAVING totalFunded>0 ORDER BY totalFunded DESC', [admin.fromDate, admin.toDate, admin.adminId], function (error, results, fields) {
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

		} else {
			try {
				dbConnection.query('SELECT p.projectId, p.location, (SELECT COALESCE(SUM(amount),0) from payments pay where pay.projectId=p.projectId AND pay.txnStatus="TXN_SUCCESS" AND DATE(pay.txnDate) BETWEEN ? AND ?) AS totalFunded FROM projects p GROUP BY p.location HAVING totalFunded>0 ORDER BY totalFunded DESC',[admin.fromDate, admin.toDate], function (error, results, fields) {
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
		}
	});
	
	/*Get accounting details*/
	app.get('/admin/report/accounting', function (req, res) {
		var admin = req.query;
		var userSharePercent = 90;
		var companySharePercent = 7;
		var procesingChargePercent = 2;
		var taxesForUserPercent = 15;
		var accounting = {
			totalFunds: 0,
			userShare: 0,
			companyShare: 0,
			procesingCharge: 0,
			acutualCompanyShare: 0,
			homePromotionPurchase: 0,
			socialPromotionPurchase: 0,
			totalCompanyEarning: 0,
			taxesForUser: 0,
			balanceFund: 0,
			fundDispersed: 0,
			balanceWithTheCompany: 0
		}
		
		if(admin.role == 'ADMIN' && admin.adminId) {
			try {
				dbConnection.query('SELECT (SELECT COALESCE(SUM(amount),0) FROM (SELECT amount from payments WHERE txnStatus="TXN_SUCCESS" AND DATE(txnDate) BETWEEN ? AND ? AND purpose="DONATION" AND projectId IN(SELECT projectId FROM assignprojects WHERE adminId=?))AS totalFunds )AS totalFunds, (SELECT COALESCE(SUM(amount),0) FROM (SELECT amount from payments WHERE txnStatus="TXN_SUCCESS" AND DATE(txnDate) BETWEEN ? AND ? AND purpose="HOME_PROMOTION" AND projectId IN(SELECT projectId FROM assignprojects WHERE adminId=?))AS homePromotionPurchase )AS homePromotionPurchase, (SELECT COALESCE(SUM(amount),0) FROM (SELECT amount from payments WHERE txnStatus="TXN_SUCCESS" AND DATE(txnDate) BETWEEN ? AND ? AND purpose="SOCIAL_PROMOTION" AND projectId IN(SELECT projectId FROM assignprojects WHERE adminId=?))AS homePromotionPurchase )AS socialPromotionPurchase', [admin.fromDate, admin.toDate, admin.adminId, admin.fromDate, admin.toDate, admin.adminId, admin.fromDate, admin.toDate, admin.adminId], function (error, results, fields) {
					if (error) {
						console.log(error);
						res.status(500).send("Internal Server Error.");
						return;
					}
					if(results.length) {
						accounting.totalFunds 				=	results[0].totalFunds?results[0].totalFunds:0;
						accounting.userShare 				= 	accounting.totalFunds*userSharePercent/100;
						accounting.companyShare 			= 	accounting.totalFunds*companySharePercent/100;
						accounting.procesingCharge 			= 	accounting.totalFunds*procesingChargePercent/100;
						accounting.acutualCompanyShare 		= 	accounting.totalFunds - accounting.procesingCharge;
						accounting.homePromotionPurchase 	= 	results[0].homePromotionPurchase?results[0].homePromotionPurchase:0;
						accounting.socialPromotionPurchase 	= 	results[0].socialPromotionPurchase?results[0].socialPromotionPurchase:0;
						accounting.totalCompanyEarning 		= 	accounting.acutualCompanyShare + 
																accounting.homePromotionPurchase + 
																accounting.socialPromotionPurchase;
						accounting.taxesForUser 			= 	accounting.userShare*taxesForUserPercent/100;
						accounting.balanceFund		 		= 	accounting.totalFunds - 
																accounting.companyShare -
																accounting.procesingCharge -
																accounting.taxesForUser;
						accounting.fundDispersed 			=	results[0].fundDispersed?results[0].fundDispersed:0;
						accounting.balanceWithTheCompany	= 	accounting.userShare - accounting.fundDispersed;

					}
					res.status(200).send(accounting);
				});
			} catch(e) {
				console.log(e);
				res.status(500).send(e);
			}

		} else {
			try {
				dbConnection.query('SELECT (SELECT COALESCE(SUM(amount),0) FROM (SELECT amount from payments WHERE txnStatus="TXN_SUCCESS" AND DATE(txnDate) BETWEEN ? AND ? AND purpose="DONATION")AS totalFunds )AS totalFunds, (SELECT COALESCE(SUM(amount),0) FROM (SELECT amount from payments WHERE txnStatus="TXN_SUCCESS" AND DATE(txnDate) BETWEEN ? AND ? AND purpose="HOME_PROMOTION")AS homePromotionPurchase )AS homePromotionPurchase, (SELECT COALESCE(SUM(amount),0) FROM (SELECT amount from payments WHERE txnStatus="TXN_SUCCESS" AND DATE(txnDate) BETWEEN ? AND ? AND purpose="SOCIAL_PROMOTION")AS homePromotionPurchase )AS socialPromotionPurchase', [admin.fromDate, admin.toDate, admin.fromDate, admin.toDate, admin.fromDate, admin.toDate], function (error, results, fields) {
					if (error) {
						console.log(error);
						res.status(500).send("Internal Server Error.");
						return;
					}
					if(results.length) {
						accounting.totalFunds 				=	results[0].totalFunds?results[0].totalFunds:0;
						accounting.userShare 				= 	accounting.totalFunds*userSharePercent/100;
						accounting.companyShare 			= 	accounting.totalFunds*companySharePercent/100;
						accounting.procesingCharge 			= 	accounting.totalFunds*procesingChargePercent/100;
						accounting.acutualCompanyShare 		= 	accounting.totalFunds - accounting.procesingCharge;
						accounting.homePromotionPurchase 	= 	results[0].homePromotionPurchase?results[0].homePromotionPurchase:0;
						accounting.socialPromotionPurchase 	= 	results[0].socialPromotionPurchase?results[0].socialPromotionPurchase:0;
						accounting.totalCompanyEarning 		= 	accounting.acutualCompanyShare + 
																accounting.homePromotionPurchase + 
																accounting.socialPromotionPurchase;
						accounting.taxesForUser 			= 	accounting.userShare*taxesForUserPercent/100;
						accounting.balanceFund		 		= 	accounting.totalFunds - 
																accounting.companyShare -
																accounting.procesingCharge -
																accounting.taxesForUser;
						accounting.fundDispersed 			=	results[0].fundDispersed?results[0].fundDispersed:0;
						accounting.balanceWithTheCompany	= 	accounting.userShare - accounting.fundDispersed;

					}
					res.status(200).send(accounting);
				});
			} catch(e) {
				console.log(e);
				res.status(500).send(e);
			}
		}
	});
	
	/*Get accounting details based on projectId*/
	app.get('/admin/report/accounting/:projectId', function (req, res) {
		var admin = req.query;
		var projectId = req.params.projectId;
		var userSharePercent = 90;
		var companySharePercent = 7;
		var procesingChargePercent = 2;
		var taxesForUserPercent = 15;
		var accounting = {
			totalFunds: 0,
			userShare: 0,
			companyShare: 0,
			procesingCharge: 0,
			acutualCompanyShare: 0,
			homePromotionPurchase: 0,
			socialPromotionPurchase: 0,
			totalCompanyEarning: 0,
			taxesForUser: 0,
			balanceFund: 0,
			fundDispersed: 0,
			balanceWithTheCompany: 0
		}
		
		try {
			dbConnection.query('SELECT (SELECT COALESCE(SUM(amount),0) FROM (SELECT amount from payments WHERE txnStatus="TXN_SUCCESS" AND purpose="DONATION" AND projectId=?)AS totalFunds )AS totalFunds, (SELECT COALESCE(SUM(amount),0) FROM (SELECT amount from payments WHERE txnStatus="TXN_SUCCESS" AND purpose="HOME_PROMOTION" AND projectId=?)AS homePromotionPurchase )AS homePromotionPurchase, (SELECT COALESCE(SUM(amount),0) FROM (SELECT amount from payments WHERE txnStatus="TXN_SUCCESS" AND purpose="SOCIAL_PROMOTION" AND projectId=?)AS homePromotionPurchase )AS socialPromotionPurchase', [projectId, projectId, projectId], function (error, results, fields) {
				if (error) {
					console.log(error);
					res.status(500).send("Internal Server Error.");
					return;
				}
				if(results.length) {
					accounting.totalFunds 				=	results[0].totalFunds?results[0].totalFunds:0;
					accounting.userShare 				= 	accounting.totalFunds*userSharePercent/100;
					accounting.companyShare 			= 	accounting.totalFunds*companySharePercent/100;
					accounting.procesingCharge 			= 	accounting.totalFunds*procesingChargePercent/100;
					accounting.acutualCompanyShare 		= 	accounting.totalFunds - accounting.procesingCharge;
					accounting.homePromotionPurchase 	= 	results[0].homePromotionPurchase?results[0].homePromotionPurchase:0;
					accounting.socialPromotionPurchase 	= 	results[0].socialPromotionPurchase?results[0].socialPromotionPurchase:0;
					accounting.totalCompanyEarning 		= 	accounting.acutualCompanyShare + 
															accounting.homePromotionPurchase + 
															accounting.socialPromotionPurchase;
					accounting.taxesForUser 			= 	accounting.userShare*taxesForUserPercent/100;
					accounting.balanceFund		 		= 	accounting.totalFunds - 
															accounting.companyShare -
															accounting.procesingCharge -
															accounting.taxesForUser;
					accounting.fundDispersed 			=	results[0].fundDispersed?results[0].fundDispersed:0;
					accounting.balanceWithTheCompany	= 	accounting.userShare - accounting.fundDispersed;

				}
				res.status(200).send(accounting);
			});
		} catch(e) {
			console.log(e);
			res.status(500).send(e);
		}
	});
	
	/*Get likes by weekwise*/
	app.get('/admin/report/likes/weekly', function (req, res) {
		var admin = req.query;
		var likes = {};
		try {
			dbConnection.query("SELECT WEEK(likedOn) week, COUNT(likeId) as count, CONCAT(DATE_FORMAT(DATE_ADD(likedOn, INTERVAL(1-DAYOFWEEK(likedOn)) DAY),'%b %d'), ' - ', DATE_FORMAT(DATE_ADD(likedOn, INTERVAL(7-DAYOFWEEK(likedOn)) DAY),'%b %d')) AS DateRange FROM likes WHERE projectId=? GROUP BY YEARWEEK(likedOn)", [admin.projectId], function (error, results, fields) {
				if (error) {
					console.log(error);
					res.status(500).send("Internal Server Error.");
					return;
				}
				likes.weekly = results.length ? results : {};
				dbConnection.query("SELECT count(likeId) as total FROM likes WHERE projectId = ?", [admin.projectId], function (error, results, fields) {
					if (error) {
						console.log(error);
						res.status(500).send("Internal Server Error.");
						return;
					}
					likes.count = results.length ? results[0] : 0;
					res.status(200).send(likes);
				});
			});
		} catch(e) {
			console.log(e);
			res.status(500).send(e);
		}
	});
	
	
	/*Get views by weekwise*/
	app.get('/admin/report/views/weekly', function (req, res) {
		var admin = req.query;
		var views = {};
		try {
			dbConnection.query("SELECT WEEK(viewedOn) week, COUNT(viewId) as count, CONCAT(DATE_FORMAT(DATE_ADD(viewedOn, INTERVAL(1-DAYOFWEEK(viewedOn)) DAY),'%b %d'), ' - ', DATE_FORMAT(DATE_ADD(viewedOn, INTERVAL(7-DAYOFWEEK(viewedOn)) DAY),'%b %d')) AS DateRange FROM views WHERE projectId=? GROUP BY YEARWEEK(viewedOn)", [admin.projectId], function (error, results, fields) {
				if (error) {
					console.log(error);
					res.status(500).send("Internal Server Error.");
					return;
				}
				views.weekly = results.length ? results : {};
				dbConnection.query("SELECT count(viewId) as total FROM views WHERE projectId=?", [admin.projectId], function (error, results, fields) {
					if (error) {
						console.log(error);
						res.status(500).send("Internal Server Error.");
						return;
					}
					views.count = results.length ? results[0] : 0;
					res.status(200).send(views);
				});
			});
		} catch(e) {
			console.log(e);
			res.status(500).send(e);
		}
	});
	
	
	/*Get payments by weekwise*/
	app.get('/admin/report/payments/weekly', function (req, res) {
		var admin = req.query;
		try {
			dbConnection.query("SELECT WEEK(txnDate) week, SUM(amount) as total, CONCAT(DATE_FORMAT(DATE_ADD(txnDate, INTERVAL(1-DAYOFWEEK(txnDate)) DAY),'%b %d'), ' - ', DATE_FORMAT(DATE_ADD(txnDate, INTERVAL(7-DAYOFWEEK(txnDate)) DAY),'%b %d')) AS DateRange FROM payments WHERE projectId=? AND txnStatus='TXN_SUCCESS' AND purpose='DONATION' GROUP BY YEARWEEK(txnDate)", [admin.projectId], function (error, results, fields) {
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
	
	
	/*Get payments by weekwise*/
	app.get('/admin/report/payments/moneyraised', function (req, res) {
		var admin = req.query;
		try {
			dbConnection.query("SELECT firstName, amount, DATE_FORMAT(txnDate, '%b %d %Y') as transDate FROM payments WHERE projectId=? AND txnStatus='TXN_SUCCESS' AND purpose='DONATION'", [admin.projectId], function (error, results, fields) {
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
	
}
