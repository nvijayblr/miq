'use strict';
backMe.controller('adminPaymentsCtrl', ['$scope', 'BaseServices', 'appConstant', '$timeout', '$state', 'Upload', '$rootScope', '$filter', function(_scope, _services, _appConstant, _timeout, _state, _http, _rootScope, _filter){
	
	_rootScope.adminTab = 'payments';

	_scope.payments = [];
	_scope.filter = {
		search: ''
	};
	_scope.init = function() {
		_scope.users = [];
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'pay/history'
		}, function(data){
			_scope.payments = data;
			_scope.paymentsAll = data;
			_services.pagination.init(_scope, _scope.payments);
		}, function(err) {
			console.log(err)
		});
	}
	
	_scope.init();
	
	_services.main.applySorting(_scope);
	
	_scope.applySearch = function(_key) {
		_scope.payments = _filter('filter')(_scope.paymentsAll, _key);
		_services.pagination.init(_scope, _scope.payments);
	}
	
	
}]);

