'use strict';
backMe.controller('homeCtrl', ['$scope', 'BaseServices', '$timeout', 'appConstant', function(_scope, _services, _timeout, _appConstant){
	
	//Call serach projects function in app.ctrl
	console.log('Home Ctrl...')
	_scope.title = [];
	_scope.title['topPaidCourses'] = 'Top Paid Courses';
	_scope.title['topFreeCourses'] = 'Top Free Courses';
	_scope.title['topPaidTests'] = 'Top Paid Tests';
	_scope.title['topFreeTests'] = 'Top Free Tests';
	
	_scope.init = function(_category) {
		_scope.categoryKey = _category;
		_scope.homeProjects = {};
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'all?q=all&limit=4&userId=' + _appConstant.currentUser.userId
		}, function(data){
			_scope.homeProjects = data;
		}, function(err) {
			console.log(err)
		});
	}
	
	/*_scope.homePagePromotion = function() {
		_scope.homePromotion = {};
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'homePagePromotion'
		}, function(data){
			_scope.homePromotion = data;
		}, function(err) {
			console.log(err)
		});
	}
	_scope.homePagePromotion();*/
	
	_scope.loadCategory = function(_category) {
		if(_category)
			location.href="/#/home?search-category="+_category;
		else
			location.href="/#/home";
		_scope.init(_category);
	}
	
	_scope.addtoFavourite = function(_course) {
		_scope.data = {
			courseId: _course.courseId,
			userId: _appConstant.currentUser.userId
		}
		_services.http.serve({
			method: 'PUT',
			url: _appConstant.baseUrl + 'favourites',
			inputData: _scope.data
		}, function(data){
			_services.toast.show('Course/Test added into your favourites.');
			_course.favCount = 1;
		}, function(err) {
			console.log(err)
		});
	}
	
	_scope.removeFromFavourite = function(_course) {
		_scope.data = {
			courseId: _course.courseId,
			userId: _appConstant.currentUser.userId,
			status: 'ACTIVE'
		}
		_services.http.serve({
			method: 'DELETE',
			url: _appConstant.baseUrl + 'favourites',
			inputData: _scope.data
		}, function(data){
			_services.toast.show('Course/Test removed from your favourites.');
			_course.favCount = 0;
		}, function(err) {
			console.log(err)
		});
	}
	if(location.href.split('?search-category=')[1]) {
		_scope.init(location.href.split('?search-category=')[1]);
	} else if(location.href.indexOf('?favourites') > 0) {
		_scope.loadFaouriteProjects();
	}else {
		_scope.init('');
	}
	
    _scope.$on('loadInitProjects', function(e) {  
		_scope.init('');
	});

}]);

