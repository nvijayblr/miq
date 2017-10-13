'use strict';
backMe.controller('adminCtrl', ['$scope', 'BaseServices', 'appConstant', '$timeout', '$state', 'Upload', '$rootScope', function(_scope, _services, _appConstant, _timeout, _state, _http, _rootScope){
	
	console.log('adminCtrl...');

	if(_appConstant.currentAdmin == '' || angular.equals(_appConstant.currentAdmin, {})) {
		_state.go('adminLogin');
		return false;
	}
	_scope.isSuperAdmin = false;
	if(_appConstant.currentAdmin.role == 'SUPERADMIN') {
		_scope.isSuperAdmin = true;
	}
	
	_rootScope.adminTab = 'dashboard';
	_rootScope.isAdminLoginPage = false;	
	
	_rootScope.logoutAdmin = function() {
		localStorage.removeItem('backMeAdmin');
		_appConstant.currentAdmin = {};
		_state.go('adminLogin');
	}

}]);

