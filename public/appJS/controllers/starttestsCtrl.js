'use strict';
backMe.controller('starttestsCtrl', ['$scope', 'BaseServices', '$timeout', '$state', 'appConstant', function(_scope, _services, _timeout, _state, _appConstant){

	console.log('starttestsCtrl');

	_scope.courseCode = _state.params.courseId;
    _scope.loggedUserId = _appConstant.currentUser.userId;
	if(!_appConstant.currentUser.userId) {
		_state.go('home');
	}
    _scope.instructor = {};
	_scope.course = {};
	
	_scope.init = function() {
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'subscribed/tests/' + _scope.courseCode +'?userId='+_scope.loggedUserId
		}, function(data){
			_scope.course = data;
			if(_scope.course.length == 0) {
			//	_state.go('home');
			}
			_scope.course = _scope.course[0];
			_scope.courseId = _scope.course.courseId;
			_scope.instructor = _scope.course.instructor ? _scope.course.instructor[0]:{};
		//	_scope.getComments();
			
		}, function(err) {
			console.log(err)
			//_state.go('home');
		});
	}
	_scope.init();
	


	
}]);