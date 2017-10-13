'use strict';
backMe.controller('adminPromotionsCtrl', ['$scope', 'BaseServices', 'appConstant', '$timeout', '$state', 'Upload', '$rootScope', '$filter', function(_scope, _services, _appConstant, _timeout, _state, _http, _rootScope, _filter){
	
	_rootScope.adminTab = 'promotions';
	_scope.projects = [];
	_scope.filter = {
		search: ''
	};
	_scope.init = function() {
		_scope.selectAll = false;
		_scope.projects = [];
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'admin/promotedProjects?role='+_appConstant.currentAdmin.role+'&adminId='+_appConstant.currentAdmin.adminId
		}, function(data){
			_scope.projects = data;
			_scope.projectsAll = data;
			_scope.pageSize = 20;
			_services.pagination.init(_scope, _scope.projectsAll);
		}, function(err) {
			console.log(err)
		});
	}
	
	_scope.init();
	
	_services.main.applySorting(_scope);
	
	_scope.applySearch = function(_key) {
		_scope.projects = _filter('filter')(_scope.projectsAll, _key);
		_services.pagination.init(_scope, _scope.projects);
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

	_scope.deActivateProjects = function(_state, _modal, topButton) {
		_scope.selectedItems = [];
		_scope.temp = {};
		if(topButton) {
			angular.forEach(_modal, function(_obj){
				if(_obj.selected)
					_scope.selectedItems.push(_obj.projectId)
			});
			if(!_scope.selectedItems.length){
				_services.toast.show('Please select the projects.');
				return;
			}
			_scope.temp = {
				status: _state,
				projectId: _scope.selectedItems.join(",")
			}
		} else {
			if(_state == _modal.status) return;
			_scope.temp = {
				status: _state,
				projectId: _modal.projectId,
				type: _modal.type
			}
		}
		_services.popup.init(_scope.temp.status=='ACTIVE'? "Activate":"Deactivate", _scope.temp.status=='ACTIVE'?"Are you sure want Activate the promotion?" : "Are you sure want Deactivate the promotion?", function(){
			_services.http.serve({
				method: 'PUT',
				url: _appConstant.baseUrl + 'admin/promotion/status',
				inputData: _scope.temp
			}, function(data){
				if(_scope.temp.status=='ACTIVE')
					_services.toast.show('<img src="../assets/icons/checked.png" class="toast-tick"/>Promotion activated successfully !!');
				else 
					_services.toast.show('<img src="../assets/icons/checked.png" class="toast-tick"/>Promotion deactivated successfully !!');
				_scope.init();
			}, function(err) {
				console.log(err)
			});
		}, function() {});
	}	
	
}]);

