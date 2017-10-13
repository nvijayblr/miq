'use strict';
backMe.controller('subscriptionsCourseCtrl', ['$scope', 'BaseServices', '$timeout', '$state', 'appConstant', function(_scope, _services, _timeout, _state, _appConstant){

	console.log('subscriptionsCourseCtrl');

	_scope.courseCode = _state.params.courseId;
    _scope.loggedUserId = _appConstant.currentUser.userId;
	if(!_appConstant.currentUser.userId) {
		_state.go('home');
	}
    _scope.instructor = {};
	_scope.course = {};
	_scope.youtube = {
		youtubeId: '',
		playerVars: { 
			'html5': 1,
			'rel': 0,
			'playsinline': 1,
			'autoplay': 1,
			'controls': 1, 
			'enablejsapi': 1,
			'showinfo': 0,
			'suggestedQuality': 'hd720',
			'wmode': 'transparent'
		}
	};
    _scope.ytPlayer = {};
	_scope.youtube.youtubeId = '';
	_scope.init = function() {
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'subscribed/course/' + _scope.courseCode +'?userId='+_scope.loggedUserId
		}, function(data){
			_scope.course = data;
			if(_scope.course.length == 0) {
				_state.go('home');
			}
			_scope.course = _scope.course[0];
			_scope.courseId = _scope.course.courseId;
			_scope.instructor = _scope.course.instructor ? _scope.course.instructor[0]:{};
			_scope.getComments();
			
		}, function(err) {
			console.log(err)
			_state.go('home');
		});
	}
	_scope.init();
	
	_scope.prevVideoObj = {};
	_scope.loadVideo = function(_video) {
		_scope.prevVideoObj.playing = false;
		if(_video.youtubeId) {
			_video.playing = true;
			_scope.youtube.youtubeId = _video.youtubeId;
			$('#backme-page').scrollTop(0);
			//_scope.ytPlayer.playVideo();
		}
		_scope.prevVideoObj = _video;
	}
	
	_scope.$on('youtube.player.ended', function ($event, player) {
		_scope.history = {
			chId: _scope.prevVideoObj.coursehistory?_scope.prevVideoObj.coursehistory.length ? _scope.prevVideoObj.coursehistory[0].chId : 0:0,
			userId: _scope.loggedUserId,
			courseId: _scope.prevVideoObj.courseId,
			subjectId: _scope.prevVideoObj.subjectId,
			videoId: _scope.prevVideoObj.videoId
		}
		_services.http.serve({
			method: 'PUT',
			url: _appConstant.baseUrl + 'coursehistory',
			inputData: _scope.history
		}, function(data){
			_scope.history.chId = data.insertId;
			_scope.prevVideoObj.coursehistory = [_scope.history];
		}, function(err) {
			console.log(err)
		});
	});

	_scope.status = function(_p) {
		_services.http.serve({
			method: 'PUT',
			url: _appConstant.baseUrl + 'updatevideostatus'
		}, function(data){
			console.log(data);
		}, function(err) {
			console.log(err)
		});
	}

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