'use strict';
backMe.controller('adminUsersCtrl', ['$scope', 'BaseServices', 'appConstant', '$timeout', '$state', 'Upload', '$rootScope', '$filter', function(_scope, _services, _appConstant, _timeout, _state, _http, _rootScope, _filter){
	
	_rootScope.adminTab = 'users';
	_scope.users = [];
	_scope.filter = {
		search: ''
	};
	_scope.init = function() {
		_scope.selectAll = false;
		_scope.users = [];
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'users'
		}, function(data){
			_scope.users = data;
			_scope.usersAll = data;
			_scope.pageSize = 10;
			_services.pagination.init(_scope, _scope.users);
		}, function(err) {
			console.log(err)
		});
	}
	
	_scope.init();
	
	_services.main.applySorting(_scope);
	
	_scope.applySearch = function(_key) {
		_scope.users = _filter('filter')(_scope.usersAll, _key);
		_services.pagination.init(_scope, _scope.users);
	}

	_scope.selectAllCheck = function(_list, isChecked) {
        angular.forEach(_list, function(_obj){
            _obj.selected = isChecked;
        });
		_scope.cbSelected = _filter('filter')(_list, {selected: true}).length;
	}
	
    _scope.unSelect = function(_list, isChecked) {
		_scope.cbSelected = _filter('filter')(_list, {selected: true}).length;
		if(!isChecked)
			_scope.selectAll = false;
		else {
			_scope.selectAll = true;
			angular.forEach(_list, function(_obj){
            	if(!_obj.selected) {
					_scope.selectAll = false;
					return;
				}
        	});
		}
	}
	
	_scope.deActivateUsers = function(_state, _modal, topButton) {
		_scope.temp = {};
		_scope.selectedItems = [];
		if(topButton) {
			angular.forEach(_modal, function(_obj){
				if(_obj.selected)
					_scope.selectedItems.push(_obj.userId)
			});
			if(!_scope.selectedItems.length){
				_services.toast.show('Please select the admin.');
				return;
			}
			_scope.temp = {
				status: _state,
				userId: _scope.selectedItems.join(",")
			}
		} else {
			if(_state == _modal.status) return;
			_scope.temp = {
				status: _state,
				userId: _modal.userId
			}
		}
		_services.popup.init(_scope.temp.status=='ACTIVE'? "Activate":"Deactivate", _scope.temp.status=='ACTIVE'?"Are you sure want Activate the user?" : "Are you sure want Deactivate the user?", function(){
			_services.http.serve({
				method: 'PUT',
				url: _appConstant.baseUrl + 'admin/users/status',
				inputData: _scope.temp
			}, function(data){
				if(_scope.temp.status=='ACTIVE')
					_services.toast.show('<img src="../assets/icons/checked.png" class="toast-tick"/>User activated successfully !!');
				else 
					_services.toast.show('<img src="../assets/icons/checked.png" class="toast-tick"/>User deactivated successfully !!');
				_scope.init();
			}, function(err) {
				console.log(err)
			});
		}, function() {});
	}
	
}]);

