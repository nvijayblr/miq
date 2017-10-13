'use strict';
backMe.controller('appCtrl', ['$scope', 'BaseServices', '$timeout', '$rootScope', '$window', '$state', '$mdToast', 'appConstant', 'Facebook', '$http', '$anchorScroll', '$location', 'socialLoginService', function(_scope, _services, _timeout, _rootScope, _window, _state, _mdToast, _appConstant, Facebook, _http, _anchorScroll, _location, _socialLoginService){
	console.log('appCtrl');
	_scope.appConstant = _appConstant;
	_scope.isAdmin = false;
	_rootScope.isAdminLoginPage = false;	
	_scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
		_scope.isAdmin = false;
		if(toState.name.substr(0,5) == 'admin') {
			_scope.isAdmin = true;
		}
	});
	
	_scope.loginSettings = {
		email : '',
		password: ''
	}
	_scope.signUpSettings = {
		email : '',
		password: '',
		name: '',
		agree: false
	}
	
	_scope.loggedUser = {};
	_scope.loggedIn = false;
	_scope.showPassword = true;
	_scope.showSearch = false;

	/*_scope.categoryList = [];
	_scope.initCategoryList = function() {
		_scope.categoryList = [];
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'category'
		}, function(data){
			_scope.categoryList = data;
		}, function(err) {
			console.log(err)
		});
	}
	_scope.initCategoryList();
	
	
	_scope.bankList = [];
	_scope.initBankList = function() {
		_scope.selectAll = false;
		_scope.bankList = [];
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'banks'
		}, function(data){
			_scope.bankList = data;
		}, function(err) {
			console.log(err)
		});
	}
	_scope.initBankList();*/

	/*Autocomplete - City related functions*/
	_scope.cityList = {};
	_scope.loadAllCities = function(_callback) {
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'cities'
		}, function(data){
			_scope.cityList = data.map( function (_obj) {
				return {
					value: _obj.city.toLowerCase(),
					display: _obj.city
				};
			});
			return _callback(_scope.cityList);
		}, function(err) {
		});
    }	
	
	_rootScope.projectCreated = false;
	
	if(_appConstant.currentUser != '') {
		_scope.loggedUser = _appConstant.currentUser;
		_scope.loggedIn = true;
	} else {
		_appConstant.currentUser = {};
	}

	//Begin the Search related functions
	_scope.projects = {};
	_scope.serach = {
		serachBox: ''
	};
	_scope.searchKeywords = [];
	_scope.categoryKey = '';
	_scope.isSerchPage = false;
	_scope.searchProjects = function(_query) {
		_scope.isSeeAll = false;
		_scope.categoryKey = _query;
		_scope.projects = [];
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'search?q='+_query+'&userId='+_appConstant.currentUser.userId
		}, function(data){
			_scope.projects = data;
			_scope.pageSize = 6;
			_services.pagination.init(_scope, _scope.projects);
		}, function(err) {
			console.log(err)
		});
	}
	//_scope.searchProjects('');
	_scope.isSeeAll = false;
	_scope.seeAll = function(_type) {
		_scope.type = _type;
		_scope.isSerchPage = true;
		_scope.isSeeAll = true;
		_scope.projects = [];
		_scope.category = '';
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'all?q='+_type+'&userId='+_appConstant.currentUser.userId
		}, function(data){
			_scope.projects = data[_type];
			_scope.pageSize = 6;
			_services.pagination.init(_scope, _scope.projects);
			/*_location.hash('banner');
			_anchorScroll();*/
			$('#backme-page').scrollTop(0);
		}, function(err) {
			console.log(err)
		});
	}
	
	_scope.loadFaouriteProjects = function() {
		_scope.isSerchPage = true;
		_scope.isSeeAll = true;
		_scope.projects = [];
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'favourites?userId=' + _appConstant.currentUser.userId
		}, function(data){
			_scope.projects = data;
			_scope.pageSize = 6;
			_services.pagination.init(_scope, _scope.projects);
		}, function(err) {
			console.log(err)
		});
	}
	
	_scope.location = {
		projects: {}
	}
	
	_scope.gotoDashboard = function() {
		$("#freeSubscribe").modal('hide');
		_timeout(function() {
			_state.go('dashboard', {userId: _appConstant.currentUser.userId});
		}, 1000);
	}
	
	_scope.viewCourse = function(_subscribtion) {
		$("#freeSubscribe").modal('hide');
		_timeout(function() {
			_state.go('subscriptions.course', {courseId: _subscribtion.code});
		}, 1000);
	}
	
	/*cart related functions*/
	_scope.actionOnAfterLogin = function() {
		if(_scope.signupFrom == 'cart') {
			_timeout(function() {
				_scope.addtoCart(_scope.signupObj);
			}, 1000);
		}
		if(_scope.signupFrom == 'buy') {
			_timeout(function() {
				_state.go('checkout', {courseId: _scope.signupObj.code});
			}, 1000);
		}
		if(_scope.signupFrom == 'subscribe') {
			_timeout(function() {
				_scope.subscribeNow(_scope.signupObj);
			}, 1000);
		}
		_scope.signupFrom = '';
	}

	_scope.signupFrom = '';
	_scope.signupObj = {};
	_rootScope.cartCount = 0;
	
	_scope.buyNow = function(_course) {
		if(!_appConstant.currentUser.userId) {
			_scope.signupObj = _course;
			_scope.showLogin('buy');
			return;
		}
		_state.go('checkout', {courseId: _course.code});
	}
	
	_scope.addtoCart = function(_course) {
		if(!_appConstant.currentUser.userId) {
			_scope.signupObj = _course;
			_scope.showLogin('cart');
			return;
		}
		_scope.data = {
			courseId: _course.courseId,
			userId: _appConstant.currentUser.userId
		}
		_services.http.serve({
			method: 'PUT',
			url: _appConstant.baseUrl + 'cart',
			inputData: _scope.data
		}, function(data){
			if(data.res == 'ADDED') {
				_rootScope.cartCount = _rootScope.cartCount + 1;
				//_services.toast.show('course/test added into your cart.');
			} else {
				_services.toast.show('course/test already added into your cart.');
			}
		}, function(err) {
			console.log(err)
		});
	}
	
	_scope.subscribtion = {};
	_scope.showSubscribtionModal = function(_course) {
		_course.hours = 0;
		if(_course.subjects) {
			for(var i=0; i<_course.subjects.length; i++) {
				_course.hours = _course.hours + parseInt(_course.subjects[i].minutes);
			}
		}
		_scope.subscribtion = _course;
		_scope.subscribtion.subscribed = 1;
		if(_scope.subscribtion.social) {
			_scope.subscribtion.social[0].subscribed = 1;
		} else {
			_scope.subscribtion.social = [];
		}
		$("#freeSubscribe").modal('show');
	}
	
	_scope.subscribeNow = function(_course) {
		if(!_appConstant.currentUser.userId) {
			_scope.signupObj = _course;
			_scope.showLogin('subscribe');
			return;
		}
		_scope.data = {
			courseId: _course.courseId,
			userId: _appConstant.currentUser.userId,
			status: 'ACTIVE'
		}
		_services.http.serve({
			method: 'PUT',
			url: _appConstant.baseUrl + 'freesubscribtions',
			inputData: _scope.data
		}, function(data){
			if(data.results && data.results == 'ALREADYSUBSCRIBED') {
				_services.toast.show('course/test has already subscribed.');
				return;
			}
			_scope.showSubscribtionModal(_course);
		}, function(err) {
			console.log(err);
			_services.toast.show('course/test subscribtion failed. Please try again.');
		});
	}
	
	_scope.loadCart = function() {
		if(!_appConstant.currentUser.userId) {
			return;
		}
		_scope.cart = [];
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'cart?userId=' + _appConstant.currentUser.userId
		}, function(data){
			_scope.cart = data;
			_rootScope.cartCount = data.length;
		}, function(err) {
			console.log(err)
		});
	}
	_scope.loadCart();
	
	_scope.showCartPage = function() {
		if(_scope.cartCount) {
			_state.go('checkout', {courseId:'cart'});
		}
	}
	
	_scope.searchKeywordsList = '';
	_scope.searchKeyPress = function(_keyEvent) {
		if (_keyEvent.which == 13) {
			_scope.startSearch();
		}
	}
	$(document).on('keyup', ".md-chip-input-container input.md-input", function(e) {
		if(e.which == 27) {
			_scope.gotoHome();
		}
	});
	_scope.showSearchBar = function() {
		_scope.searchKeywords = [];
		_scope.showSearch = true;
		$(".md-chip-input-container input.md-input").eq(0).focus();
	}
	
	_scope.closeSearch = function() {
		_scope.showSearch = false;
		_scope.searchProjects('');
		_scope.isSerchPage = false;
		_scope.searchKeywords = [];
	}
	_scope.startSearch = function() {
		if($(".md-chip-input-container input.md-input").eq(0).val()) {
			_scope.searchKeywords.push($(".md-chip-input-container input.md-input").eq(0).val());
			$(".md-chip-input-container input.md-input").eq(0).val('');
		}
		if(_scope.searchKeywords.length) {
			if(_state.current.url != '/home') {
				_state.go('home');
			}
			location.href="/#/home?search="+_scope.searchKeywords.join(',')
			_scope.isSerchPage = true;
			_scope.searchKeywordsList = _scope.searchKeywords.join(', ')
			_scope.searchProjects(_scope.searchKeywords.join('|'));
		}
	}
	if(location.href.split('?search=')[1]) {
		_scope.showSearchBar()
		_scope.searchKeywords = location.href.split('?search=')[1].split(',');
		_scope.startSearch();
	}
	
	_scope.gotoHome = function() {
		if(_scope.isSerchPage) {
			_scope.closeSearch();
			location.href="/#/home";
			_scope.$broadcast('loadInitProjects');
		} else {
			_state.go('home');
			_scope.$broadcast('loadInitProjects');
		}
		_scope.isFavouritePage = false;
	}
	_scope.isFavouritePage = false;
	_scope.gotoFavourites = function() {
		if(_state.current.name == 'home') {
			location.href="/#/home?favourites";
			_scope.loadFaouriteProjects();
		} else {
			_scope.isSerchPage = false;
			location.href="/#/home?favourites";
		}
		_scope.isFavouritePage = true;
	}

	//End of the Search related functions
	
	_scope.showLogin = function(_signupFrom) {
		_scope.app.loginForm.$setPristine();
		_scope.app.loginForm.$setUntouched();
		_scope.app.loginForm.$submitted = false;
		_scope.signupFrom = _signupFrom;
		_scope.loginSettings = {
			email : '',
			password: ''
		}
		_scope.showPassword = true;
		$('#signUpModal').modal('hide');
		$('#loginModal').modal('show');
	}
	_scope.showSignUp = function(_signupFrom) {
		_scope.app.signupForm.$setPristine();
		_scope.app.signupForm.$setUntouched();
		_scope.app.signupForm.$submitted = false;
		_scope.signupFrom = _signupFrom;
		_scope.signUpSettings = {
			email : '',
			password: '',
			name: '',
			agree: false
		}
		_scope.showPassword = true;
		$('#loginModal').modal('hide');
		$('#signUpModal').modal('show');
	}
	
	_scope.showSignUpComplete = function() {
		$('#signUpModal').modal('hide');
		$('#signUpFinishModal').modal('show');
	}
	
	_scope.showHidePassword = function() {
		_scope.showPassword = !_scope.showPassword;
	}

	_scope.startProject = function() {
		_state.go('create.startproject');
		/*if(_scope.loggedIn) {
			_state.go('create.startproject');
		} else {
			_scope.showLogin();
		}*/
	}
	
	_scope.appLogin = function(_email, _pass) {
		if(!_email || !_pass) {
			_services.toast.show('Please enter the Email or password');
			return;
		}
		_services.http.serve({
			method: 'POST',
			url: _appConstant.baseUrl + 'login',
			inputData: _scope.loginSettings
		}, function(data){
			_appConstant.currentUser = data[0];
			_appConstant.currentUser.name = _appConstant.currentUser.name?_appConstant.currentUser.name:_email;
			_scope.loggedUser = _appConstant.currentUser;
			//console.log(_appConstant.currentUser);
			localStorage.setItem('backMeUser', JSON.stringify(_appConstant.currentUser));
			_scope.loadCart();
			_scope.gotoHome();
			_scope.loggedIn = true;
			$('#loginModal').modal('hide');
			_scope.actionOnAfterLogin();
		}, function(err){
			_services.toast.show('Invalid Email/Password.');
		});
	}
	
	_scope.finishSignup = function(_email, _pass, _name) {
		if(!_email || !_pass) {
			_services.toast.show('Email/Password should not be blank.');
			return;
		}
		/*_scope.signUpData = {
			email : _email,
			password: _pass,
			name: _name
		}*/
		_scope.signUpData = {
			email : _email,
			password: _pass
		}
		$('#signUpFinishModal').modal('hide');
		_services.http.serve({
			method: 'POST',
			url: _appConstant.baseUrl + 'signup',
			inputData: _scope.signUpData
		}, function(res){
			$('#signUpModal').modal('hide');
			$('#signUpFinishModal').modal('hide');
			_appConstant.currentUser.name = _email;
			_appConstant.currentUser.email = _email;
			_appConstant.currentUser.userId = res.insertId;
			console.log(_appConstant.currentUser)
			_scope.loggedUser = _appConstant.currentUser;
			localStorage.setItem('backMeUser', JSON.stringify(_appConstant.currentUser));
			_scope.loadCart();
			_scope.gotoHome();
			_scope.loggedIn = true;
			_services.toast.show('<img src="../assets/icons/checked.png" class="toast-tick"/>Your account has created successfully.');
			_scope.actionOnAfterLogin();
		}, function(err) {
			_services.toast.show(err.data);
		});
	}
	
	_scope.appSignup = function(_email, _pass, _name) {
		_scope.finishSignup(_email, _pass, _name);
		//$('#signUpModal').modal('hide');
		//$('#signUpFinishModal').modal('show');
	}

	_scope.showForgetPassword = function() {
		_scope.signUpSettings.email = '';
		$('#loginModal').modal('hide');
		$('#signUpModal').modal('hide');
		$('#forgetPasswordModal').modal('show');
	}

	_scope.appForgetPassword = function(_email) {
		if(!_email) return;
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'forgotpassword/'+_email
		}, function(res){
			$('#forgetPasswordModal').modal('hide');
			if(res=='EMAILNOTFOUND')
				_services.toast.show('Email not found.');
			else
				_services.toast.show('Temporary password has been sent to your email.');
		}, function(err) {
			_services.toast.show(err.data);
		});
	}
	
	/*Begin the google sign in*/
	var auth2; 
	$(window).load(function() {
		gapi.load('auth2', function(){
			auth2 = gapi.auth2.init({
				client_id: _appConstant.googleClientId + '.apps.googleusercontent.com',
				cookiepolicy: 'single_host_origin',
				scope: 'https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/userinfo.email'
			});
			_scope.attachGoogleLogin(document.getElementById('googleLogin'));
			_scope.attachGoogleLogin(document.getElementById('googleSignup'));
		});

		_scope.attachGoogleLogin = function (element) {
			auth2.attachClickHandler(element, {},
				function(googleUser) {
					_scope.googleLoginSuccess(googleUser);
				}, function(error) {
					_scope.googleLoginFailure(error);
				}
			);
		}
	});
	
	_scope.profile = {};
	_scope.googleUser = {
		name: '',
		email: '',
		profilePicture: ''
	}
	_scope.socialLogin = function(_email, _type) {
		if(!_email || !_type) {
			_services.toast.show('Please enter the Email/login type.');
			return;
		}
		_scope.socialLoginData = {
			email: _email,
			loginType: _type
		}
		_services.http.serve({
			method: 'POST',
			url: _appConstant.baseUrl + 'loginsocial',
			inputData: _scope.socialLoginData
		}, function(data){
			_appConstant.currentUser = data[0];
			_appConstant.currentUser.name = _appConstant.currentUser.name?_appConstant.currentUser.name:_email;
			_scope.loggedUser = _appConstant.currentUser;
			localStorage.setItem('backMeUser', JSON.stringify(_appConstant.currentUser));
			_scope.loadCart();
			_scope.gotoHome();
			_scope.loggedIn = true;
			$('#signUpModal').modal('hide');
			$('#loginModal').modal('hide');
			_scope.actionOnAfterLogin();
		}, function(err){
			_services.toast.show('Invalid Email/Password.');
		});
	}
	
	_scope.googleLoginSuccess = function(_googleUser) {
		_scope.accessToken = _googleUser.Zi.access_token;
		_scope.profile = _googleUser.getBasicProfile();
		_scope.googleUser = {
			name: _scope.profile.getName(),
			email: _scope.profile.getEmail(),
			profilePicture: _scope.profile.getImageUrl(),
			loginType: 'GOOGLE',
			googleplus: _scope.profile.getId()
		}
		_services.http.serve({
			method: 'POST',
			url: _appConstant.baseUrl + 'signupsocial',
			inputData: _scope.googleUser
		}, function(res){
			_appConstant.currentUser.name = _scope.googleUser.name;
			_appConstant.currentUser.email = _scope.googleUser.email;
			_appConstant.currentUser.userId = res.insertId;
			_appConstant.currentUser.profilePicture = _scope.googleUser.profilePicture;
			_appConstant.currentUser.loginType = 'GOOGLE';
			_scope.loggedUser = _appConstant.currentUser;
			localStorage.setItem('backMeUser', JSON.stringify(_appConstant.currentUser));
			_scope.loadCart();
			_scope.gotoHome();
			_scope.loggedIn = true;
			_services.toast.show('<img src="../assets/icons/checked.png" class="toast-tick"/>Your account has created successfully.');
			$('#signUpModal').modal('hide');
			$('#loginModal').modal('hide');
			_scope.actionOnAfterLogin();
		}, function(err) {
			console.log(_scope.googleUser.email);
			if(err.data == 'ER_DUP_ENTRY') {
				_scope.socialLogin(_scope.googleUser.email, 'GOOGLE');
			} else {
				_services.toast.show(err.data);
			}
		});
	}
	
	_scope.googleLoginFailure = function(obj) {
		console.log(obj)
	}
	
	/*log out from app, google, fb*/
	_scope.doLogout = function() {
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'logout'
		}, function(data){
			_appConstant.currentUser = {};
			_scope.loggedUser = {};
			_scope.loggedIn = false;
			localStorage.removeItem('backMeUser');
			_rootScope.cartCount = 0;
			gapi.auth2.getAuthInstance().disconnect().then(function(){
				_appConstant.currentUser = {};
				_scope.loggedUser = {}
				_scope.$apply();
			});
			Facebook.logout(function() {
				_scope.$apply(function() {
					_scope.loggedUser = {}
				});
			});
			_scope.loadCart();
			_scope.gotoHome();
		}, function(err){
			console.log(err);
		});
	}
	
	_window.renderGoogleButton = function() {
		gapi.signin2.render('googleLogin', {
			'scope': 'profile email',
			'width': 240,
			'height': 50,
			'longtitle': true,
			'theme': 'dark',
			'onsuccess': _scope.googleLoginSuccess,
			'onfailure': _scope.googleLoginFailure
		});
    }
	/*End the google sign in*/
	
	/*begin the facebook login*/
	_scope.facebookLoginSuccess = function(_fbUser) {
		_scope.fbUser = {
			name: _fbUser.name,
			email: _fbUser.email ? _fbUser.email : _fbUser.id,
			loginType: 'FACEBOOK',
			profilePicture: _fbUser.picture.data.url ? _fbUser.picture.data.url : '',
			facebook: _fbUser.id
		}
		_services.http.serve({
			method: 'POST',
			url: _appConstant.baseUrl + 'signupsocial',
			inputData: _scope.fbUser
		}, function(res){
			_appConstant.currentUser.name = _fbUser.name;
			_appConstant.currentUser.email = _fbUser.id;
			_appConstant.currentUser.userId = res.insertId;
			_appConstant.currentUser.loginType = 'FACEBOOK';
			_scope.loggedUser = _appConstant.currentUser;
			localStorage.setItem('backMeUser', JSON.stringify(_appConstant.currentUser));
			_scope.loadCart();
			_scope.gotoHome();
			_scope.loggedIn = true;
			_services.toast.show('<img src="../assets/icons/checked.png" class="toast-tick"/>Your account has created successfully.');
			$('#signUpModal').modal('hide');
			$('#loginModal').modal('hide');
			_scope.actionOnAfterLogin();
		}, function(err) {
			if(err.data == 'ER_DUP_ENTRY') {
				_scope.socialLogin(_scope.fbUser.email, 'FACEBOOK');
			} else {
				_services.toast.show(err.data);
			}
		});
	}

	_scope.$watch(
		function() {
		  return Facebook.isReady();
		},
		function(newVal) {
		  if (newVal)
			_scope.facebookReady = true;
		}
	);
      
	_scope.userIsConnectedInFB = false;

	_scope.getFacebookUser = function() {
		Facebook.api('/me', {fields: ['name', 'link', 'email', 'picture']}, function(response) {
			console.log(response);
			_scope.facebookLoginSuccess(response);
		});
	}
	
	/*Facebook.getLoginStatus(function(response) {
		if (response.status == 'connected') {
			_scope.$apply(function() {
				_scope.userIsConnectedInFB = true;
			});
			_scope.getFacebookUser(response);
		}
	});*/
      
	_scope.loginWithFacebook = function() {
		if(!_scope.userIsConnectedInFB) {
			Facebook.login(function(response) {
				if (response.status == 'connected') {
					_scope.getFacebookUser(response);
				}
			});
		}
	};
  /*end the facebook login*/	
	/*Begin the common functions for the application*/
	$(document).off('hidden.bs.modal');
	$(document).on('hidden.bs.modal', function () {
		if($(".modal.fade.in").length > 0) {
			$('body').addClass('modal-open');
		}
		if(!$(".modal.fade.in").length) {
			$('body').css('padding-right',0);
		}
	});
	
	_rootScope.$on("$locationChangeSuccess", function (event, currentRoute, previousRoute) {
		$('#backme-page').scrollTop(0);
	});
	$("body").on('click', '.pagination-link', function() {
		$('#backme-page').scrollTop(0);
	});
	/*End the common functions for the application*/

}]);

