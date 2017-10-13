'use strict';
backMe.controller('adminLoginCtrl', ['$scope', 'BaseServices', 'appConstant', '$timeout', '$state', 'Upload', '$rootScope', function(_scope, _services, _appConstant, _timeout, _state, _http, _rootScope){
	
	localStorage.removeItem('backMeAdmin');
	_appConstant.currentAdmin = {};
	
	console.log('adminLoginCtrl...');
	
	_rootScope.isAdminLoginPage = true;
	
	_scope.loginSettings = {
		email: '',
		password: ''
	}
	
	_scope.adminLogin = function(_admin) {
		if(!_admin.email || !_admin.password) {
			_services.toast.show('Please enter the Email or password');
			return;
		}
		_services.http.serve({
			method: 'POST',
			url: _appConstant.baseUrl + 'admin/login',
			inputData: _admin
		}, function(data){
			_appConstant.currentAdmin = data[0];
			localStorage.setItem('backMeAdmin', JSON.stringify(_appConstant.currentAdmin));
			_state.go('admin.dashboard');
		}, function(err){
			_services.toast.show('Invalid Email/Password.');
		});
	}

}]);

