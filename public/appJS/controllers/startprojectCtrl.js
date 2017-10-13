'use strict';
backMe.controller('startprojectCtrl', ['$scope', 'BaseServices', '$timeout', '$state', 'appConstant', function(_scope, _services, _timeout, _state, _appConstant){
	console.log('startprojectCtrl');
	if(!_scope.loggedIn && _state.current.url != '/startproject' && _state.current.url != '/basicinfo/:projectId') {
		_state.go('home');
	}
}]);