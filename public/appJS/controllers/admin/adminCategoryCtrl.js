'use strict';
backMe.controller('adminCategoryCtrl', ['$scope', 'BaseServices', 'appConstant', '$timeout', '$state', 'Upload', '$rootScope', '$filter', function(_scope, _services, _appConstant, _timeout, _state, _http, _rootScope, _filter){
	
	_rootScope.adminTab = 'category';
	_scope.categories = [];
	_scope.filter = {
		search: ''
	};
	_scope.init = function() {
		_scope.selectAll = false;
		_scope.categories = [];
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'category'
		}, function(data){
			_scope.categories = data;
			_scope.categoriesAll = data;
			_scope.pageSize = 10;
			_services.pagination.init(_scope, _scope.categories);
		}, function(err) {
			console.log(err)
		});
	}
	
	_scope.init();
	
	_services.main.applySorting(_scope);
	
	_scope.applySearch = function(_key) {
		_scope.categories = _filter('filter')(_scope.categoriesAll, _key);
		_services.pagination.init(_scope, _scope.categories);
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

	_scope.category = {
		name: '',
		description: ''
	}
	_scope.mode = 'POST';
	_scope.app = {};
	_scope.showAddEditModal = function(_mode, _modal) {
		_scope.mode = _mode;
		_scope.app.addEditFrm.$setPristine();
		_scope.app.addEditFrm.$setUntouched();
		_scope.app.addEditFrm.$submitted = false;
		_scope.category = {
			name: '',
			description: ''
		}
		if(_scope.mode == 'PUT') {
			angular.copy(_modal, _scope.category);
		}
		$('#addEditModal').modal('show');
	}
	
	_scope.registerAddEdit = function() {
		_services.http.serve({
			method: _scope.mode,
			url: _appConstant.baseUrl + 'category',
			inputData: _scope.category
		}, function(data){
			if(_scope.mode == 'POST') {
				_services.toast.show('<img src="../assets/icons/checked.png" class="toast-tick"/>Category created successfully !!');
			} else {
				_services.toast.show('<img src="../assets/icons/checked.png" class="toast-tick"/>Category updated successfully !!');
			}
			$('#addEditModal').modal('hide');
			_scope.init();
		}, function(err) {
			console.log(err);
		});
	}
	
	_scope.deleteCategory = function(_modal, topButton) {
		_scope.temp = {};
		_scope.selectedItems = [];
		if(topButton) {
			angular.forEach(_modal, function(_obj){
				if(_obj.selected)
					_scope.selectedItems.push(_obj.categoryId)
			});
			if(!_scope.selectedItems.length){
				_services.toast.show('Please select the category.');
				return;
			}
			_scope.temp = {
				categoryId: _scope.selectedItems.join(",")
			}
		} else {
			_scope.temp = {
				categoryId: _modal.categoryId
			}
		}
		_services.popup.init("Delete", "Are you sure want delete?", function(){
			_services.http.serve({
				method: 'DELETE',
				url: _appConstant.baseUrl + 'category',
				inputData: _scope.temp
			}, function(data){
				_services.toast.show('<img src="../assets/icons/checked.png" class="toast-tick"/>Category deleted successfully !!');
				_scope.init();
			}, function(err) {
				console.log(err)
			});
		}, function() {});
	}		
}]);


