'use strict';
backMe.controller('adminAccountCtrl', ['$scope', 'BaseServices', 'appConstant', '$timeout', '$state', 'Upload', '$rootScope', '$filter', function(_scope, _services, _appConstant, _timeout, _state, _http, _rootScope, _filter){
	
	_rootScope.adminTab = 'account';
	_scope.admin = {};
	
	console.log(_appConstant.currentAdmin.adminId)
	_scope.init = function() {
		_scope.selectAll = false;
		_scope.admin = {};
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'admin/'+_appConstant.currentAdmin.adminId
		}, function(data){
			_scope.admin = data[0] ? data[0] : {};
			console.log(_scope.admin);
		}, function(err) {
			console.log(err)
		});
	}
	
	_scope.init();
	
	_scope.cityList = {};
	_scope.loadAllCities(function(cityList) {
		_scope.cityList = cityList;
	});
	
	_scope.registerAddEdit = function() {
		_services.http.serve({
			method: 'PUT',
			url: _appConstant.baseUrl + 'admin',
			inputData: _scope.admin
		}, function(data){
			_services.toast.show('<img src="../assets/icons/checked.png" class="toast-tick"/>Your account updated successfully !!');
		}, function(err) {
			_services.toast.show(err.data);
		});
	}
	
	
}]);

