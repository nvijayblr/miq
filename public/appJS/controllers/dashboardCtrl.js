'use strict';
backMe.controller('dashboardCtrl', ['$scope', 'BaseServices', 'appConstant', '$timeout', '$state', 'Upload', '$rootScope', function(_scope, _services, _appConstant, _timeout, _state, _http, _rootScope){

	_scope.userId = _state.params.userId;
	if(_appConstant.currentUser == '' || angular.equals(_appConstant.currentUser, {}) || _scope.userId != _appConstant.currentUser.userId) {
		_state.go('home');
		return false;
	}
	_scope.user = {};
	_scope.curUser = false;
	if(_scope.userId == _appConstant.currentUser.userId) _scope.curUser = true;

	_scope.title = [];
	_scope.title['topPaidCourses'] = 'Paid Courses';
	_scope.title['topFreeCourses'] = 'Free Courses';
	_scope.title['topPaidTests'] = 'Paid Tests';
	_scope.title['topFreeTests'] = 'Free Tests';
	
	_scope.getUserInfo = function() {
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'users/'+_scope.userId
		}, function(data){
			_scope.user = data[0];
			if(_appConstant.currentUser.userId == _scope.user.userId) {
				_scope.user._APISID = _appConstant.currentUser._APISID;
				_scope.user._BPISID = _appConstant.currentUser._BPISID;
				_scope.user._CPISID = _appConstant.currentUser._CPISID;
				localStorage.setItem('backMeUser', JSON.stringify(_scope.user));
				_appConstant.currentUser = _scope.user;
			}
		}, function(err) {
			console.log(err)
		});
	}
	_scope.getUserInfo();
	
	_scope.getCoursesByUser = function() {
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'mysubscriptions?userId='+_scope.userId
		}, function(data){
			_scope.allSubscriptions = data;
			console.log(_scope.allSubscriptions);
		}, function(err) {
			console.log(err)
		});
	}
	_scope.getCoursesByUser();
	
	_scope.userProfilePhoto = null;

	_scope.updateUserProfile = function(_user) {
		if(_scope.userId != _scope.user.userId) return;
		if(_scope.userProfilePhoto) {
			_user.userProfilePhoto = _scope.userProfilePhoto;
		}
		if(_scope.userProfilePhoto) {
			_user.userProfilePhoto = _http.dataUrltoBlob(_scope.myCroppedProfileImage, _scope.userProfilePhoto.name);
		}
		_http.upload({
			method: 'POST',
			url: _appConstant.baseUrl + 'users',
			data: _user
		}).then(function (res) {
			_scope.user = res.data.user;
			localStorage.setItem('backMeUser', JSON.stringify(res.data.user));
			_scope.userProfilePhoto = undefined;
			_scope.myCroppedProfileImage = undefined;
			_services.toast.show('Profile updated successfully');
			_scope.getUserInfo();
		}, function (err) {
			_services.toast.show(err.data);
		});
	}
		
	/*Update password related functions*/
	_scope.userPassword = {
		password: '',
		newPassword: '',
		newPasswordVerify: ''
	}
	_scope.updateUserPassword = function(_userPassword) {
		/*if(_userPassword.password != _scope.user.password) {
			_services.toast.show('Your current password is invalid.');
			return;
		}*/
		if(_userPassword.newPassword != _userPassword.newPasswordVerify) {
			_services.toast.show('Your new password is mismatched.');
			return;
		}
		_userPassword.userId = _scope.user.userId;
		_services.http.serve({
			method: 'PUT',
			url: _appConstant.baseUrl + 'changepassword',
			inputData: _userPassword
		}, function(data){
			if(data=='INVALID') {
				_services.toast.show('Password mismatched.');
			} else {
				_services.toast.show('Password updated successfully.');
				_scope.userPasswordForm.$setPristine();
				_scope.userPasswordForm.$setUntouched();
				_scope.userPasswordForm.$submitted = false;
				_scope.userPassword = {
					password: '',
					newPassword: '',
					newPasswordVerify: ''
				}
			}
		}, function(err) {
			console.log(err)
		});
	}

	/*Autocomplete - City related functions*/
	_scope.cities = [];
	_scope.loadAllCities = function() {
		_scope.cities = [];
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'cities'
		}, function(data){
			for(var i=0; i<data.length; i++) {
				_scope.cities.push({
					value: data[i].city.toLowerCase(),
					display: data[i].city
				});
			}
		}, function(err) {
			console.log(err)
		});
    }
	//_scope.loadAllCities();

}]);

