'use strict';
backMe.controller('paymentCtrl', ['$scope', 'BaseServices', '$timeout', '$state', 'appConstant', function(_scope, _services, _timeout, _state, _appConstant){

	/*if(!_scope.loggedIn) {
		_state.go('home');
	}*/
	
	_scope.paymentId = _state.params.paymentId;
    _scope.loggedUserId = _appConstant.currentUser.userId;
	_scope.payments = {};
	
	_scope.getPaymentDetails = function(_orderId) {
		_scope.payments = {};
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'payments/'+_orderId
		}, function(data){
			_scope.payments = data[0] ? data[0] : data;
			console.log(_scope.payments);
		}, function(err) {
			console.log(err)
		});
	}
	_scope.getPaymentDetails(_scope.paymentId);

}]);