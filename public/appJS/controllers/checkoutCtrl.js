'use strict';
backMe.controller('checkoutCtrl', ['$scope', 'BaseServices', '$timeout', '$state', '$rootScope', '$sce', 'appConstant', function(_scope, _services, _timeout, _state, _rootScope, _sce, _appConstant){

	_scope.courseCode = _state.params.courseId;
	
	_scope.courses = {};
	_scope.checkout = {
		courseId: '',
		userId: _appConstant.currentUser.userId,
		TXN_AMOUNT: 0,
		firstName: _appConstant.currentUser.name,
		lastName: '',
		email: _appConstant.currentUser.email,
		mobileNumber: _appConstant.currentUser.mobileNumber,
		paythrough: 'Paytm'
	};
    
	_scope.loadCart = function() {
		if(!_appConstant.currentUser.userId) {
			return;
		}
		_scope.checkout.TXN_AMOUNT = 0;
		_scope.courses = {};
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'cart?userId=' + _appConstant.currentUser.userId
		}, function(data){
			_scope.courses = data;
			_scope.checkout.courseId = [];
			for(var i=0; i<_scope.courses.length; i++) {
				_scope.checkout.TXN_AMOUNT = _scope.checkout.TXN_AMOUNT + _scope.courses[i].fees;
				_scope.checkout.courseId.push(_scope.courses[i].courseId);
			}
			_scope.checkout.courseId = _scope.checkout.courseId.join(',')
			_rootScope.cartCount = data.length;
		}, function(err) {
			console.log(err)
		});
	}

	_scope.init = function() {
		_scope.courses = {};
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'courses/' + _scope.courseCode
		}, function(data){
			_scope.courses = data;
			if(_scope.courses.length == 0) {
				_state.go('home');
				return;
			}
			_scope.checkout.courseId = _scope.courses[0].courseId;
			_scope.checkout.TXN_AMOUNT = _scope.courses[0].fees;
		}, function(err) {
			console.log(err)
		});
	}
	
	if(_scope.courseCode == 'cart') {
		_scope.loadCart();
	} else {
		_scope.init();
	}
	
	_scope.removeCart = function(_course) {
		if(!_appConstant.currentUser.userId) {
			return;
		}
		_scope.courses = {};
		_services.http.serve({
			method: 'DELETE',
			url: _appConstant.baseUrl + 'cart?userId=' + _appConstant.currentUser.userId + '&courseId=' + _course.courseId
		}, function(data){
			_scope.loadCart();
		}, function(err) {
			console.log(err)
		});
	}

	_scope.makePaytmPayment = function(isValidForm) {
		if(!isValidForm) {
			angular.element('md-input-container .ng-invalid').first().focus();
			return;
		}
		if(_scope.checkout.paythrough != 'Paytm') {
			_scope.rzpPayment();
			return;
		}
		//Paytm Integration
		_scope.checkout.purpose = 'PURCHASE';
		_services.http.serve({
			method: 'POST',
			url: _appConstant.baseUrl + 'pay-paytm',
			inputData: _scope.checkout
		}, function(data){
			_scope.checkoutFrm = _sce.trustAsHtml(data);
		}, function(err) {
			console.log(err)
		});
	}
	
	_scope.rzpPayment = function(e) {
		var options = {
			"key": "rzp_test_jGwG0sNdTkwJrx",
			"amount": parseInt(_scope.checkout.TXN_AMOUNT)*100,
			"name": _appConstant.currentUser.name ? _appConstant.currentUser.name : _appConstant.currentUser.email,
			"description": "Payment Description",
			"image": "/assets/images/logo.png",
			"handler": function (response){
				if(response.razorpay_payment_id) {
					_scope.registerPayment(response.razorpay_payment_id);
				}
			},
			"prefill": {
				"name": _scope.checkout.firstName + " " + _scope.checkout.lastname,
				"email": _scope.checkout.email,
				"contact": _scope.checkout.mobileNumber
			},
			"notes": {
				"address": "Bangalore"
			},
			"theme": {
				"color": "#F37254"
			}
		};
		var rzp1 = new Razorpay(options);
		rzp1.open();
    	//e.preventDefault();
	}

	_scope.registerPayment = function(_transactionId) {
		_scope.paymentData = {
			courseId: _scope.checkout.courseId,
			userId: _scope.checkout.userId,
			amount: _scope.checkout.TXN_AMOUNT,
			currency: 'INR',
			txnId: _transactionId,
			txnStatus: 'TXN_SUCCESS',
			payThrough: 'Razorpay',
			firstName: _scope.checkout.firstName,
			lastName: _scope.checkout.lastName,
			email: _scope.checkout.email,
			mobileNumber: _scope.checkout.mobileNumber,
			purpose: 'PURCHASE'
		};
		_services.http.serve({
			method: 'POST',
			url: _appConstant.baseUrl + 'registerPayment',
			inputData: _scope.paymentData
		}, function(data){
			if(data.orderId) {
				_state.go('payment', {paymentId:data.orderId});
			}
		}, function(err) {
			console.log(err)
		});
	}
}]);

