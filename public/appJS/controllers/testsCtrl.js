'use strict';
backMe.controller('testsCtrl', ['$scope', 'BaseServices', '$timeout', '$state', 'appConstant', function(_scope, _services, _timeout, _state, _appConstant){

	console.log('testsCtrl');

	_scope.courseCode = _state.params.courseId;
    _scope.loggedUserId = _appConstant.currentUser.userId;
    _scope.instructor = {};
	_scope.course = {};
   
	_scope.init = function() {
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'views/tests/' + _scope.courseCode +'?userId='+_scope.loggedUserId
		}, function(data){
			_scope.course = data;
			if(_scope.course.length == 0) {
				_state.go('home');
				return;
			}
			_scope.course = _scope.course[0];
			_scope.courseId = _scope.course.courseId;
			_scope.instructor = _scope.course.instructor ? _scope.course.instructor[0]:{};
			console.log(_scope.instructor);
			_scope.getComments();
		}, function(err) {
			console.log(err)
		});
	}
	_scope.init();
    
    _scope.comments = {};
    _scope.getComments = function(_comment, _projectId) {
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'comments/'+_scope.courseId
		}, function(data){
           _scope.comments = data;
		}, function(err) {
		});
    }
    
    _scope.addComment = function(_comment, _courseId) {
        if(!_scope.loggedUserId)
            return;
		_services.http.serve({
			method: 'PUT',
			url: _appConstant.baseUrl + 'comments',
            inputData: {courseId: _courseId, userId: _scope.loggedUserId, comment: _comment}
		}, function(data){
           _services.toast.show('Comment added successfully.');
           _scope.getComments();
           _scope.comment.commentInput = "";
		}, function(err) {
		});
    }
	
	_scope.abuse = {
		option: 'SPAMCONTENT'
	};
	_scope.abusedComment = {};
	_scope.showAbuseModel = function(_comment) {
		_scope.abusedComment = _comment;
		$('#AbuseModel').modal('show');
	}
	
	_scope.submitAbuse = function(_option) {
		_scope.abusedComment.abusedType = _option;
		_scope.abusedComment.abusedBy = _appConstant.currentUser.userId;
		_scope.abusedComment.abusedOn = moment().format('YYYY-MM-DD HH:mm:ss');
		_scope.abusedComment.abused = 'true';
		console.log(_scope.abusedComment);
		_services.http.serve({
			method: 'PUT',
			url: _appConstant.baseUrl + 'admin/comments/abused',
			inputData: _scope.abusedComment
		}, function(data) {
			_services.toast.show('Abuse submitted successfully.');
			$('#AbuseModel').modal('hide');
			_scope.getComments();
		}, function(err) {
			$('#AbuseModel').modal('hide');
		});
	}
	
}]);