'use strict';
backMe.controller('adminCommentsCtrl', ['$scope', 'BaseServices', 'appConstant', '$timeout', '$state', 'Upload', '$rootScope', '$filter', function(_scope, _services, _appConstant, _timeout, _state, _http, _rootScope, _filter){
	
	_rootScope.adminTab = 'comments';
	_scope.comments = [];
	_scope.filter = {
		search: ''
	};
	_scope.init = function() {
		_scope.selectAll = false;
		_scope.cities = [];
		_services.http.serve({
			method: 'GET',
			url: _appConstant.baseUrl + 'admin/comments/abused'
		}, function(data){
			_scope.comments = data;
			_scope.commentsAll = data;
			_scope.pageSize = 10;
			_services.pagination.init(_scope, _scope.comments);
		}, function(err) {
			console.log(err)
		});
	}
	
	_scope.init();
	
	_services.main.applySorting(_scope);
	
	_scope.applySearch = function(_key) {
		_scope.comments = _filter('filter')(_scope.commentsAll, _key);
		_services.pagination.init(_scope, _scope.comments);
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

	_scope.deleteComment = function(_modal, topButton) {
		_scope.temp = {};
		_scope.selectedItems = [];
		if(topButton) {
			angular.forEach(_modal, function(_obj){
				if(_obj.selected)
					_scope.selectedItems.push(_obj.commentId)
			});
			if(!_scope.selectedItems.length){
				_services.toast.show('Please select the comment.');
				return;
			}
			_scope.temp = {
				commentId: _scope.selectedItems.join(",")
			}
		} else {
			_scope.temp = {
				commentId: _modal.commentId
			}
		}
		_services.popup.init("Delete", "Are you sure want delete this comment?", function(){
			_services.http.serve({
				method: 'DELETE',
				url: _appConstant.baseUrl + 'admin/comments/abused',
				inputData: _scope.temp
			}, function(data){
				_services.toast.show('<img src="../assets/icons/checked.png" class="toast-tick"/>Comment deleted successfully !!');
				_scope.init();
			}, function(err) {
				console.log(err)
			});
		}, function() {});
	}	
	
	_scope.unAbuseComment = function(_modal, topButton) {
		_scope.temp = {};
		_scope.selectedItems = [];
		if(topButton) {
			angular.forEach(_modal, function(_obj){
				if(_obj.selected)
					_scope.selectedItems.push(_obj.commentId)
			});
			if(!_scope.selectedItems.length){
				_services.toast.show('Please select the comment.');
				return;
			}
			_scope.temp = {
				abused: 'false',
				commentId: _scope.selectedItems.join(",")
			}
		} else {
			_scope.temp = {
				abused: 'false',
				commentId: _modal.commentId
			}
		}
		_services.popup.init("Abuse", "Are you sure want un abuse this comment?", function(){
			_services.http.serve({
				method: 'PUT',
				url: _appConstant.baseUrl + 'admin/comments/abused/status',
				inputData: _scope.temp
			}, function(data){
				_services.toast.show('<img src="../assets/icons/checked.png" class="toast-tick"/>Comment un abused successfully !!');
				_scope.init();
			}, function(err) {
				console.log(err)
			});
		}, function() {});
	}
	
}]);

