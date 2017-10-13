'use strict';
backMe
.service('PoupupServices', ['ngDialog', function(_ngDialog){
	
	this.init = function(_title, _msg, _successCallback, _errorCallback){
		_ngDialog.openConfirm({
			template: '<p class="title">'+_title+'</p>' +
				'<p class="msg">'+_msg+'</p>' +
				'<div class="ngdialog-buttons">'+
				'<button type="button" class="btn btn-xs btn-primary" ng-click="closeThisDialog(0)">Cancel</button>'+
				'<button type="button" class="btn btn-xs btn-primary" ng-click="closeThisDialog(1)">Okay</button>'+
				'</div>',
			plain: true,
			showClose: false
		}).then(function () {}, function (reason) {
			if(reason == 1)
				_successCallback();
			else
				_errorCallback();
		});
	};

	this.close = function() {
		_ngDialog.close();
	}
	
	this.customPopup = function(template, _successCallback, _errorCallback){
		_ngDialog.openConfirm({
			template: template,
			plain: true
		}).then(function () {}, function (reason) {
			if(reason == 1)
				_successCallback();
			else
				_errorCallback();
		});
	};
	
}]);