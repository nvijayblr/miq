'use strict';
backMe.controller('rewardsCtrl', ['$scope', 'BaseServices', '$timeout', '$state', 'Upload', 'appConstant', function(_scope, _services, _timeout, _state, _http, _appConstant){
	_scope.step = 3;
	_scope.stepsTitle = "Support and services reward details against funding";
	_scope.projectId = _state.params.projectId;
	
	_scope.addRewardsSpendFields(_scope.projectId);
	
	_scope.startProfile = function (isValidForm) {
		if(!isValidForm) {
			angular.element('md-input-container .ng-invalid').first().focus();
			return;
		}
		
		if(_scope.project.posterImg || _scope.project.projectImages) {
			delete _scope.project.posterImg;
		  	delete _scope.project.projectImages;
		}		
		_scope.data = _scope.project;
		_scope.supportrewards = true;
		_scope.servicerewards = true;
		_scope.totAmt = 0;
		angular.forEach(_scope.project.supportrewards, function(_obj){
			_scope.totAmt = _scope.totAmt + parseInt(_obj.amount);
			if(!_obj.title || !_obj.amount || !_obj.description) {
				_services.toast.show('Support Rewards Title/Amount/Description should not be blank.');
				_scope.supportrewards = false;
				return;
			}
		});
		if(!_scope.supportrewards) return;
		if(_scope.totAmt > _scope.project.moneyNeeded) {
			_services.toast.show('Entering more amount than How much money I need.');
			return false; 
		}
		
		/*angular.forEach(_scope.project.servicerewards, function(_obj){
			if(!_obj.activityName || !_obj.amount || !_obj.description || !_obj.availableDate) {
				_services.toast.show('Service Rewards Title/Amount/Description should not be blank.');
				_scope.servicerewards = false;
				return;
			}
		});
		if(!_scope.servicerewards) return;*/
		_scope.totAmt = 0;
		angular.forEach(_scope.project.servicerewards, function(_obj){
			_scope.totAmt = _scope.totAmt + parseInt(_obj.amount);
		});
		if(_scope.totAmt > _scope.project.moneyNeeded) {
			_services.toast.show('Total of the service rewards amount should not be greater than Money needed.');
			return false; 
		}
		if(_scope.project.stepsCompleted < _scope.step) {
			_scope.project.stepsCompleted = _scope.step;
		}
		_http.upload({
			method: 'POST',
			url: _appConstant.baseUrl + 'projects',
			data: _scope.data
		}).then(function (data) {
			_services.toast.showProject('Project details upated successfully !!');
		  if(_scope.edit) {
			_state.go('edit.profile', {'projectId': _scope.projectId});
		  } else {
			_state.go('create.profile', {'projectId': _scope.projectId});
		  }
		}, function (err) {
			_services.toast.show(err.data);
			console.log(err);
		});
	}
	
	_scope.addSupportRewards = function(_support) {
		_support.push({
			projectId: _scope.project.projectId,
			userId: _scope.project.userId,
			amount: '',
			title: '',
			description: ''
		});
	}
	
	_scope.addServiceRewards = function(_service) {
		_service.push({
			projectId: _scope.project.projectId,
			userId: _scope.project.userId,
			amount: '',
			activityName: '',
			availableDate: '',
			description: ''
		});
	}
	
	_scope.deleteSupportRewards = function(_support, _index) {
		_support.splice(_index, 1);
	}
	_scope.deleteServiceRewards = function(_service, _index) {
		_service.splice(_index, 1);
	}
	
}]);